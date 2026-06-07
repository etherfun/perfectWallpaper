# PerfectWall Server (Rust)

系统信息服务器，为 Wallpaper Engine 插件提供 API 接口。

> 注：作者不会 Rust 开所以该代码全部为 AI 生成
> 本来想说用 nodejs 构建服务器但是构建产物太大了

## 功能

- **系统信息** - CPU、内存、网络、GPU 监控
- **文件服务** - 音频流、元数据、媒体控制
- **图标管理** - 应用图标提取与管理
- **DockBar** - 快捷方式打开

## API 端点

### 系统信息

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/sysinfo` | GET | 获取完整系统信息 |
| `/api/sysinfo/cpu` | GET | CPU 信息（使用率、频率、核心数；温度字段保留但永远为 0） |
| `/api/sysinfo/memory` | GET | 内存使用情况 |
| `/api/sysinfo/gpu` | GET | GPU 信息（vendor、model、VRAM、利用率、温度） |

### 文件

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/files` | GET | 列出文件 |
| `/api/files/audio` | GET | 音频流 |
| `/api/files/metadata` | GET | 获取元数据 |
| `/api/files/player/:action` | POST | 媒体控制 |

### 图标

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/icon` | GET | 获取图标 |
| `/api/icon/all` | GET | 获取所有图标 |
| `/api/icon/upload` | POST | 上传自定义图标 |
| `/api/icon/cache` | POST | 清除图标缓存 |

### 配置

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/config` | GET | 获取配置 |
| `/api/config` | POST | 更新配置 |

### DockBar

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/dockbar/open` | POST | 打开项目 |
| `/api/dockbar/select-file` | GET | 选择文件对话框 |

## CLI 参数

```bash
# 默认端口 27420
perfectwall-server.exe

# 指定端口
perfectwall-server.exe --port 8080

# 开机自启 (Windows)
perfectwall-server.exe --auto-start

# 移除开机自启
perfectwall-server.exe --remove-auto-start

# 显示控制台 (Windows)
perfectwall-server.exe --console
```

## 编译

```bash
cargo build --release
```

二进制产物 `target/release/perfectwall-server.exe`（约 2.7 MB）会通过
`scripts/build-rust.ps1` 复制到 `dist/` 目录。

## 依赖

- `axum` - Web 框架
- `tokio` - 异步运行时
- `sysinfo` - CPU/内存/网络（跨平台）
- `clap` - CLI 参数解析
- `lofty` - 音频元数据
- `hardware-query` *(Windows only)* - GPU 厂商/型号/利用率/温度/VRAM
  （user-mode、不需管理员、不需额外驱动）

## 关于 CPU 温度

**CPU 温度字段在 JSON 响应里保留，但永远为 `0.0` / `temperature_available: false`**，前端 [`formatTemperature()`](../../systemMonitor/formatters.ts) 会因此返回 `null`，不显示 `(°C)` 后缀。

原因：现代 Windows 10/11 消费级 PC 的 ACPI 热区驱动被微软砍掉
（`MSAcpi_ThermalZoneTemperature` WMI 类在 AMD Ryzen / 现代 Intel
平台上**直接返回空**），唯一能读到 CPU 温度的路径是 LHM / WinRing0 /
PawnIO 这些**内核驱动方案**，但这些方案：

- 要么需要**管理员权限**才能加载内核驱动
- 要么在 Microsoft Defender 的 vulnerable-driver blocklist
  上（WinRing0 触发 `VulnerableDriver:WinNT/Winring0` 警告）

这两条都**不适用于终端用户**：用户不会为了一个壁纸给进程管理员
权限、也不会接受 Defender 反复弹木马警告。所以本服务**有意放弃**
CPU 温度，转而保证零管理员、零警告、可在沙箱中正常运行。

`/api/sysinfo/cpu` JSON 契约完整保留 CPU 温度字段（`temperature` /
`temperature_max` / `temperature_critical` / `temperature_label` /
`temperature_available` / `temperature_component_count` /
`temperature_components[]`），以后真要补回 CPU 温度时，**只需要**替换
`collect_cpu_infos()` 内部实现，**前端和 API 契约都不动**。推荐路径见
代码注释和项目调研笔记（`/memories/repo/vendor-sdk-options-2026-06-07.md`），
目前是"加 `nvml-wrapper` 做 GPU 增强" 等待实施。
