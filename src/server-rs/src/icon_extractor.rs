//! High-resolution icon extractor for Windows executables
//! Directly parses PE resource sections to extract icons (including 256x256 PNG)
//!
//! # PE Resource Icon Structure
//! - ICON_GROUP (RT_GROUP_ICON): Contains ICONDIR, points to ICON_IMAGE entries
//! - ICON_IMAGE (RT_ICON): Raw bitmap/PNG data for each icon size
//!
//! Modern executables store 256x256 icons as PNG-compressed data inside ICON_IMAGE

use base64::Engine;
use image::ImageEncoder;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::mem::size_of;
use std::path::Path;
use thiserror::Error;

#[cfg(windows)]
use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON, SHGFI_ADDOVERLAYS};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, HICON, ICONINFO};
#[cfg(windows)]
use windows::Win32::System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED};
#[cfg(windows)]
use windows::core::PCWSTR;

// =============================================================================
// Error Types
// =============================================================================

#[derive(Error, Debug)]
pub enum IconError {
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Failed to open file: {0}")]
    FileOpenFailed(#[from] std::io::Error),

    #[error("Invalid PE file format")]
    InvalidPeFormat,

    #[error("Missing .rsrc section")]
    MissingResourceSection,

    #[error("Resource entry not found")]
    ResourceNotFound,

    #[error("Icon directory invalid")]
    InvalidIconDirectory,

    #[error("Icon image data corrupted at index {0}")]
    CorruptedIconImage(usize),

    #[error("No icons found in file")]
    NoIconsFound,

    #[error("PNG decoding failed: {0}")]
    PngDecodeFailed(String),

    #[error("Image buffer creation failed")]
    BufferCreationFailed,
}

impl From<IconError> for String {
    fn from(e: IconError) -> Self {
        e.to_string()
    }
}

// =============================================================================
// PE File Structures (Windows headers without Windows SDK)
// =============================================================================

/// DOS header (MZ header)
#[repr(C)]
struct DosHeader {
    e_magic: u16,        // "MZ" = 0x5A4D
    e_cblp: u16,
    e_cp: u16,
    e_crlc: u16,
    e_cparhdr: u16,
    e_minalloc: u16,
    e_maxalloc: u16,
    e_ss: u16,
    e_sp: u16,
    e_csum: u16,
    e_ip: u16,
    e_cs: u16,
    e_lfarlc: u16,
    e_ovno: u16,
    e_res: [u16; 4],
    e_oemid: u16,
    e_oeminfo: u16,
    e_res2: [u16; 10],
    e_lfanew: i32,       // Offset to PE header
}

/// PE signature
const PE_SIGNATURE: u32 = 0x00004550; // "PE\0\0"

/// PE header (COFF header)
#[repr(C)]
struct CoffHeader {
    machine: u16,
    number_of_sections: u16,
    time_date_stamp: u32,
    pointer_to_symbol_table: u32,
    number_of_symbols: u32,
    size_of_optional_header: u16,
    characteristics: u16,
}

/// Optional header magic
const PE32_MAGIC: u16 = 0x10B;
const PE32_PLUS_MAGIC: u16 = 0x20B;

/// Data directory entry
#[repr(C)]
struct DataDirectory {
    virtual_address: u32,
    size: u32,
}

/// Section header
#[derive(Clone)]
#[repr(C)]
struct SectionHeader {
    name: [u8; 8],
    virtual_size: u32,
    virtual_address: u32,
    size_of_raw_data: u32,
    pointer_to_raw_data: u32,
    pointer_to_relocations: u32,
    pointer_to_line_numbers: u32,
    number_of_relocations: u16,
    number_of_line_numbers: u16,
    characteristics: u32,
}

// =============================================================================
// Resource Directory Structures
// =============================================================================

/// Resource directory header
#[repr(C)]
struct ResourceDirectoryHeader {
    characteristics: u32,
    time_date_stamp: u32,
    major_version: u16,
    minor_version: u16,
    number_of_named_entries: u16,
    number_of_id_entries: u16,
}

/// Resource directory entry
#[repr(C)]
#[derive(Clone, Copy)]
struct ResourceDirectoryEntry {
    name_or_id: u32,
    offset_to_data: u32,
}

impl ResourceDirectoryEntry {
    fn is_subdirectory(&self) -> bool {
        (self.offset_to_data & 0x80000000) != 0
    }
    fn offset(&self) -> u32 {
        self.offset_to_data & 0x7FFFFFFF
    }
    fn id(&self) -> u32 {
        self.name_or_id & 0x7FFFFFFF
    }
}

/// PNG file signature
const PNG_SIGNATURE: [u8; 8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

// =============================================================================
// ICON Structures
// =============================================================================

/// ICONDIR header (at beginning of icon resource)
#[repr(C)]
struct IconDirHeader {
    reserved: u16,      // Must be 0
    type_: u16,          // 1 for icons
    count: u16,          // Number of images
}

/// ICONDIRENTRY (one per image in the group)
#[repr(C)]
struct IconDirEntry {
    width: u8,           // Width (0 = 256)
    height: u8,           // Height (0 = 256)
    color_count: u8,     // Number of colors (0 if > 256)
    reserved: u8,        // Must be 0
    planes: u16,         // Color planes (usually 1)
    bit_count: u16,      // Bits per pixel
    bytes_in_res: u32,   // Size of image data
    image_offset: u32,   // Offset to image data from beginning of file
}

impl IconDirEntry {
    fn width_px(&self) -> u32 {
        if self.width == 0 { 256 } else { self.width as u32 }
    }
    fn height_px(&self) -> u32 {
        if self.height == 0 { 256 } else { self.height as u32 }
    }
}

/// Icon extraction result containing PNG data
#[derive(Debug)]
pub struct IconData {
    /// Raw PNG bytes
    pub png_data: Vec<u8>,
    /// Original width in pixels
    pub width: u32,
    /// Original height in pixels
    pub height: u32,
    /// Whether this is a PNG-compressed image (vs BMP)
    pub is_png: bool,
}

/// Extract the largest high-resolution icon from an executable
///
/// # Arguments
/// * `path` - Path to the .exe or .dll file
///
/// # Returns
/// * `IconData` containing PNG bytes and metadata
///
/// # Example
/// ```ignore
/// use icon_extractor::extract_largest_icon;
///
/// let result = extract_largest_icon("C:\\Program Files\\App\\app.exe").unwrap();
/// println!("Icon: {}x{}, PNG: {}", result.width, result.height, result.is_png);
/// std::fs::write("icon.png", &result.png_data).unwrap();
/// ```
pub fn extract_largest_icon(path: impl AsRef<Path>) -> Result<IconData, IconError> {
    let path = path.as_ref();
    if !path.exists() {
        return Err(IconError::FileNotFound(path.display().to_string()));
    }

    let mut file = File::open(path)?;
    let icons = extract_all_icons_from_pe(&mut file)?;

    icons.into_iter()
        .max_by_key(|icon| icon.width * icon.height)
        .ok_or(IconError::NoIconsFound)
}

/// Extract all icons from an executable, sorted by size (largest first)
pub fn extract_all_icons(path: impl AsRef<Path>) -> Result<Vec<IconData>, IconError> {
    let path = path.as_ref();
    if !path.exists() {
        return Err(IconError::FileNotFound(path.display().to_string()));
    }

    // Try PE extraction first
    let mut file = File::open(path)?;
    if let Ok(mut icons) = extract_all_icons_from_pe(&mut file) {
        if !icons.is_empty() {
            icons.sort_by(|a, b| (b.width * b.height).cmp(&(a.width * a.height)));
            return Ok(icons);
        }
    }

    // For non-PE files (like .lnk shortcuts), use Windows Shell API
    #[cfg(windows)]
    {
        // Use Shell API as fallback for any file type when PE extraction fails
        if let Ok(icon) = extract_icon_from_shortcut(path) {
            return Ok(vec![icon]);
        }
    }

    Err(IconError::NoIconsFound)
}

/// Get icon as base64 data URL
pub fn extract_icon_base64(path: impl AsRef<Path>) -> Result<String, IconError> {
    // Use extract_all_icons which handles both PE files and non-PE files (like .lnk shortcuts)
    // Icons are already sorted by size (largest first) from extract_all_icons
    let icons = extract_all_icons(path)?;
    icons.into_iter()
        .next()
        .map(|icon| {
            let encoded = base64::engine::general_purpose::STANDARD.encode(&icon.png_data);
            format!("data:image/png;base64,{}", encoded)
        })
        .ok_or(IconError::NoIconsFound)
}

/// Alias for backward compatibility
#[allow(dead_code)]
pub fn get_icon_base64(path: &str) -> Result<String, IconError> {
    extract_icon_base64(path)
}

// =============================================================================
// Windows Shell Icon Extraction (for non-PE files like .lnk shortcuts)
// =============================================================================

#[cfg(windows)]
fn extract_icon_from_shortcut(path: &Path) -> std::result::Result<IconData, IconError> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES;

    // Try to resolve the shortcut target and extract icon from target
    if let Some(target_path) = resolve_shortcut_target(path) {
        if target_path.exists() {
            // Try PE extraction first (works for exe/dll)
            if let Ok(mut file) = std::fs::File::open(&target_path) {
                if let Ok(mut icons) = extract_all_icons_from_pe(&mut file) {
                    if !icons.is_empty() {
                        icons.sort_by(|a, b| (b.width * b.height).cmp(&(a.width * a.height)));
                        return Ok(icons.into_iter().next().unwrap());
                    }
                }
            }
        }
    }

    // Fallback to shell API extraction
    unsafe {
        // Initialize COM
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        // Get the path as a wide string
        let path_wide: Vec<u16> = OsStr::new(path.to_str().unwrap_or(""))
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();

        // Get shell file info
        let mut file_info = SHFILEINFOW::default();

        let _result = SHGetFileInfoW(
            PCWSTR::from_raw(path_wide.as_ptr()),
            FILE_FLAGS_AND_ATTRIBUTES(0),
            Some(&mut file_info),
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_LARGEICON | SHGFI_ADDOVERLAYS,
        );

        if file_info.hIcon.is_invalid() {
            return Err(IconError::NoIconsFound);
        }

        // Extract icon data using Windows API
        let icon_data = extract_icon_from_hicon(file_info.hIcon);

        // Destroy the icon
        let _ = DestroyIcon(file_info.hIcon);

        icon_data
    }
}

/// Resolve a .lnk shortcut to its target path
#[cfg(windows)]
fn resolve_shortcut_target(path: &Path) -> Option<std::path::PathBuf> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED, IPersistFile, STGM};
    use windows::Win32::UI::Shell::IShellLinkW;
    use windows::Win32::Storage::FileSystem::WIN32_FIND_DATAW;
    use windows::core::{PCWSTR, Interface};

    unsafe {
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        // Create IShellLink instance
        let shell_link: Result<IShellLinkW, _> = CoCreateInstance(
            &windows::Win32::UI::Shell::ShellLink,
            None,
            CLSCTX_INPROC_SERVER,
        );

        if let Ok(link) = shell_link {
            // Get the path as a wide string
            let path_wide: Vec<u16> = OsStr::new(path.to_str().unwrap_or(""))
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();

            // Use IPersistFile to load the shortcut
            let persist_file: Result<IPersistFile, _> = link.cast();
            if let Ok(pf) = persist_file {
                let _ = pf.Load(PCWSTR::from_raw(path_wide.as_ptr()), STGM(0));

                // Get the target path
                let mut target_buf = [0u16; 260];
                let mut find_data: WIN32_FIND_DATAW = std::mem::zeroed();
                let result = link.GetPath(&mut target_buf, &mut find_data, 0);

                if result.is_ok() {
                    // Find null terminator and convert to String
                    let len = target_buf.iter().position(|&c| c == 0).unwrap_or(260);
                    if len > 0 {
                        // Convert wide string to PathBuf
                        let path_string = String::from_utf16_lossy(&target_buf[..len]);
                        let target = Path::new(&path_string);
                        if target.exists() {
                            return Some(target.to_path_buf());
                        }
                    }
                }
            }
        }
    }

    None
}

#[cfg(windows)]
fn extract_icon_from_hicon(hicon: HICON) -> std::result::Result<IconData, IconError> {
    use windows::Win32::Graphics::Gdi::*;

    unsafe {
        // Check if icon handle is valid
        if hicon.is_invalid() {
            return Err(IconError::NoIconsFound);
        }

        // Get icon info
        let mut icon_info = ICONINFO::default();
        if GetIconInfo(hicon, &mut icon_info).is_err() {
            return Err(IconError::NoIconsFound);
        }

        // Get the screen DC
        let hdc_screen = GetDC(None);

        // Create a memory DC
        let hdc_mem = CreateCompatibleDC(Some(hdc_screen));

        // Get the bitmap dimensions using GetObjectW
        let mut bitmap: BITMAP = std::mem::zeroed();
        let bitmap_size = std::mem::size_of::<BITMAP>() as i32;

        let hbm = if !icon_info.hbmColor.is_invalid() {
            icon_info.hbmColor
        } else {
            icon_info.hbmMask
        };

        if GetObjectW(HGDIOBJ(hbm.0), bitmap_size, Some(&mut bitmap as *mut _ as *mut _)) == 0 {
            let _ = DeleteDC(hdc_mem);
            let _ = ReleaseDC(None, hdc_screen);
            return Err(IconError::NoIconsFound);
        }

        let width = bitmap.bmWidth as u32;
        let height = bitmap.bmHeight as u32;

        // Get the bitmap bits using GetDIBits
        let mut bitmap_info = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: bitmap.bmWidth,
                biHeight: -(bitmap.bmHeight), // Negative for top-down
                biPlanes: bitmap.bmPlanes,
                biBitCount: bitmap.bmBitsPixel,
                biCompression: BI_RGB.0 as u32,
                biSizeImage: 0,
                biXPelsPerMeter: 0,
                biYPelsPerMeter: 0,
                biClrUsed: 0,
                biClrImportant: 0,
            },
            bmiColors: [RGBQUAD::default()],
        };

        let mut bits: Vec<u8> = vec![0u8; (width * height * 4) as usize];
        let scan_lines = GetDIBits(
            hdc_mem,
            icon_info.hbmColor,
            0,
            height,
            Some(bits.as_mut_slice() as *mut _ as *mut _),
            &mut bitmap_info as *mut _ as *mut _,
            DIB_RGB_COLORS,
        );

        let _ = DeleteDC(hdc_mem);
        let _ = ReleaseDC(None, hdc_screen);

        if scan_lines == 0 {
            return Err(IconError::NoIconsFound);
        }

        // Convert BGRA to RGBA (no flip needed - biHeight negative means top-down DIB)
        let mut rgba_bits = Vec::with_capacity((width * height * 4) as usize);
        for y in 0..height as usize {
            for x in 0..(width as usize) {
                let idx = (y * width as usize + x) * 4;
                if idx + 3 < bits.len() {
                    rgba_bits.push(bits[idx + 2]); // R
                    rgba_bits.push(bits[idx + 1]); // G
                    rgba_bits.push(bits[idx]);     // B
                    rgba_bits.push(bits[idx + 3]); // A
                }
            }
        }

        // Create image buffer and encode to PNG
        let img_buffer = image::ImageBuffer::<image::Rgba<u8>, Vec<u8>>::from_raw(
            width,
            height,
            rgba_bits,
        ).ok_or(IconError::BufferCreationFailed)?;

        let mut png_data = Vec::new();
        let encoder = image::codecs::png::PngEncoder::new(&mut png_data);
        encoder.write_image(
            &img_buffer,
            width,
            height,
            image::ColorType::Rgba8,
        ).map_err(|_| IconError::PngDecodeFailed("encoding failed".to_string()))?;

        Ok(IconData {
            png_data,
            width,
            height,
            is_png: true,
        })
    }
}

#[cfg(not(windows))]
fn extract_icon_from_shortcut(_path: &Path) -> std::result::Result<IconData, IconError> {
    Err(IconError::InvalidPeFormat)
}

// =============================================================================
// PE Parsing Functions
// =============================================================================

fn extract_all_icons_from_pe(file: &mut File) -> Result<Vec<IconData>, IconError> {
    // 1. Read DOS header
    let dos_header = read_dos_header(file)?;

    // 2. Seek to PE header
    file.seek(SeekFrom::Start(dos_header.e_lfanew as u64))?;

    // 3. Read PE signature
    let mut signature = [0u8; 4];
    file.read_exact(&mut signature)?;
    if u32::from_le_bytes(signature) != PE_SIGNATURE {
        return Err(IconError::InvalidPeFormat);
    }

    // 4. Read COFF header
    let coff_header = read_coff_header(file)?;

    // 5. Calculate where section headers start (right after optional header)
    let section_headers_offset = dos_header.e_lfanew as u64 + 4 + 20 + coff_header.size_of_optional_header as u64;

    // 6. Read optional header magic to determine PE32/PE32+
    let magic = read_u16(file)?;
    let is_pe32plus = match magic {
        PE32_MAGIC => false,
        PE32_PLUS_MAGIC => true,
        _ => return Err(IconError::InvalidPeFormat),
    };

    // 7. Skip to data directories and read resource RVA
    // PE32+: data directories start at offset 112 from start of optional header
    // We already read 2 bytes (magic), so skip 110 more to reach data directories
    let data_dir_skip = if is_pe32plus { 110 } else { 94 }; // PE32+ data dirs at 112, PE32 at 96
    file.seek(SeekFrom::Current(data_dir_skip as i64))?;

    eprintln!("DEBUG: after skip to data dirs, pos: {}", file.stream_position().unwrap_or(0));

    // Skip export (0) + import (1) directories, then read resource (2)
    skip_data_directories(file, 2)?;
    let dd = read_data_directory(file)?;
    eprintln!("DEBUG: resource dir: RVA=0x{:X}, Size=0x{:X}", dd.virtual_address, dd.size);
    let rsrc_rva = dd.virtual_address;

    if rsrc_rva == 0 {
        return Err(IconError::MissingResourceSection);
    }

    // Debug: print section headers offset and rsrc info
    eprintln!("DEBUG: section_headers_offset={}, rsrc_rva=0x{:X}", section_headers_offset, rsrc_rva);

    // 8. Seek to section headers and read them
    eprintln!("DEBUG: about to seek to {}", section_headers_offset);
    file.seek(SeekFrom::Start(section_headers_offset))?;
    eprintln!("DEBUG: seek successful, current pos: {}", file.stream_position().unwrap_or(0));
    let sections = read_section_headers(file, coff_header.number_of_sections as usize)?;

    for sec in &sections {
        let name_raw: &[u8; 8] = &sec.name;
        let name = String::from_utf8_lossy(name_raw);
        eprintln!("DEBUG:   Section '{:?}': VA=0x{:X}, VSize=0x{:X}, RawPtr=0x{:X}, RawSize=0x{:X}",
            name, sec.virtual_address, sec.virtual_size, sec.pointer_to_raw_data, sec.size_of_raw_data);
    }

    // 9. Find section containing resource RVA
    let rsrc_section = sections.iter()
        .find(|s| {
            s.virtual_address != 0 &&
            s.virtual_size != 0 &&
            rsrc_rva >= s.virtual_address &&
            rsrc_rva < s.virtual_address + s.virtual_size
        });

    let rsrc_file_offset = match rsrc_section {
        Some(sec) => sec.pointer_to_raw_data + (rsrc_rva - sec.virtual_address),
        None => return Err(IconError::MissingResourceSection),
    };

    eprintln!("DEBUG: rsrc_section found, file_offset=0x{:X}", rsrc_file_offset);

    // First try: Direct PNG scanning (most reliable for high-res icons)
    eprintln!("DEBUG: Trying direct PNG scanning first");
    let mut all_icons = scan_sections_for_png_icons(file, &sections)?;
    eprintln!("DEBUG: Found {} icons via direct PNG scan", all_icons.len());

    // Also try resource tree walk for additional icons (BMP format)
    let icon_groups = find_all_icon_groups(file, rsrc_file_offset, &sections)?;
    if !icon_groups.is_empty() {
        eprintln!("DEBUG: Found {} RT_GROUP_ICON entries via resource tree", icon_groups.len());
        for (_group_rva, group_file_offset) in icon_groups {
            if let Ok(icons) = extract_all_icons_from_group(file, &sections, group_file_offset) {
                eprintln!("DEBUG: ICONDIR group at 0x{:X}: {} icons", group_file_offset, icons.len());
                all_icons.extend(icons);
            }
        }
    }

    if all_icons.is_empty() {
        return Err(IconError::NoIconsFound);
    }

    // Remove duplicates (same dimensions)
    all_icons.sort_by(|a, b| (b.width * b.height).cmp(&(a.width * a.height)));
    all_icons.dedup_by(|a, b| a.width == b.width && a.height == b.height);

    eprintln!("DEBUG: Total unique icons: {}", all_icons.len());
    Ok(all_icons)
}

/// Scan all sections for PNG icons and extract them directly
fn scan_sections_for_png_icons(file: &mut File, sections: &[SectionHeader]) -> Result<Vec<IconData>, IconError> {
    let mut icons = Vec::new();

    for sec in sections {
        if sec.pointer_to_raw_data == 0 || sec.size_of_raw_data == 0 {
            continue;
        }

        let file_offset = sec.pointer_to_raw_data;
        let section_size = sec.size_of_raw_data as usize;

        if section_size < 16 {
            continue;
        }

        // Read section data
        let mut buffer = vec![0u8; section_size];
        if file.seek(SeekFrom::Start(file_offset as u64)).is_err() {
            continue;
        }
        if file.read_exact(&mut buffer).is_err() {
            continue;
        }

        // Scan for PNG signatures
        let mut pos = 0;
        while pos + 16 <= section_size {
            // Check for PNG signature
            if buffer[pos] == 0x89 && buffer[pos + 1] == 0x50 &&
               buffer[pos + 2] == 0x4E && buffer[pos + 3] == 0x47 {
                // Found PNG - try to get dimensions
                if let Some((w, h)) = get_png_dimensions_from_data(&buffer[pos..]) {
                    // Only accept reasonably-sized icons (>= 16x16)
                    if w >= 16 && h >= 16 {
                        let png_data = buffer[pos..].to_vec();
                        icons.push(IconData {
                            png_data,
                            width: w,
                            height: h,
                            is_png: true,
                        });
                        eprintln!("DEBUG: Found PNG at offset 0x{:X}: {}x{}", file_offset + pos as u32, w, h);
                    }
                }
            }
            pos += 1;
        }
    }

    Ok(icons)
}

/// Get PNG dimensions from PNG data without full validation
fn get_png_dimensions_from_data(data: &[u8]) -> Option<(u32, u32)> {
    if data.len() < 24 {
        return None;
    }

    // Check PNG signature
    if &data[0..8] != PNG_SIGNATURE {
        return None;
    }

    // IHDR chunk is at offset 8
    // Width is at offset 16, height at offset 20 (big-endian)
    let width = u32::from_be_bytes([data[16], data[17], data[18], data[19]]);
    let height = u32::from_be_bytes([data[20], data[21], data[22], data[23]]);

    // Sanity check - max reasonable size is 1024 for icons
    if width > 0 && width <= 1024 && height > 0 && height <= 1024 {
        Some((width, height))
    } else {
        None
    }
}

/// Find all RT_GROUP_ICON entries by walking the resource directory tree
fn find_all_icon_groups(
    file: &mut File,
    rsrc_offset: u32,
    sections: &[SectionHeader],
) -> Result<Vec<(u32, u32)>, IconError> {
    // RT_GROUP_ICON = 14 (0x0E)
    const RT_GROUP_ICON: u32 = 14;

    let mut results = Vec::new();

    // Walk the resource tree to find all icon groups
    walk_resource_tree_for_type(file, rsrc_offset, RT_GROUP_ICON, &mut results, sections)?;

    Ok(results)
}

/// Walk resource tree to find entries of a specific type (e.g., RT_GROUP_ICON)
/// Returns file offsets where ICONDIR structures are found
fn walk_resource_tree_for_type(
    file: &mut File,
    dir_offset: u32,
    target_type: u32,
    results: &mut Vec<(u32, u32)>,
    sections: &[SectionHeader],
) -> Result<(), IconError> {
    // Read resource directory header
    file.seek(SeekFrom::Start(dir_offset as u64))?;

    let mut header_buffer = vec![0u8; size_of::<ResourceDirectoryHeader>()];
    if file.read_exact(&mut header_buffer).is_err() {
        return Ok(()); // Not a valid directory
    }

    let num_named = u16::from_le_bytes([header_buffer[12], header_buffer[13]]);
    let num_id = u16::from_le_bytes([header_buffer[14], header_buffer[15]]);
    let total_entries = (num_named as usize) + (num_id as usize);

    if total_entries == 0 || total_entries > 1000 {
        return Ok(());
    }

    let entry_size = size_of::<ResourceDirectoryEntry>();
    let entries_start = dir_offset as u64 + (size_of::<ResourceDirectoryHeader>()) as u64;

    for i in 0..total_entries {
        if file.seek(SeekFrom::Start(entries_start + (i * entry_size) as u64)).is_err() {
            continue;
        }

        let mut entry_buffer = vec![0u8; entry_size];
        if file.read_exact(&mut entry_buffer).is_err() {
            continue;
        }

        let entry = ResourceDirectoryEntry {
            name_or_id: u32::from_le_bytes([entry_buffer[0], entry_buffer[1], entry_buffer[2], entry_buffer[3]]),
            offset_to_data: u32::from_le_bytes([entry_buffer[4], entry_buffer[5], entry_buffer[6], entry_buffer[7]]),
        };

        if entry.is_subdirectory() {
            let subdir_offset = dir_offset + entry.offset();
            let entry_id = entry.id();

            // At level 0, we're looking at type entries (RT_ICON=3, RT_GROUP_ICON=14, etc.)
            // At level 1, we're looking at resource IDs
            // At level 2, we're looking at language entries

            // Only descend into our target type subdirectory
            if entry_id == target_type {
                walk_resource_tree_for_type(file, subdir_offset, target_type, results, sections)?;
            }
            // Also handle RT_ICON (id=3) specially to find actual icon data
            else if entry_id == 3 {
                // RT_ICON - descend to find actual icon data
                walk_icon_leaf(file, subdir_offset, results, sections)?;
            }
            // Skip all other subdirectories
        }
    }

    Ok(())
}

/// Walk to leaf nodes for RT_ICON entries to get actual icon file offsets
fn walk_icon_leaf(
    file: &mut File,
    dir_offset: u32,
    results: &mut Vec<(u32, u32)>,
    sections: &[SectionHeader],
) -> Result<(), IconError> {
    // Read resource directory header
    file.seek(SeekFrom::Start(dir_offset as u64))?;

    let mut header_buffer = vec![0u8; size_of::<ResourceDirectoryHeader>()];
    if file.read_exact(&mut header_buffer).is_err() {
        return Ok(());
    }

    let num_named = u16::from_le_bytes([header_buffer[12], header_buffer[13]]);
    let num_id = u16::from_le_bytes([header_buffer[14], header_buffer[15]]);
    let total_entries = (num_named as usize) + (num_id as usize);

    if total_entries == 0 || total_entries > 1000 {
        return Ok(());
    }

    let entry_size = size_of::<ResourceDirectoryEntry>();
    let entries_start = dir_offset as u64 + (size_of::<ResourceDirectoryHeader>()) as u64;

    for i in 0..total_entries {
        if file.seek(SeekFrom::Start(entries_start + (i * entry_size) as u64)).is_err() {
            continue;
        }

        let mut entry_buffer = vec![0u8; entry_size];
        if file.read_exact(&mut entry_buffer).is_err() {
            continue;
        }

        let entry = ResourceDirectoryEntry {
            name_or_id: u32::from_le_bytes([entry_buffer[0], entry_buffer[1], entry_buffer[2], entry_buffer[3]]),
            offset_to_data: u32::from_le_bytes([entry_buffer[4], entry_buffer[5], entry_buffer[6], entry_buffer[7]]),
        };

        // At level 1 (ID entry), descend to language
        if entry.is_subdirectory() {
            let subdir_offset = dir_offset + entry.offset();
            walk_icon_leaf_at_language(file, subdir_offset, results, sections)?;
        }
    }

    Ok(())
}

/// Walk to language leaf for RT_ICON to get actual icon data offsets
fn walk_icon_leaf_at_language(
    file: &mut File,
    dir_offset: u32,
    results: &mut Vec<(u32, u32)>,
    sections: &[SectionHeader],
) -> Result<(), IconError> {
    // Read resource directory header
    file.seek(SeekFrom::Start(dir_offset as u64))?;

    let mut header_buffer = vec![0u8; size_of::<ResourceDirectoryHeader>()];
    if file.read_exact(&mut header_buffer).is_err() {
        return Ok(());
    }

    let num_named = u16::from_le_bytes([header_buffer[12], header_buffer[13]]);
    let num_id = u16::from_le_bytes([header_buffer[14], header_buffer[15]]);
    let total_entries = (num_named as usize) + (num_id as usize);

    if total_entries == 0 || total_entries > 1000 {
        return Ok(());
    }

    let entry_size = size_of::<ResourceDirectoryEntry>();
    let entries_start = dir_offset as u64 + (size_of::<ResourceDirectoryHeader>()) as u64;

    for i in 0..total_entries {
        if file.seek(SeekFrom::Start(entries_start + (i * entry_size) as u64)).is_err() {
            continue;
        }

        let mut entry_buffer = vec![0u8; entry_size];
        if file.read_exact(&mut entry_buffer).is_err() {
            continue;
        }

        let entry = ResourceDirectoryEntry {
            name_or_id: u32::from_le_bytes([entry_buffer[0], entry_buffer[1], entry_buffer[2], entry_buffer[3]]),
            offset_to_data: u32::from_le_bytes([entry_buffer[4], entry_buffer[5], entry_buffer[6], entry_buffer[7]]),
        };

        // At level 2 (language entry), this should be a data entry
        // offset_to_data points to the actual resource data (RVA)
        if !entry.is_subdirectory() {
            let data_rva = entry.offset();
            if let Some(file_offset) = rva_to_file_offset_opt(sections, data_rva) {
                results.push((data_rva, file_offset));
            }
        }
    }

    Ok(())
}

/// Extract all icons from a specific group
fn extract_all_icons_from_group(
    file: &mut File,
    sections: &[SectionHeader],
    icon_dir_file_offset: u32,
) -> Result<Vec<IconData>, IconError> {
    // Read ICONDIR header
    file.seek(SeekFrom::Start(icon_dir_file_offset as u64))?;

    let mut dir_header = vec![0u8; size_of::<IconDirHeader>()];
    file.read_exact(&mut dir_header)?;

    let reserved = u16::from_le_bytes([dir_header[0], dir_header[1]]);
    let type_ = u16::from_le_bytes([dir_header[2], dir_header[3]]);
    let count = u16::from_le_bytes([dir_header[4], dir_header[5]]);

    if reserved != 0 || type_ != 1 {
        return Err(IconError::InvalidIconDirectory);
    }

    let mut icons = Vec::new();
    let file_len = file.metadata()?.len() as u32;

    for _i in 0..count as usize {
        let mut entry_buffer = vec![0u8; size_of::<IconDirEntry>()];
        if file.read_exact(&mut entry_buffer).is_err() {
            continue;
        }

        let entry = IconDirEntry {
            width: entry_buffer[0],
            height: entry_buffer[1],
            color_count: entry_buffer[2],
            reserved: entry_buffer[3],
            planes: u16::from_le_bytes([entry_buffer[4], entry_buffer[5]]),
            bit_count: u16::from_le_bytes([entry_buffer[6], entry_buffer[7]]),
            bytes_in_res: u32::from_le_bytes([entry_buffer[8], entry_buffer[9], entry_buffer[10], entry_buffer[11]]),
            image_offset: u32::from_le_bytes([entry_buffer[12], entry_buffer[13], entry_buffer[14], entry_buffer[15]]),
        };

        // Validate entry
        if entry.bytes_in_res == 0 {
            continue;
        }

        let image_file_offset = match rva_to_file_offset_opt(sections, entry.image_offset) {
            Some(offset) => offset,
            None => continue,
        };

        // Verify we can read the data
        if image_file_offset >= file_len || entry.bytes_in_res as u32 > file_len - image_file_offset {
            continue;
        }

        // Read the actual icon image data
        file.seek(SeekFrom::Start(image_file_offset as u64))?;
        let mut image_data = vec![0u8; entry.bytes_in_res as usize];
        if file.read_exact(&mut image_data).is_err() {
            continue;
        }

        // Extract icon
        let icon_result = if is_png_data(&image_data) {
            validate_png(&image_data).map(|_| IconData {
                png_data: image_data,
                width: entry.width_px(),
                height: entry.height_px(),
                is_png: true,
            })
        } else {
            convert_bmp_to_png(&image_data, &entry).map(|icon| IconData {
                png_data: icon.png_data,
                width: icon.width,
                height: icon.height,
                is_png: false,
            })
        };

        if let Ok(icon) = icon_result {
            icons.push(icon);
        }
    }

    if icons.is_empty() {
        return Err(IconError::NoIconsFound);
    }

    Ok(icons)
}

/// Optional version of rva_to_file_offset that returns Option instead of Result
fn rva_to_file_offset_opt(sections: &[SectionHeader], rva: u32) -> Option<u32> {
    for section in sections {
        if rva >= section.virtual_address && rva < section.virtual_address + section.virtual_size {
            return Some(section.pointer_to_raw_data + (rva - section.virtual_address));
        }
    }
    None
}

/// Convert RVA to file offset using section headers (returns Result)
/// Only used in tests
#[cfg(test)]
fn rva_to_file_offset(sections: &[SectionHeader], rva: u32) -> Result<u32, IconError> {
    rva_to_file_offset_opt(sections, rva).ok_or(IconError::ResourceNotFound)
}

fn read_dos_header(file: &mut File) -> Result<DosHeader, IconError> {
    let mut header = DosHeader {
        e_magic: 0,
        e_cblp: 0,
        e_cp: 0,
        e_crlc: 0,
        e_cparhdr: 0,
        e_minalloc: 0,
        e_maxalloc: 0,
        e_ss: 0,
        e_sp: 0,
        e_csum: 0,
        e_ip: 0,
        e_cs: 0,
        e_lfarlc: 0,
        e_ovno: 0,
        e_res: [0; 4],
        e_oemid: 0,
        e_oeminfo: 0,
        e_res2: [0; 10],
        e_lfanew: 0,
    };

    // DOS header is at offset 0, we only need e_lfanew which is at 0x3C
    file.seek(SeekFrom::Start(0))?;
    let mut buffer = vec![0u8; size_of::<DosHeader>()];
    file.read_exact(&mut buffer)?;

    // Safely read e_lfanew (offset 0x3C = 60)
    header.e_lfanew = i32::from_le_bytes([buffer[60], buffer[61], buffer[62], buffer[63]]);

    Ok(header)
}

fn read_coff_header(file: &mut File) -> Result<CoffHeader, IconError> {
    let mut header = CoffHeader {
        machine: 0,
        number_of_sections: 0,
        time_date_stamp: 0,
        pointer_to_symbol_table: 0,
        number_of_symbols: 0,
        size_of_optional_header: 0,
        characteristics: 0,
    };

    let mut buffer = vec![0u8; size_of::<CoffHeader>()];
    file.read_exact(&mut buffer)?;

    header.machine = u16::from_le_bytes([buffer[0], buffer[1]]);
    header.number_of_sections = u16::from_le_bytes([buffer[2], buffer[3]]);
    header.size_of_optional_header = u16::from_le_bytes([buffer[16], buffer[17]]);

    Ok(header)
}

fn read_u16(file: &mut File) -> Result<u16, IconError> {
    let mut buffer = [0u8; 2];
    file.read_exact(&mut buffer)?;
    Ok(u16::from_le_bytes(buffer))
}

fn read_data_directory(file: &mut File) -> Result<DataDirectory, IconError> {
    let mut buffer = vec![0u8; size_of::<DataDirectory>()];
    file.read_exact(&mut buffer)?;
    Ok(DataDirectory {
        virtual_address: u32::from_le_bytes([buffer[0], buffer[1], buffer[2], buffer[3]]),
        size: u32::from_le_bytes([buffer[4], buffer[5], buffer[6], buffer[7]]),
    })
}

fn skip_data_directories(file: &mut File, count: usize) -> Result<(), IconError> {
    let size = count * size_of::<DataDirectory>();
    file.seek(SeekFrom::Current(size as i64))?;
    Ok(())
}

fn read_section_headers(file: &mut File, count: usize) -> Result<Vec<SectionHeader>, IconError> {
    let mut sections = Vec::with_capacity(count);
    let mut buffer = vec![0u8; size_of::<SectionHeader>()];

    for _ in 0..count {
        file.read_exact(&mut buffer)?;
        let mut name = [0u8; 8];
        name.copy_from_slice(&buffer[0..8]);
        sections.push(SectionHeader {
            name,
            virtual_size: u32::from_le_bytes([buffer[8], buffer[9], buffer[10], buffer[11]]),
            virtual_address: u32::from_le_bytes([buffer[12], buffer[13], buffer[14], buffer[15]]),
            size_of_raw_data: u32::from_le_bytes([buffer[16], buffer[17], buffer[18], buffer[19]]),
            pointer_to_raw_data: u32::from_le_bytes([buffer[20], buffer[21], buffer[22], buffer[23]]),
            pointer_to_relocations: u32::from_le_bytes([buffer[24], buffer[25], buffer[26], buffer[27]]),
            pointer_to_line_numbers: u32::from_le_bytes([buffer[28], buffer[29], buffer[30], buffer[31]]),
            number_of_relocations: u16::from_le_bytes([buffer[32], buffer[33]]),
            number_of_line_numbers: u16::from_le_bytes([buffer[34], buffer[35]]),
            characteristics: u32::from_le_bytes([buffer[36], buffer[37], buffer[38], buffer[39]]),
        });
    }

    Ok(sections)
}

fn is_png_data(data: &[u8]) -> bool {
    data.len() >= 8 && &data[0..8] == PNG_SIGNATURE
}

fn validate_png(data: &[u8]) -> Result<(), IconError> {
    if data.len() < 8 {
        return Err(IconError::CorruptedIconImage(0));
    }

    // Check PNG signature
    if &data[0..8] != PNG_SIGNATURE {
        return Err(IconError::CorruptedIconImage(1));
    }

    // Basic validation: verify we can find IEND chunk
    let mut offset = 8;
    let mut found_iend = false;

    while offset + 8 <= data.len() {
        let chunk_len = u32::from_be_bytes([data[offset], data[offset+1], data[offset+2], data[offset+3]]) as usize;
        let chunk_type = &data[offset+4..offset+8];

        if chunk_type == b"IEND" {
            found_iend = true;
            break;
        }

        // 4 bytes length + 4 bytes type + chunk data + 4 bytes CRC
        offset += 8 + chunk_len + 4;

        if offset > data.len() {
            return Err(IconError::CorruptedIconImage(2));
        }
    }

    if !found_iend {
        return Err(IconError::CorruptedIconImage(3));
    }

    Ok(())
}

/// Convert BMP icon data to PNG
#[allow(dead_code)]
fn convert_bmp_to_png(image_data: &[u8], _entry: &IconDirEntry) -> Result<IconData, IconError> {
    // Icon BMP format: BITMAPINFOHEADER followed by pixel data
    // For 32-bit icons, it's BGRA pixels

    if image_data.len() < 40 {
        return Err(IconError::CorruptedIconImage(4));
    }

    // Parse BITMAPINFOHEADER
    let header_size = u32::from_le_bytes([
        image_data[0], image_data[1], image_data[2], image_data[3]
    ]) as usize;

    if header_size < 40 {
        return Err(IconError::CorruptedIconImage(5));
    }

    let width = i32::from_le_bytes([
        image_data[4], image_data[5], image_data[6], image_data[7]
    ]);

    // Icons have doubled height (XOR mask + AND mask)
    let height_raw = i32::from_le_bytes([
        image_data[8], image_data[9], image_data[10], image_data[11]
    ]);
    let height = ((height_raw / 2).abs()) as u32;

    let bit_count = u16::from_le_bytes([
        image_data[14], image_data[15]
    ]);

    // Calculate pixel data offset
    let pixel_offset = header_size;
    // Use checked arithmetic to prevent overflow
    let expected_bpp = match (width.abs() as u64).checked_mul(height as u64) {
        Some(h) => match h.checked_mul(bit_count as u64) {
            Some(b) => (b / 8) as usize,
            None => return Err(IconError::CorruptedIconImage(10)),
        },
        None => return Err(IconError::CorruptedIconImage(9)),
    };

    if image_data.len() < pixel_offset + expected_bpp as usize {
        return Err(IconError::CorruptedIconImage(6));
    }

    // Create RGBA image
    let rgba_capacity = (width as u64 * height as u64 * 4) as usize;
    let mut rgba_data = Vec::with_capacity(rgba_capacity);

    if bit_count == 32 {
        // BGRA format, need to flip vertically (BMP is bottom-up)
        let row_size = (width as usize) * 4;
        let flip_offset = pixel_offset + ((height as usize - 1) * row_size);

        for y in 0..height as usize {
            let row_start = flip_offset - y * row_size;
            if row_start + row_size > image_data.len() {
                break;
            }
            for x in 0..width as usize {
                let idx = row_start + x * 4;
                if idx + 3 < image_data.len() {
                    let b = image_data[idx];
                    let g = image_data[idx + 1];
                    let r = image_data[idx + 2];
                    let a = image_data[idx + 3];
                    rgba_data.push(r);
                    rgba_data.push(g);
                    rgba_data.push(b);
                    rgba_data.push(a);
                }
            }
        }
    } else if bit_count == 24 {
        // 24-bit BMP, add full alpha
        let row_size = ((width as usize) * 3 + 3) & !3; // Padded row
        let flip_offset = pixel_offset + (height as usize - 1) * row_size;

        for y in 0..height as usize {
            let row_start = flip_offset - y * row_size;
            for x in 0..width as usize {
                let idx = row_start + x * 3;
                if idx + 2 < image_data.len() {
                    rgba_data.push(image_data[idx + 2]); // R
                    rgba_data.push(image_data[idx + 1]); // G
                    rgba_data.push(image_data[idx]);     // B
                    rgba_data.push(255);                 // A
                }
            }
        }
    } else {
        return Err(IconError::CorruptedIconImage(7));
    }

    // Encode to PNG
    let img_buffer = image::ImageBuffer::<image::Rgba<u8>, Vec<u8>>::from_raw(
        width as u32,
        height,
        rgba_data,
    ).ok_or(IconError::BufferCreationFailed)?;

    let mut png_data = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_data);
    encoder.write_image(
        &img_buffer,
        width as u32,
        height,
        image::ColorType::Rgba8,
    ).map_err(|_| IconError::PngDecodeFailed("encoding failed".to_string()))?;

    Ok(IconData {
        png_data,
        width: width as u32,
        height,
        is_png: false,
    })
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // -------------------------------------------------------------------------
    // PE Structure Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_pe_signature_value() {
        assert_eq!(PE_SIGNATURE, 0x00004550);
        assert_eq!(PE_SIGNATURE.to_le_bytes(), [0x50, 0x45, 0x00, 0x00]);
    }

    #[test]
    fn test_png_signature_valid() {
        let valid_png_sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        assert_eq!(PNG_SIGNATURE, valid_png_sig);
        assert!(is_png_data(&valid_png_sig));
    }

    #[test]
    fn test_png_signature_invalid() {
        let invalid_sigs = [
            [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0xFF], // wrong last byte
            [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // all zeros
            [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], // all ones
            [0x50, 0x45, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // "PE\0\0..."
        ];
        for sig in &invalid_sigs {
            assert!(!is_png_data(sig), "Should reject invalid PNG signature");
        }
    }

    // -------------------------------------------------------------------------
    // ICONDIR Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_icon_dir_entry_width_height_256() {
        let entry = IconDirEntry {
            width: 0, height: 0, color_count: 0, reserved: 0,
            planes: 1, bit_count: 32, bytes_in_res: 0, image_offset: 0,
        };
        assert_eq!(entry.width_px(), 256);
        assert_eq!(entry.height_px(), 256);
    }

    #[test]
    fn test_icon_dir_entry_width_height_explicit() {
        for size in [1, 16, 24, 32, 48, 64, 128] {
            let entry = IconDirEntry {
                width: size, height: size, color_count: 0, reserved: 0,
                planes: 1, bit_count: 32, bytes_in_res: 0, image_offset: 0,
            };
            assert_eq!(entry.width_px(), size as u32, "width {} should be explicit", size);
            assert_eq!(entry.height_px(), size as u32, "height {} should be explicit", size);
        }
    }

    // -------------------------------------------------------------------------
    // Resource Directory Entry Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_resource_directory_entry_subdirectory_flag() {
        // Subdirectory: high bit set
        let subdir = ResourceDirectoryEntry {
            name_or_id: 0x80000003, // RT_ICON with subdirectory flag
            offset_to_data: 0x80000020,
        };
        assert!(subdir.is_subdirectory());
        assert_eq!(subdir.offset(), 0x20);

        // Data entry: high bit clear
        let data = ResourceDirectoryEntry {
            name_or_id: 14, // RT_GROUP_ICON
            offset_to_data: 0x00001234,
        };
        assert!(!data.is_subdirectory());
        assert_eq!(data.offset(), 0x00001234);
    }

    // -------------------------------------------------------------------------
    // Error Type Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_icon_error_display() {
        let errors = [
            (IconError::FileNotFound("test.exe".to_string()), "File not found: test.exe"),
            (IconError::FileOpenFailed(std::io::Error::new(std::io::ErrorKind::NotFound, "")), "Failed to open file:"),
            (IconError::InvalidPeFormat, "Invalid PE file format"),
            (IconError::MissingResourceSection, "Missing .rsrc section"),
            (IconError::ResourceNotFound, "Resource entry not found"),
            (IconError::InvalidIconDirectory, "Icon directory invalid"),
            (IconError::NoIconsFound, "No icons found in file"),
            (IconError::PngDecodeFailed("test".to_string()), "PNG decoding failed: test"),
            (IconError::BufferCreationFailed, "Image buffer creation failed"),
        ];

        for (err, expected_msg) in errors {
            let msg = err.to_string();
            assert!(
                msg.contains(expected_msg.split(':').next().unwrap_or(expected_msg)),
                "Error '{}' should contain '{}', got '{}'",
                format!("{:?}", err),
                expected_msg,
                msg
            );
        }
    }

    // -------------------------------------------------------------------------
    // Icon Data Structure Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_icon_data_fields() {
        let icon = IconData {
            png_data: vec![0x89, 0x50, 0x4E, 0x47], // PNG signature as fake data
            width: 256,
            height: 256,
            is_png: true,
        };

        assert_eq!(icon.width, 256);
        assert_eq!(icon.height, 256);
        assert!(icon.is_png);
        assert_eq!(icon.png_data.len(), 4);
    }

    #[test]
    fn test_icon_data_debug() {
        let icon = IconData {
            png_data: vec![1, 2, 3],
            width: 32,
            height: 32,
            is_png: false,
        };
        let debug_str = format!("{:?}", icon);
        assert!(debug_str.contains("IconData"));
        assert!(debug_str.contains("32"));
    }

    // -------------------------------------------------------------------------
    // RVA to File Offset Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_rva_to_file_offset_valid() {
        let sections = vec![
            SectionHeader {
                name: *b".text\0\0\0",
                virtual_size: 0x1000,
                virtual_address: 0x1000,
                size_of_raw_data: 0x1000,
                pointer_to_raw_data: 0x400,
                pointer_to_relocations: 0,
                pointer_to_line_numbers: 0,
                number_of_relocations: 0,
                number_of_line_numbers: 0,
                characteristics: 0,
            },
        ];

        // RVA within first section
        let result = rva_to_file_offset(&sections, 0x1000).unwrap();
        assert_eq!(result, 0x400); // file offset

        let result = rva_to_file_offset(&sections, 0x1500).unwrap();
        assert_eq!(result, 0x900); // offset + 0x500
    }

    #[test]
    fn test_rva_to_file_offset_invalid() {
        let sections = vec![
            SectionHeader {
                name: *b".text\0\0\0",
                virtual_size: 0x1000,
                virtual_address: 0x1000,
                size_of_raw_data: 0x1000,
                pointer_to_raw_data: 0x400,
                pointer_to_relocations: 0,
                pointer_to_line_numbers: 0,
                number_of_relocations: 0,
                number_of_line_numbers: 0,
                characteristics: 0,
            },
        ];

        // RVA before section
        assert!(rva_to_file_offset(&sections, 0x500).is_err());
        // RVA after section
        assert!(rva_to_file_offset(&sections, 0x2000).is_err());
    }

    // -------------------------------------------------------------------------
    // PNG Validation Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_validate_png_valid() {
        // Minimal valid PNG (just signature + IEND chunk)
        let valid_png = vec![
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x00, // IEND length = 0
            0x49, 0x45, 0x4E, 0x44, // "IEND"
            0xAE, 0x42, 0x60, 0x82, // IEND CRC
        ];

        assert!(validate_png(&valid_png).is_ok());
    }

    #[test]
    fn test_validate_png_invalid() {
        // Too short
        assert!(validate_png(&[0x89, 0x50]).is_err());

        // Wrong signature
        let not_png = vec![0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        assert!(validate_png(&not_png).is_err());

        // Missing IEND
        let no_iend = vec![
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, // length
            0x74, 0x45, 0x58, 0x74, // "tEXt" chunk type
            0x00, // data
        ];
        assert!(validate_png(&no_iend).is_err());
    }

    // -------------------------------------------------------------------------
    // Width/Height Constants
    // -------------------------------------------------------------------------

    #[test]
    fn test_constants() {
        assert_eq!(PE32_MAGIC, 0x10B);
        assert_eq!(PE32_PLUS_MAGIC, 0x20B);
    }
}

// =============================================================================
// Integration Tests (require Windows executables)
// =============================================================================

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_extract_largest_icon_nonexistent_file() {
        let result = extract_largest_icon("C:\\nonexistent\\file.exe");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), IconError::FileNotFound(_)));
    }


    #[test]
    fn test_extract_icon_base64_nonexistent() {
        let result: Result<String, _> = extract_icon_base64("C:\\nonexistent\\file.exe");
        assert!(result.is_err());
    }

    #[test]
    #[ignore = "Requires actual Windows system files"]
    fn test_extract_from_notepad_exe() {
        let path = "C:\\Windows\\System32\\notepad.exe";
        if !Path::new(path).exists() {
            return;
        }

        match extract_largest_icon(path) {
            Ok(icon) => {
                println!("Notepad icon: {}x{}, is_png={}", icon.width, icon.height, icon.is_png);
                assert!(icon.width > 0 && icon.height > 0);
                assert!(!icon.png_data.is_empty());
            }
            Err(e) => {
                println!("Failed to extract from notepad.exe: {}", e);
            }
        }
    }

    #[test]
    #[ignore = "Requires actual Windows system files"]
    fn test_extract_from_steam_exe() {
        // Steam.exe is packed/protected, cannot extract resources via PE parsing
        let path = "D:\\SOFT\\steam\\steam.exe";
        if !Path::new(path).exists() {
            println!("Steam not found at: {}", path);
            return;
        }

        match extract_largest_icon(path) {
            Ok(icon) => {
                println!("Steam icon: {}x{}, is_png={}, size={} bytes",
                    icon.width, icon.height, icon.is_png, icon.png_data.len());
                assert!(icon.width > 0 && icon.height > 0);
                assert!(!icon.png_data.is_empty());
            }
            Err(e) => {
                println!("Steam.exe is packed/protected: {}", e);
            }
        }
    }

    #[test]
    #[ignore = "Requires actual Windows system files"]
    fn test_extract_from_shell32_dll() {
        use std::fs::File;
        use std::io::{Read, Seek, SeekFrom};

        let path = "C:\\Windows\\System32\\shell32.dll";
        if !Path::new(path).exists() {
            println!("shell32.dll not found");
            return;
        }

        // Debug resource structure
        println!("=== Debugging shell32.dll ===");
        let mut file = File::open(path).unwrap();
        let mut dos_header = [0u8; 64];
        file.read_exact(&mut dos_header).unwrap();

        let pe_offset = u32::from_le_bytes([dos_header[60], dos_header[61], dos_header[62], dos_header[63]]) as u64;
        file.seek(SeekFrom::Start(pe_offset + 4)).unwrap();

        let mut coff_header = [0u8; 20];
        file.read_exact(&mut coff_header).unwrap();
        let num_sections = u16::from_le_bytes([coff_header[2], coff_header[3]]);
        let opt_header_size = u16::from_le_bytes([coff_header[16], coff_header[17]]);

        file.seek(SeekFrom::Current(opt_header_size as i64)).unwrap();
        let mut data_dirs = vec![0u8; 16 * 8];
        file.read_exact(&mut data_dirs).unwrap();

        let rsrc_rva = u32::from_le_bytes([data_dirs[8], data_dirs[9], data_dirs[10], data_dirs[11]]);
        println!("Resource RVA: 0x{:X}", rsrc_rva);

        let sections_start = pe_offset + 4 + 20 + opt_header_size as u64;
        file.seek(SeekFrom::Start(sections_start)).unwrap();

        for i in 0..num_sections {
            let mut sec = [0u8; 40];
            file.read_exact(&mut sec).unwrap();
            let name_bytes = &sec[0..8];
            let name = String::from_utf8_lossy(name_bytes).trim_end_matches('\0').to_string();
            let va = u32::from_le_bytes([sec[12], sec[13], sec[14], sec[15]]);
            let vs = u32::from_le_bytes([sec[8], sec[9], sec[10], sec[11]]);
            let rp = u32::from_le_bytes([sec[20], sec[21], sec[22], sec[23]]);

            let contains = va != 0 && vs != 0 && rsrc_rva >= va && rsrc_rva < va + vs;
            println!("Section {} '{}': VA=0x{:X}, Size=0x{:X}, RawPtr=0x{:X} {}",
                i, name, va, vs, rp, if contains { "<-- CONTAINS RVA" } else { "" });
        }

        match extract_all_icons(path) {
            Ok(icons) => {
                println!("\nSuccess! Found {} icons", icons.len());
                for (i, icon) in icons.iter().take(5).enumerate() {
                    println!("  Icon {}: {}x{}, PNG={}, {} bytes",
                        i, icon.width, icon.height, icon.is_png, icon.png_data.len());
                }
            }
            Err(e) => {
                println!("\nFailed: {}", e);
            }
        }
    }

    #[test]
    #[ignore = "Requires actual Windows system files"]
    fn test_extract_base64_from_explorer() {
        let path = "C:\\Windows\\explorer.exe";
        if !Path::new(path).exists() {
            return;
        }

        match extract_icon_base64(path) {
            Ok(b64) => {
                assert!(b64.starts_with("data:image/png;base64,"));
                // Base64 data should be non-trivial length
                let data = &b64["data:image/png;base64,".len()..];
                assert!(data.len() > 100);
                println!("Explorer icon base64 length: {}", data.len());
            }
            Err(e) => {
                println!("Failed: {}", e);
            }
        }
    }
}

// =============================================================================
// Fuzz/Property Tests
// =============================================================================

#[cfg(test)]
mod property_tests {
    use super::*;

    #[test]
    fn test_icon_dir_entry_width_height_consistency() {
        // width_px and height_px should always return same value
        for size in 0..=255u8 {
            let entry = IconDirEntry {
                width: size,
                height: size,
                color_count: 0,
                reserved: 0,
                planes: 1,
                bit_count: 32,
                bytes_in_res: 0,
                image_offset: 0,
            };
            let expected = if size == 0 { 256 } else { size as u32 };
            assert_eq!(entry.width_px(), expected);
            assert_eq!(entry.height_px(), expected);
        }
    }

    #[test]
    fn test_rva_calculation_in_section() {
        let section = SectionHeader {
            name: *b".test\0\0\0",
            virtual_size: 0x1000,
            virtual_address: 0x1000,
            size_of_raw_data: 0x1000,
            pointer_to_raw_data: 0x400,
            pointer_to_relocations: 0,
            pointer_to_line_numbers: 0,
            number_of_relocations: 0,
            number_of_line_numbers: 0,
            characteristics: 0,
        };

        // For each valid RVA, file offset = pointer + (rva - virtual_address)
        for offset in [0u32, 1, 100, 0x500, 0xFFFu32] {
            let rva = section.virtual_address + offset;
            let expected_file_offset = section.pointer_to_raw_data + offset;

            let sections = vec![section.clone()];
            let result = rva_to_file_offset(&sections, rva).unwrap();
            assert_eq!(result, expected_file_offset, "RVA {} should map to file offset {}", rva, expected_file_offset);
        }
    }

    #[test]
    fn test_multiple_sections_rva_mapping() {
        let sections = vec![
            SectionHeader {
                name: *b".text\0\0\0",
                virtual_size: 0x1000,
                virtual_address: 0x1000,
                size_of_raw_data: 0x1000,
                pointer_to_raw_data: 0x400,
                pointer_to_relocations: 0,
                pointer_to_line_numbers: 0,
                number_of_relocations: 0,
                number_of_line_numbers: 0,
                characteristics: 0,
            },
            SectionHeader {
                name: *b".data\0\0\0",
                virtual_size: 0x800,
                virtual_address: 0x2000,
                size_of_raw_data: 0x800,
                pointer_to_raw_data: 0x1400,
                pointer_to_relocations: 0,
                pointer_to_line_numbers: 0,
                number_of_relocations: 0,
                number_of_line_numbers: 0,
                characteristics: 0,
            },
        ];

        // Test first section
        assert_eq!(rva_to_file_offset(&sections, 0x1000).unwrap(), 0x400);
        assert_eq!(rva_to_file_offset(&sections, 0x1FFF).unwrap(), 0x13FF);

        // Test second section
        assert_eq!(rva_to_file_offset(&sections, 0x2000).unwrap(), 0x1400);
        assert_eq!(rva_to_file_offset(&sections, 0x27FF).unwrap(), 0x1BFF);

        // Invalid RVAs
        assert!(rva_to_file_offset(&sections, 0x0FFF).is_err()); // before first
        assert!(rva_to_file_offset(&sections, 0x2800).is_err()); // after last
    }
}
