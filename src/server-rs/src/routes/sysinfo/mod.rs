pub mod cpu;
pub mod gpu;
pub mod memory;
pub mod system;

pub use cpu::get_cpu_usage;
pub use gpu::get_gpu_info;
pub use memory::get_memory_info;
pub use system::get_system_info;
