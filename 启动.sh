#!/bin/bash
# 旅行地图 - 本地 HTTP 服务器 (macOS / Linux)
# 使用 Python 内置 HTTP 服务器，无需额外安装

cd "$(dirname "$0")"

echo "======================================"
echo "  🌏 我的旅行地图"
echo "  服务器启动中..."
echo "======================================"
echo ""

# 打开浏览器
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080
elif command -v open &> /dev/null; then
    open http://localhost:8080
fi

# 启动 Python HTTP 服务器
cd dist
python3 -m http.server 8080
