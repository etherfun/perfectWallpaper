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

## 服务器 (Rust)

Rust 编写的系统信息服务器，提供 API 给前端调用。
请自行查看对应文件夹的README

## 技术栈

- **前端**: TypeScript、HTML5 Canvas、WebGL
- **服务器**: Rust、Axum、Tower
- **构建**: esbuild、TypeScript、SASS

## 项目结构

```
perfectwall/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── audioVisualizer.ts      # 音频可视化
│   ├── PWCircle.ts            # 圆形可视化
│   ├── PWLine.ts              # 线条可视化
│   ├── PWParticles.ts         # 粒子系统
│   ├── fluid/                  # 流体效果
│   │   ├── index.ts
│   │   ├── effect.ts
│   │   └── types.ts
│   ├── weather/                # 天气模块
│   │   ├── index.ts
│   │   ├── api/               # 天气API适配器
│   │   ├── tooltip/           # 天气提示框
│   │   └── ui/                # 天气UI组件
│   ├── slide/                  # 背景切换模块
│   ├── fullscreenLyrics/       # 全屏歌词
│   ├── propertyHandlers/       # 属性处理器
│   ├── dockbar.ts             # DockBar快捷栏
│   ├── systemMonitor.ts       # 系统监控
│   ├── version/               # 版本解析
│   └── utils/                  # 工具函数
├── src/scss/                   # 样式文件
├── src/server-dotnet/          # .NET Framework 4.8 服务器
├── scripts/                    # 构建脚本
├── package.json
└── tsconfig.json
```

## 开发

### 环境要求

- Node.js >= 18.0.0
- Wallpaper Engine

### 安装依赖

```bash
yarn install
```

### 构建

```bash
# 构建项目
yarn run build

# 监听模式
yarn run watch

# 监听 SCSS 变化
yarn run watch:scss
```
## License
在此感谢[原作者](https://steamcommunity.com/sharedfiles/filedetails/?id=884307090)的长期更新

GPL-3.0
