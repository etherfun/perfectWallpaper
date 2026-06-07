# Third-Party Dependencies

This project uses the following third-party libraries, fonts, and assets:

- [colorthief@3.3.1](https://github.com/lokesh/color-thief) - MIT
- [perfectwall@1.0.0](undefined) - GPL-3.0-only
- [qweather-icons@1.8.0](https://github.com/qwd/Icons) - MIT
- [hardware-query@0.2](https://github.com/ciresnave/hardware-query) - MIT OR Apache-2.0
  - Windows-only GPU vendor/model/utilisation/temperature/VRAM
    detection used by `src/server-rs/src/routes/sysinfo/gpu.rs`.
    No kernel driver; no administrator privileges required.
