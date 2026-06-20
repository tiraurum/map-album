# 旅行地图 - 本地 HTTP 服务器 (PowerShell)
# 使用 .NET HttpListener，无需额外安装任何软件

$port = 8080
$root = Join-Path $PSScriptRoot "dist"

# MIME 类型映射
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".geojson" = "application/geo+json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"  = "font/ttf"
    ".pdf"  = "application/pdf"
}

# 创建并启动 HTTP 监听器
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$port/")
$listener.Start()

Write-Host ""
Write-Host "======================================"
Write-Host "  🌏 我的旅行地图"
Write-Host "  服务器已启动！"
Write-Host "  请访问: http://localhost:$port"
Write-Host "======================================"
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器"
Write-Host ""

# 请求处理循环
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    # 解析请求路径
    $path = $request.Url.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrEmpty($path)) {
        $path = "index.html"
    }

    $filePath = Join-Path $root $path

    # SPA 回退：如果文件不存在，返回 index.html
    if (-not (Test-Path $filePath -PathType Leaf)) {
        $filePath = Join-Path $root "index.html"
    }

    try {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        if ($mimeTypes.ContainsKey($ext)) {
            $response.ContentType = $mimeTypes[$ext]
        } else {
            $response.ContentType = "application/octet-stream"
        }
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } catch {
        $response.StatusCode = 500
        $errorMsg = [System.Text.Encoding]::UTF8.GetBytes("500 Internal Server Error")
        $response.ContentLength64 = $errorMsg.Length
        $response.OutputStream.Write($errorMsg, 0, $errorMsg.Length)
    } finally {
        $response.Close()
    }
}
