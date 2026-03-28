# Perfect Wallpaper

一个~~功能丰富~~的 Wallpaper Engine 动态壁纸项目，支持音频可视化、天气显示、时间日期、粒子效果等多种视觉效果。

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
  - ICU Free
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
- [ ]  全屏歌词显示 
 
- [ ]  系统监控（CPU、内存等）
 
- [X]  一言（Hitokoto）随机语录

## 技术栈

- **前端**: TypeScript、HTML5 Canvas、WebGL
- **构建**: esbuild、TypeScript、SASS
- **依赖**: Express、systeminformation、colorthief

## 项目结构

```
perfectwall/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── audioVisualizer.ts      # 音频可视化
│   ├── PWCircle.ts            # 圆形可视化
│   ├── PWLine.ts              # 线条可视化
│   ├── PWParticles.ts         # 粒子系统
│   ├── fluid_control.ts        # 流体控制
│   ├── fluid_effect2.ts        # 流体效果
│   ├── weather/                # 天气模块
│   │   ├── index.ts
│   │   └── api/                # 天气API适配器
│   ├── slide/                  # 背景切换模块
│   ├── fullscreenLyrics/       # 全屏歌词
│   ├── propertyHandlers/       # 属性处理器
│   ├── server/                 # 服务器模块
│   └── utils/                  # 工具函数
├── source/                     # 静态资源
│   ├── i18n/                   # 多语言文件
│   ├── imgs/                  # 图片资源
│   └── map/                   # 地图资源
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
## 配置

项目支持丰富的自定义配置，通过 Wallpaper Engine 的项目属性面板可以：

- 调整音频可视化样式和颜色
- 配置天气 API
- 设置时间和日期格式
- 自定义粒子效果参数
- 配置背景切换策略

## License

GPL-3.0
