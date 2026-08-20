# Perfect Wallpaper

一个 Wallpaper Engine 动态壁纸项目，支持音频可视化、天气显示、时间日期、粒子效果等多种视觉效果。

## 功能特性

### 音频可视化
- **PWCircle** - 完美圆形音频可视化
- **PWLine** - 完美线条音频可视化
- **Alice Circle** - 爱丽丝圆形效果
- 多种颜色模式和渐变支持
- 音频波形平滑处理

### 天气系统
- 支持多个天气数据源：
  - QWeather（和风天气）
  - Open-Meteo
  - Visual Crossing
  - 一刻天气
  - [ICU Free](https://steamcommunity.com/workshop/filedetails/discussion/884307090/3412054783687240237/)
- 天气图标和提示信息
- 温度单位转换

### 时间日期
- 多种日期格式显示
- 24小时制/12小时制切换
- 颜色节奏效果
- 自定义日期分隔符

### 倒计时
- 年/月/日倒计时
- 自定义前后缀文本

### 粒子效果
- Alice 粒子系统
- 樱花效果
- 多种粒子形状（圆形、方形、三角形、星形、图片）
- 粒子连线效果

### 背景切换
- 单图模式
- 幻灯片模式（支持自定义目录）
- 视频模式
- Bing 每日壁纸
- Lorem Picsum API
- NASA 每日星系图
- ChiYuan API（动漫、风景等）
- Windows Spotlight
- 自定义网络图片

### 其他功能
- []  全屏歌词显示
- [X]  系统监控（CPU、内存、GPU、网络）
- [X]  一言（Hitokoto）随机语录
- [X]  DockBar 快捷栏（应用、文件、网址）

## 服务器 (.NET)

.NET Framework 4.8 系统信息服务器，提供 API 给前端调用。
提供两种运行模式：

- **用户模式（默认）**：纯托管 API 实现的 CPU/内存/网络/系统信息；
  温度、风扇、时钟字段保持 0 / unavailable。
- **管理员模式（`--admin`）**：通过 LibreHardwareMonitor 读取 CPU/GPU
  温度、风扇、时钟。需要 UAC 提升，会触发 WinRing0 驱动的 Defender 警告
  （用户主动选择）。

前端代码与运行模式无关 — JSON 契约在两种模式下保持一致。

### 运行与设置

- 双击 `perfectwall-server.exe` 以用户模式启动；右键「以管理员身份运行」自动提升为管理员模式。
- 启动后访问 `http://localhost:<port>/setup` 打开设置页（端口默认 `27420`，可在 `server-config.json` 或设置页修改）。
- **运行中提权**：在设置页点击「以管理员身份重启」，服务器会以 `--admin` 在同端口拉起提权子进程并退出自身，无需手动重开（UAC 同意后自动接管，诊断卡 `run_mode` 变为 `Admin`）。
- **单实例**：若服务器已在运行，再次双击 EXE 不会启动第二个监听，而是直接打开已运行实例的设置页。
- 提权交接时若旧进程仍占用端口，新进程会重试绑定（最多 6 秒）直至旧进程释放，避免 `前缀冲突` 报错。

### 主要端点

| 端点 | 说明 |
|------|------|
| `GET /api/sysinfo` | 聚合硬件信息（CPU/内存/GPU/网络/磁盘/系统） |
| `GET /api/sysinfo/{cpu,gpu,memory,network,system,disk}` | 分项信息 |
| `GET /api/config` · `POST /api/config` | 端口/自启/日志级别 |
| `GET /api/setup` · `POST /api/setup` | 设置页状态与操作（含 `elevate` 提权） |
| `GET /api/files` · `/audio` · `/metadata` · `POST /player/{action}` | 媒体文件与播放控制 |
| `GET /api/icon` · `/icon/all` · `POST /icon/upload` · `/icon/cache` | 图标提取与缓存 |
| `POST /api/dockbar/open` · `GET /api/dockbar/select-file` | DockBar 打开项/选择文件 |

## 技术栈

- **前端**: Vue 3 + Pinia + TypeScript + Vite/esbuild，Canvas/WebGL 渲染
- **服务器**: .NET Framework 4.8、LibreHardwareMonitor、Newtonsoft.Json、TagLibSharp
- **构建**: vue-tsc（类型检查）、Vite（前端打包）、esbuild、dotnet build（服务端）

## 项目结构

```
perfectwall/
├── src/
│   ├── modules/                # 按功能聚合的模块（每个模块含 use*Properties.ts 属性处理器 + Vue 组件/渲染逻辑）
│   │   ├── core/               # 入口 bundle.ts、main.ts、piniaInit、wallpaperPropertyListener、视频控制器
│   │   ├── clock/ date/ countdown/ hitokoto/ weather/ slide/
│   │   ├── audio-visualizer/ player_control/ systemMonitor/ dockbar/
│   │   ├── fluid/ rgb-effect/ sakura/ fullscreenLyrics/ version/ debug/
│   │   └── ...
│   ├── stores/                 # Pinia 配置/运行时 store（config.ts 唯一配置入口）
│   ├── tokens/                 # 设计令牌（可见性/毛玻璃）
│   ├── types/                  # WE 推送属性类型（wallpaper-*.ts 拆分 + 聚合）
│   ├── utils/                  # 工具函数（logger、i18n、string、timer 等）
│   ├── scss/                   # 样式文件
│   └── server-dotnet/          # .NET Framework 4.8 系统信息服务器
├── scripts/                    # 构建脚本（post-build.js / build-dev.mjs / build-dotnet.ps1）
├── package.json
└── tsconfig.json
```

> 完整目录说明见 `AGENTS.md`（README 树为概览，以实际为准）。

## 开发

### 环境要求

- Node.js >= 18.0.0
- Wallpaper Engine
- 服务端构建需 Visual Studio 2019/2022 Build Tools（含 .NET Framework 4.8 目标包）

### 安装依赖

```bash
yarn install
```

### 构建

```bash
# 前端：类型检查 + Vite 打包 + post-build 后处理（产物写入 dist/）
yarn run build

# 服务端：MSBuild 编译 .NET 服务器到 build/ 与 dist/perfectwall-server/
yarn run build:server

# 开发预览（需先设置 WE_DEV_KIT_PATH 环境变量）
yarn run build:dev

# 类型检查 / 测试 / 格式化
yarn run typecheck
yarn run test
yarn run lint
```
## License
在此感谢[原作者](https://steamcommunity.com/sharedfiles/filedetails/?id=884307090)的长期更新

GPL-3.0
