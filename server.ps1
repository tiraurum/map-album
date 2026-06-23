# 旅行地图 - 本地 HTTP 服务器 (PowerShell)
# 使用 .NET HttpListener，并自动尝试 Python 备用方案
# 无需 Node.js

# 修复控制台中文乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

$port = 8080
$root = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path $root)) { $root = Join-Path $PSScriptRoot "." }

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

# 尝试方案1: HttpListener (Windows .NET 内置)
$ok = $false
try {
    Add-Type -AssemblyName System.Net.HttpListener -ErrorAction Stop
    $listener = New-Object System.Net.HttpListener
    if ($listener) {
        $listener.Prefixes.Add("http://localhost:$port/")
        $listener.Start()
        $ok = $true
    }
} catch {
    $ok = $false
}

# 方案2: Python http.server (备用)
if (-not $ok) {
    Write-Host "[提示] HttpListener 不可用，尝试 Python..."
    $pythonCmd = $null
    # 逐个查找真实 Python，跳过 Microsoft Store 占位符
    foreach ($cmdName in @('python3', 'python')) {
        $found = Get-Command $cmdName -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found -and $found.CommandType -eq 'Application' -and $found.Source -notmatch 'WindowsApps') {
            $pythonCmd = $found.Source
            break
        }
    }
    # 兜底：用 py 启动器
    if (-not $pythonCmd) {
        $py = Get-Command py -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($py) { $pythonCmd = $py.Source }
    }
    if ($pythonCmd) {
        $proc = Start-Process -NoNewWindow -FilePath $pythonCmd `
            -ArgumentList "-m", "http.server", "$port" `
            -WorkingDirectory $root `
            -PassThru
        Start-Sleep -Seconds 1
        if (-not $proc.HasExited) {
            $ok = $true
            Write-Host ""
            Write-Host "======================================"
            Write-Host "  我的旅行地图"
            Write-Host "  服务器已启动！(Python)"
            Write-Host "  请访问: http://localhost:$port"
            Write-Host "======================================"
            Write-Host ""
            Write-Host "按 Ctrl+C 关闭窗口即可停止"
            Write-Host ""
            $proc.WaitForExit()
        }
    }
}

if (-not $ok) {
    Write-Host ""
    Write-Host "[错误] 无法启动 HTTP 服务器！"
    Write-Host "请安装 Python: https://www.python.org/downloads/"
    Write-Host "或手动运行: cd dist && python -m http.server $port"
    Write-Host ""
    Start-Sleep -Seconds 5
    exit 1
}

# HttpListener 请求处理循环
if ($listener -and $listener.IsListening) {
    Write-Host ""
    Write-Host "======================================"
    Write-Host "  我的旅行地图"
    Write-Host "  服务器已启动！"
    Write-Host "  请访问: http://localhost:$port"
    Write-Host "======================================"
    Write-Host ""
    Write-Host "按 Ctrl+C 停止服务器"
    Write-Host ""

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $path = $request.Url.AbsolutePath.TrimStart('/')
            if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }

            $filePath = Join-Path $root $path
            if (-not (Test-Path $filePath -PathType Leaf)) {
                $filePath = Join-Path $root "index.html"
            }

            try {
                $content = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $response.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
            } catch {
                $response.StatusCode = 500
                $err = [System.Text.Encoding]::UTF8.GetBytes("500 Internal Server Error")
                $response.ContentLength64 = $err.Length
                $response.OutputStream.Write($err, 0, $err.Length)
            } finally {
                $response.Close()
            }
        } catch {
            # 忽略关闭时的异常
        }
    }
}
