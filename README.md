# 🌏 我的旅行地图 Map Album

一个基于中国行政区划地图的旅行记录应用。点击地图上的省份、城市或区县，标记你去过的地方，记录旅途中的照片和故事。

## 功能特色

- 🗺️ **三级行政区划地图** — 省、市、县边界精确展示，支持手动切换 + 自动推荐图层
- 🔴🔵🟢 **三态标记** — 点击任意区域可标记为"已去过"、"想去"或"计划中"，状态可升级
- 📸 **多趟旅行记录** — 每个去过的地方可记录多次独立到访，各自带照片和文字描述
- 🗺️ **旅行路线** — 自动按日期生成旅行路线，在地图上绘制连线
- 🎨 **主题与字体** — 4 套配色主题（默认暗色/明亮系/暖色系/白色极简）+ 3 种字体
- 📊 **统计数据** — 自动统计已点亮城市数、覆盖面积（km²）、旅行历时
- 📋 **侧边栏筛选** — 按年份筛选、按日期或状态排序
- 💾 **数据备份** — 一键导出/导入 JSON 备份文件，换设备不丢数据
- 💾 **本地存储** — 所有数据保存在浏览器中，关闭页面不丢失

## 快速开始（免安装）

### 方式一：解压即用（推荐给普通用户）

1. 从 [Releases](https://github.com/tiraurum/map-album/releases) 下载最新版 `map-album-1.1.0.zip`
2. 解压到任意文件夹
3. **Windows**：双击 `启动.bat`
4. **macOS / Linux**：双击 `启动.sh`
5. 浏览器自动打开 http://localhost:8080，开始使用

> 无需安装 Node.js 或任何其他软件。Windows 使用系统自带的 PowerShell 作为 HTTP 服务器，macOS/Linux 使用系统自带的 Python。

### 方式二：从源码运行（开发者）

```bash
# 1. 克隆仓库
git clone https://github.com/tiraurum/map-album.git
cd map-album

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:5173

# 4. （可选）构建生产版本
npm run build
npm run preview
```

## 技术栈

| 技术 | 用途 |
|------|------|
| [Vite](https://vitejs.dev/) | 构建工具 |
| [React](https://react.dev/) | UI 框架 |
| [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/) | 地图引擎 |
| [Dexie.js](https://dexie.org/) | 浏览器本地数据库（IndexedDB，schema v2） |
| 中国行政区划 GeoJSON | 省/市/县三级边界数据 |

## 数据来源

- 行政区划边界数据来源于[天地图](https://www.tianditu.gov.cn/)（国家地理信息公共服务平台）
- 城市坐标数据基于公开行政区划编码整理
- 地图瓦片由 [OpenStreetMap](https://www.openstreetmap.org/) 提供（需要联网加载）

## 项目结构

```
map-album/
├── dist/                  # 构建后的可分发版本（含启动脚本）
│   ├── index.html
│   ├── assets/            # JS + CSS
│   └── data/              # GeoJSON 边界数据
├── src/                   # 源代码
│   ├── components/        # React 组件
│   ├── hooks/             # 自定义 Hooks
│   ├── db/                # IndexedDB 数据库
│   ├── data/              # 城市坐标数据
│   ├── utils/             # 工具函数
│   └── styles/            # 样式
├── 启动.bat               # Windows 一键启动
├── 启动.sh                # macOS / Linux 一键启动
├── server.ps1             # PowerShell HTTP 服务器
├── 启动测试服务器.bat      # 开发用（需 Node.js）
└── map-album-1.1.0.zip    # 可分发安装包
```

## 许可证

MIT
