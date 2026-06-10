using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace PerfectWall.Server.Services
{
    /// <summary>
    /// High-resolution icon extractor. Two paths:
    /// <list type="number">
    ///   <item><description>
    ///     PE resources: parses the .exe / .dll directly to
    ///     recover the largest icon entry, including
    ///     256x256 PNG-compressed icons. The Rust version does
    ///     the same; we re-implement it in C# because
    ///     <c>System.Drawing.Icon</c> caps out at 64x64 from a
    ///     manifest-only reader.
    ///   </description></item>
    ///   <item><description>
    ///     Non-PE files (.lnk, .ico, generic): fall back to
    ///     <c>SHGetFileInfo</c>.
    ///   </description></item>
    /// </list>
    /// </summary>
    public static class IconExtractor
    {
        public sealed class IconData
        {
            public byte[] PngData { get; set; }
            public int Width { get; set; }
            public int Height { get; set; }
            public bool IsPng { get; set; }
        }

        public static string ExtractLargestAsDataUrl(string path)
        {
            var icons = ExtractAll(path);
            if (icons == null || icons.Count == 0) return null;
            var best = icons[0];
            var encoded = Convert.ToBase64String(best.PngData);
            return "data:image/png;base64," + encoded;
        }

        public static List<IconData> ExtractAll(string path)
        {
            if (!File.Exists(path)) return null;
            try
            {
                using (var fs = File.OpenRead(path))
                {
                    var icons = ExtractAllFromPe(fs);
                    if (icons != null && icons.Count > 0)
                    {
                        icons.Sort((a, b) => (b.Width * b.Height).CompareTo(a.Width * a.Height));
                        return icons;
                    }
                }
            }
            catch { /* not a PE — fall through */ }

            // Fallback: shell API for any file type the Shell knows.
            try
            {
                var shfi = new NativeMethods.SHFILEINFO();
                NativeMethods.SHGetFileInfo(path, 0, ref shfi,
                    (uint)Marshal.SizeOf(typeof(NativeMethods.SHFILEINFO)),
                    NativeMethods.SHGFI_ICON | NativeMethods.SHGFI_LARGEICON | NativeMethods.SHGFI_ADDOVERLAYS);
                if (shfi.hIcon == IntPtr.Zero) return null;
                using (var icon = Icon.FromHandle(shfi.hIcon))
                using (var bmp = icon.ToBitmap())
                {
                    using (var ms = new MemoryStream())
                    {
                        bmp.Save(ms, ImageFormat.Png);
                        NativeMethods.DestroyIcon(shfi.hIcon);
                        return new List<IconData>
                        {
                            new IconData
                            {
                                PngData = ms.ToArray(),
                                Width = bmp.Width,
                                Height = bmp.Height,
                                IsPng = true
                            }
                        };
                    }
                }
            }
            catch
            {
                return null;
            }
        }

        // -----------------------------------------------------------------
        // PE parser
        // -----------------------------------------------------------------

        private static List<IconData> ExtractAllFromPe(Stream stream)
        {
            BinaryReader br;
            try
            {
                br = new BinaryReader(stream, Encoding.ASCII, leaveOpen: true);
            }
            catch { return null; }

            try
            {
                // DOS header
                stream.Seek(0, SeekOrigin.Begin);
                if (br.ReadUInt16() != 0x5A4D) return null; // "MZ"
                stream.Seek(0x3C, SeekOrigin.Begin);
                var peOffset = br.ReadInt32();
                if (peOffset <= 0 || peOffset >= stream.Length - 4) return null;
                stream.Seek(peOffset, SeekOrigin.Begin);
                if (br.ReadUInt32() != 0x00004550) return null; // "PE\0\0"

                // COFF header
                br.ReadUInt16(); // machine
                var numSections = br.ReadUInt16();
                br.ReadUInt32(); br.ReadUInt32(); br.ReadUInt32();
                var sizeOfOptionalHeader = br.ReadUInt16();
                br.ReadUInt16();
                var optionalStart = peOffset + 4 + 20;
                stream.Seek(optionalStart, SeekOrigin.Begin);
                br.ReadUInt16(); // magic (PE32 vs PE32+)
                // Section table comes after the optional header
                var sectionTableOffset = optionalStart + sizeOfOptionalHeader;

                // Read .rsrc section header to get its raw data
                stream.Seek(sectionTableOffset, SeekOrigin.Begin);
                SectionHeader? rsrc = null;
                for (int i = 0; i < numSections; i++)
                {
                    var sec = ReadSectionHeader(br);
                    var name = Encoding.ASCII.GetString(sec.Name).TrimEnd('\0');
                    if (name == ".rsrc")
                    {
                        rsrc = sec;
                        break;
                    }
                }
                if (rsrc == null) return null;

                // Read .rsrc raw bytes
                var rsrcBytes = new byte[rsrc.Value.SizeOfRawData];
                stream.Seek(rsrc.Value.PointerToRawData, SeekOrigin.Begin);
                stream.Read(rsrcBytes, 0, rsrcBytes.Length);

                // Walk resource directory looking for RT_GROUP_ICON (id=14)
                var iconData = FindResource(rsrcBytes, rsrc.Value, 14);
                if (iconData == null) return null;
                return iconData;
            }
            finally
            {
                br.Dispose();
            }
        }

        private static SectionHeader ReadSectionHeader(BinaryReader br)
        {
            var nameBytes = br.ReadBytes(8);
            var sh = new SectionHeader
            {
                Name = nameBytes,
                VirtualSize = br.ReadUInt32(),
                VirtualAddress = br.ReadUInt32(),
                SizeOfRawData = br.ReadUInt32(),
                PointerToRawData = br.ReadUInt32(),
                PointerToRelocations = br.ReadUInt32(),
                PointerToLineNumbers = br.ReadUInt32(),
                NumberOfRelocations = br.ReadUInt16(),
                NumberOfLineNumbers = br.ReadUInt16(),
                Characteristics = br.ReadUInt32()
            };
            return sh;
        }

        private struct SectionHeader
        {
            public byte[] Name;
            public uint VirtualSize;
            public uint VirtualAddress;
            public uint SizeOfRawData;
            public uint PointerToRawData;
            public uint PointerToRelocations;
            public uint PointerToLineNumbers;
            public ushort NumberOfRelocations;
            public ushort NumberOfLineNumbers;
            public uint Characteristics;
        }

        private static List<IconData> FindResource(byte[] rsrc, SectionHeader section, int typeId)
        {
            // Resource directory header: 16 bytes
            if (rsrc.Length < 16) return null;
            var numNamed = BitConverter.ToUInt16(rsrc, 12);
            var numId = BitConverter.ToUInt16(rsrc, 14);
            int pos = 16;
            // First level: type entries
            for (int i = 0; i < numNamed + numId; i++)
            {
                if (pos + 8 > rsrc.Length) break;
                var nameOrId = BitConverter.ToUInt32(rsrc, pos);
                var dataOffset = BitConverter.ToUInt32(rsrc, pos + 4) & 0x7FFFFFFF;
                pos += 8;
                if ((nameOrId & 0x7FFFFFFF) != typeId) continue;
                // Recurse into the ID-directory
                if (dataOffset + 16 > rsrc.Length) continue;
                var subNamed = BitConverter.ToUInt16(rsrc, (int)dataOffset + 12);
                var subId = BitConverter.ToUInt16(rsrc, (int)dataOffset + 14);
                int subPos = (int)dataOffset + 16;
                for (int j = 0; j < subNamed + subId; j++)
                {
                    if (subPos + 8 > rsrc.Length) break;
                    var subDataOffset = BitConverter.ToUInt32(rsrc, subPos + 4) & 0x7FFFFFFF;
                    subPos += 8;
                    if (subDataOffset + 16 > rsrc.Length) continue;
                    var langNamed = BitConverter.ToUInt16(rsrc, (int)subDataOffset + 12);
                    var langId = BitConverter.ToUInt16(rsrc, (int)subDataOffset + 14);
                    int langPos = (int)subDataOffset + 16;
                    for (int k = 0; k < langNamed + langId; k++)
                    {
                        if (langPos + 8 > rsrc.Length) break;
                        var dataEntryOffset = BitConverter.ToUInt32(rsrc, langPos + 4);
                        langPos += 8;
                        if ((dataEntryOffset & 0x80000000) != 0) continue;
                        if (dataEntryOffset + 8 > rsrc.Length) continue;
                        var rva = BitConverter.ToUInt32(rsrc, (int)dataEntryOffset);
                        var size = BitConverter.ToUInt32(rsrc, (int)dataEntryOffset + 4);
                        // RVA → file offset
                        var fileOffset = (int)(rva - section.VirtualAddress + section.PointerToRawData);
                        if (fileOffset < 0 || fileOffset + size > rsrc.Length) continue;
                        if (typeId == 14) // RT_GROUP_ICON
                        {
                            return ParseGroupIcon(rsrc, fileOffset, (int)size, section);
                        }
                    }
                }
            }
            return null;
        }

        private struct Entry
        {
            public int Width;
            public int Height;
            public int DataId;
            public int Bytes;
        }

        private static List<IconData> ParseGroupIcon(byte[] rsrc, int offset, int size, SectionHeader section)
        {
            var result = new List<IconData>();
            if (offset + 6 > rsrc.Length) return null;
            var reserved = BitConverter.ToUInt16(rsrc, offset);
            var type = BitConverter.ToUInt16(rsrc, offset + 2);
            var count = BitConverter.ToUInt16(rsrc, offset + 4);
            if (reserved != 0 || type != 1) return null;
            int pos = offset + 6;
            // Each ICONDIRENTRY is 16 bytes
            var entries = new List<Entry>();
            for (int i = 0; i < count; i++)
            {
                if (pos + 16 > rsrc.Length) break;
                var w = rsrc[pos];
                var h = rsrc[pos + 1];
                var bytesInRes = BitConverter.ToInt32(rsrc, pos + 8);
                var id = BitConverter.ToUInt16(rsrc, pos + 12);
                entries.Add(new Entry
                {
                    Width = w == 0 ? 256 : w,
                    Height = h == 0 ? 256 : h,
                    DataId = id,
                    Bytes = bytesInRes
                });
                pos += 16;
            }
            // Now we need to resolve each `id` against the
            // RT_ICON (type=3) resources.
            var iconBlobs = FindIconBlobs(rsrc, section, 3);
            foreach (var e in entries)
            {
                if (!iconBlobs.TryGetValue(e.DataId, out var blob)) continue;
                bool isPng = blob.Length >= 8 && blob[0] == 0x89 && blob[1] == 0x50;
                if (!isPng)
                {
                    // Convert BMP-style RT_ICON entries to PNG
                    // via System.Drawing so the frontend always
                    // gets PNG.
                    try
                    {
                        var bytes = blob;
                        using (var ms = new MemoryStream(bytes))
                        using (var bmp = new Bitmap(ms))
                        using (var outMs = new MemoryStream())
                        {
                            bmp.Save(outMs, ImageFormat.Png);
                            blob = outMs.ToArray();
                            isPng = true;
                        }
                    }
                    catch { continue; }
                }
                result.Add(new IconData
                {
                    PngData = blob,
                    Width = e.Width,
                    Height = e.Height,
                    IsPng = isPng
                });
            }
            return result;
        }

        private static Dictionary<int, byte[]> FindIconBlobs(byte[] rsrc, SectionHeader section, int typeId)
        {
            var dict = new Dictionary<int, byte[]>();
            if (rsrc.Length < 16) return dict;
            var numNamed = BitConverter.ToUInt16(rsrc, 12);
            var numId = BitConverter.ToUInt16(rsrc, 14);
            int pos = 16;
            for (int i = 0; i < numNamed + numId; i++)
            {
                if (pos + 8 > rsrc.Length) break;
                var nameOrId = BitConverter.ToUInt32(rsrc, pos);
                var dataOffset = BitConverter.ToUInt32(rsrc, pos + 4) & 0x7FFFFFFF;
                pos += 8;
                if ((nameOrId & 0x7FFFFFFF) != typeId) continue;
                if (dataOffset + 16 > rsrc.Length) continue;
                var subNamed = BitConverter.ToUInt16(rsrc, (int)dataOffset + 12);
                var subId = BitConverter.ToUInt16(rsrc, (int)dataOffset + 14);
                int subPos = (int)dataOffset + 16;
                for (int j = 0; j < subNamed + subId; j++)
                {
                    if (subPos + 8 > rsrc.Length) break;
                    var idVal = (int)(BitConverter.ToUInt16(rsrc, subPos) & 0x7FFF);
                    var subDataOffset = BitConverter.ToUInt32(rsrc, subPos + 4) & 0x7FFFFFFF;
                    subPos += 8;
                    if (subDataOffset + 16 > rsrc.Length) continue;
                    var langNamed = BitConverter.ToUInt16(rsrc, (int)subDataOffset + 12);
                    var langId = BitConverter.ToUInt16(rsrc, (int)subDataOffset + 14);
                    int langPos = (int)subDataOffset + 16;
                    for (int k = 0; k < langNamed + langId; k++)
                    {
                        if (langPos + 8 > rsrc.Length) break;
                        var dataEntryOffset = BitConverter.ToUInt32(rsrc, langPos + 4);
                        langPos += 8;
                        if ((dataEntryOffset & 0x80000000) != 0) continue;
                        if (dataEntryOffset + 8 > rsrc.Length) continue;
                        var rva = BitConverter.ToUInt32(rsrc, (int)dataEntryOffset);
                        var size = BitConverter.ToUInt32(rsrc, (int)dataEntryOffset + 4);
                        var fileOffset = (int)(rva - section.VirtualAddress + section.PointerToRawData);
                        if (fileOffset < 0 || fileOffset + size > rsrc.Length) continue;
                        var bytes = new byte[size];
                        Buffer.BlockCopy(rsrc, fileOffset, bytes, 0, (int)size);
                        if (!dict.ContainsKey(idVal)) dict[idVal] = bytes;
                    }
                }
            }
            return dict;
        }
    }
}
