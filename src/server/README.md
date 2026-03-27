# PerfectWall System Info Server

一个用于Wallpaper Engine的Node.js系统信息服务器。

## 功能

- **CPU信息**: 使用率、型号、核心数等
- **GPU信息**: 型号、显存、使用率、温度等
- **内存信息**: 总内存、已用、可用
- **网络信息**: 实时网络速度
- **系统信息**: 主机名、平台、运行时间等

## API 端点

| 端点 | 描述 |
|------|------|
| `GET /api/system` | 获取完整系统信息 |
| `GET /api/cpu` | 获取CPU使用率 |
| `GET /api/memory` | 获取内存使用情况 |
| `GET /api/gpu` | 获取GPU信息 |
| `GET /api/health` | 健康检查 |
| `GET /api/stream` | SSE实时推送 (2秒间隔) |

## 使用方法

```bash
cd server

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 或构建后运行
npm run build
npm start
```

## 响应格式

### GET /api/system
```json
{
  "success": true,
  "data": {
    "cpu": {
      "manufacturer": "Intel",
      "brand": "Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz",
      "speed": 3.8,
      "cores": 16,
      "physicalCores": 8,
      "usage": 25.5
    },
    "memory": {
      "total": 17179869184,
      "used": 8589934592,
      "free": 8589934592,
      "usedPercent": 50
    },
    "gpu": [
      {
        "id": 0,
        "model": "NVIDIA GeForce RTX 3080",
        "vendor": "NVIDIA",
        "vram": 10240,
        "utilization": 45,
        "temperature": 65
      }
    ],
    "network": {
      "rx": 1024000,
      "tx": 512000
    },
    "system": {
      "hostname": "DESKTOP-PC",
      "platform": "win32",
      "distro": "Windows 10",
      "release": "10.0.19041",
      "arch": "x64",
      "uptime": 86400
    },
    "time": {
      "current": 1711234567890,
      "timezone": "Asia/Shanghai",
      "uptime": 86400
    }
  },
  "timestamp": 1711234567890
}
```

## 在Wallpaper Engine中使用

### 方法1: 通过文件协议
创建`project.json`:
```json
{
  "properties": {
    "system_info_url": {
      "type": "text",
      "default": "http://localhost:3842/api/system"
    }
  }
}
```

### 方法2: 使用SSE实时推送
```javascript
const eventSource = new EventSource('http://localhost:3842/api/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'systemInfo') {
    console.log('CPU:', data.data.cpu.usage);
    console.log('GPU:', data.data.gpu);
  }
};
```

## 注意

- 服务器默认端口: `3842`
- GPU信息在Windows上需要NVIDIA/AMD驱动支持
- SSE推送间隔: 2秒
