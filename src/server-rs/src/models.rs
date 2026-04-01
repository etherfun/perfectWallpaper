use serde::Serialize;

#[derive(Serialize)]
pub struct CpuInfo {
    pub manufacturer: String,
    pub brand: String,
    pub speed: f32,
    pub cores: u32,
    pub physical_cores: u32,
    pub usage: f32,
}

#[derive(Serialize)]
pub struct MemoryInfo {
    pub total: u64,
    pub used: u64,
    pub free: u64,
    pub used_percent: f32,
}

#[derive(Serialize)]
pub struct GpuInfo {
    pub id: usize,
    pub model: String,
    pub vendor: String,
    pub vram: u64,
    pub utilization: f32,
    pub temperature: f32,
}

#[derive(Serialize)]
pub struct NetworkInfo {
    pub rx: f64,
    pub tx: f64,
}

#[derive(Serialize)]
pub struct OsInfo {
    pub hostname: String,
    pub platform: String,
    pub distro: String,
    pub release: String,
    pub arch: String,
    pub uptime: u64,
}

#[derive(Serialize)]
pub struct TimeInfo {
    pub current: i64,
    pub timezone: String,
    pub uptime: u64,
}

#[derive(Serialize)]
pub struct SystemInfo {
    pub cpu: CpuInfo,
    pub memory: MemoryInfo,
    pub gpu: Vec<GpuInfo>,
    pub network: NetworkInfo,
    pub system: OsInfo,
    pub time: TimeInfo,
}

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
}

#[derive(Serialize)]
pub struct FilesData {
    pub directory: String,
    pub files: Vec<FileEntry>,
    pub count: usize,
}

#[derive(Serialize)]
pub struct AudioMetadata {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub year: Option<u32>,
    pub duration: Option<f64>,
    pub genre: Option<Vec<String>>,
    pub track: Option<u32>,
    pub picture: Option<PictureData>,
}

#[derive(Serialize)]
pub struct PictureData {
    pub format: String,
    pub data: String,
}
