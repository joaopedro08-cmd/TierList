param(
  [int]$Port = 4174,
  [switch]$NoBrowser
)

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)

try {
  $listener.Start()
} catch {
  Write-Host "Não foi possível abrir a porta $Port." -ForegroundColor Red
  Write-Host "Tente outro valor, por exemplo: .\serve.ps1 -Port 8080" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "  SiterList" -ForegroundColor Green
Write-Host "  http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  Pasta: $root"
Write-Host "  Pressione Ctrl+C para encerrar."
Write-Host ""
if (-not $NoBrowser) {
  Start-Process "http://localhost:$Port/"
}

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.md'   = 'text/markdown; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff2' = 'font/woff2'
}

while ($true) {
  $client = $null
  try {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)

    $requestLine = $reader.ReadLine()
    while ($true) {
      $line = $reader.ReadLine()
      if ($null -eq $line -or $line -eq '') { break }
    }

    if ([string]::IsNullOrWhiteSpace($requestLine)) {
      $client.Close()
      continue
    }

    $parts = $requestLine.Split(' ')
    $method = $parts[0]
    $target = $parts[1]
    $path = $target.Split('?')[0]
    $path = [Uri]::UnescapeDataString($path.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }

    $full = [System.IO.Path]::GetFullPath((Join-Path $root $path))
    $insideRoot = $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)
    $isFile = $insideRoot -and (Test-Path $full -PathType Leaf) -and ($method -eq 'GET' -or $method -eq 'HEAD')

    if ($isFile) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
      $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      if ($method -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) }
    } else {
      $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
    }

    $stream.Flush()
    $client.Close()
  } catch {
    if ($client) { try { $client.Close() } catch {} }
  }
}
