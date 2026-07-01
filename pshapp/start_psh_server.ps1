# Simple PowerShell HTTP Server for Jawatankuasa PSH (JMSK)
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "============================================="
    Write-Host "Pelayan Web PSH JMSK berjalan di http://localhost:$port/"
    Write-Host "Sila buka pelayar web anda dan layari alamat di atas."
    Write-Host "Tekan Ctrl + C di terminal ini untuk menutup server."
    Write-Host "============================================="
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") {
            $urlPath = "/index.html"
        }

        # Resolve path
        $cleanPath = $urlPath.Replace("/", "\")
        if ($cleanPath.StartsWith("\")) {
            $cleanPath = $cleanPath.Substring(1)
        }
        
        $localPath = Join-Path (Get-Location) $cleanPath

        if (Test-Path $localPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            
            # Set content types
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $contentType = "text/plain; charset=utf-8"
            if ($ext -eq ".html") { $contentType = "text/html; charset=utf-8" }
            elseif ($ext -eq ".css") { $contentType = "text/css; charset=utf-8" }
            elseif ($ext -eq ".js") { $contentType = "text/javascript; charset=utf-8" }
            elseif ($ext -eq ".png") { $contentType = "image/png" }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("Fail tidak ditemui (404)")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} catch {
    Write-Host "Ralat: $_"
} finally {
    if ($listener) {
        $listener.Stop()
    }
}
