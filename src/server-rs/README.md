# PerfectWall Server (Rust)

系统信息服务器，为 Wallpaper Engine 插件提供 API 接口。

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
| `/api/sysinfo/cpu` | GET | CPU 使用率 |
| `/api/sysinfo/memory` | GET | 内存使用情况 |
| `/api/sysinfo/gpu` | GET | GPU 信息 |

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
# 默认端口 42069
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

## 依赖

- `axum` - Web 框架
- `tokio` - 异步运行时
- `sysinfo` - 系统信息
- `clap` - CLI 参数解析
- `lofty` - 音频元数据