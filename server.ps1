# =============================================================================
# COE-Pay: Zero-Dependency Local HTTP Server & Disk Persistence Engine
# Institution: ICCT Colleges Foundation, Inc. - College of Engineering
# =============================================================================

$Root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
if (-not $Root) { $Root = (Get-Location).Path }

$DataDir = Join-Path $Root "data"
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}
$DbFile = Join-Path $DataDir "coepay_db_persistent.json"

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".ico"  = "image/x-icon"
    ".sql"  = "text/plain; charset=utf-8"
    ".txt"  = "text/plain; charset=utf-8"
    ".csv"  = "text/csv; charset=utf-8"
    ".xlsx" = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

# Automatically terminate any old zombie server holding port 8080 so port 8080 is ALWAYS preserved
try {
    $activeConns = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
    if (-not $activeConns) {
        $activeConns = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
    }
    if ($activeConns) {
        foreach ($c in $activeConns) {
            if ($c.OwningProcess -and $c.OwningProcess -ne 4 -and $c.OwningProcess -ne $PID) {
                Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Milliseconds 600
    }
} catch {
    try {
        $lines = netstat -ano | Select-String ":8080\s+.*LISTENING\s+(\d+)"
        foreach ($m in $lines) {
            if ($m.Matches[0].Groups[1].Value) {
                $pidToKill = [int]$m.Matches[0].Groups[1].Value
                if ($pidToKill -ne 4 -and $pidToKill -ne $PID) {
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        }
        Start-Sleep -Milliseconds 600
    } catch {}
}

# Always prioritize port 8080 for constant localStorage origin
$CandidatePorts = @(8080, 8081, 8082, 8083, 8084, 8085)
$Listener = $null
$Port = $null
$Url = $null

foreach ($p in $CandidatePorts) {
    try {
        $temp = New-Object System.Net.HttpListener
        $testUrl = "http://localhost:$p/"
        $temp.Prefixes.Add($testUrl)
        $temp.Start()
        $Listener = $temp
        $Port = $p
        $Url = $testUrl
        break
    } catch {
        if ($temp) {
            try { $temp.Close() } catch {}
        }
    }
}

if (-not $Listener -or -not $Listener.IsListening) {
    Write-Host "[ERROR] Could not bind to local port." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " COE-Pay: Centralized Payment Authorization, Collection & Monitoring   " -ForegroundColor Green
Write-Host " ICCT Colleges Foundation, Inc. - College of Engineering & Digital Tech" -ForegroundColor White
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " [OK] Local Server running at: $Url" -ForegroundColor Yellow
Write-Host " [OK] Storage Persistence:    $DbFile" -ForegroundColor Gray
Write-Host " [OK] Root Directory:         $Root" -ForegroundColor Gray
Write-Host " Opening default web browser automatically..." -ForegroundColor Gray
Write-Host " Press Ctrl+C in this console window to stop the server.`n" -ForegroundColor Gray

# Open default browser
try {
    Start-Process $Url
} catch {
    Write-Host "[!] Open your browser and navigate to: $Url" -ForegroundColor Yellow
}

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $Response.Headers.Add("Access-Control-Allow-Origin", "*")
        $Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        if ($Request.HttpMethod -eq "OPTIONS") {
            $Response.StatusCode = 200
            $Response.OutputStream.Close()
            continue
        }

        $Path = $Request.Url.LocalPath.ToLower()

        # Database Persistence API: Save Database to Disk
        if ($Path -eq "/api/save_db" -and $Request.HttpMethod -eq "POST") {
            try {
                $reader = New-Object System.IO.StreamReader($Request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                if ($body -and $body.Length -gt 15) {
                    [System.IO.File]::WriteAllText($DbFile, $body, [System.Text.Encoding]::UTF8)
                    $resp = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Database persisted to disk"}')
                    $Response.ContentType = "application/json"
                    $Response.StatusCode = 200
                    $Response.OutputStream.Write($resp, 0, $resp.Length)
                } else {
                    $Response.StatusCode = 400
                }
            } catch {
                $Response.StatusCode = 500
            }
            $Response.OutputStream.Close()
            continue
        }

        # Database Persistence API: Load Database from Disk
        if ($Path -eq "/api/load_db") {
            if (Test-Path $DbFile) {
                $respBytes = [System.IO.File]::ReadAllBytes($DbFile)
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.StatusCode = 200
                $Response.OutputStream.Write($respBytes, 0, $respBytes.Length)
            } else {
                $resp = [System.Text.Encoding]::UTF8.GetBytes('{}')
                $Response.ContentType = "application/json"
                $Response.StatusCode = 200
                $Response.OutputStream.Write($resp, 0, $resp.Length)
            }
            $Response.OutputStream.Close()
            continue
        }

        $RawPath = $Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($RawPath)) {
            $RawPath = "index.html"
        }

        # Pre-inject persisted database state directly into index.html
        if ($RawPath -eq "index.html") {
            $IndexFile = Join-Path $Root "index.html"
            if (Test-Path $IndexFile) {
                $IndexHtml = [System.IO.File]::ReadAllText($IndexFile, [System.Text.Encoding]::UTF8)
                if (Test-Path $DbFile) {
                    $persistedDb = [System.IO.File]::ReadAllText($DbFile, [System.Text.Encoding]::UTF8)
                    if ($persistedDb -and $persistedDb.Length -gt 20) {
                        $injection = "<script>try{window.COEPAY_SERVER_PERSISTED_DB=$persistedDb;}catch(e){console.warn('Persisted DB parse error',e);}</script>`n</head>"
                        $IndexHtml = $IndexHtml.Replace('</head>', $injection)
                    }
                }
                $Bytes = [System.Text.Encoding]::UTF8.GetBytes($IndexHtml)
                $Response.ContentType = "text/html; charset=utf-8"
                $Response.ContentLength64 = $Bytes.Length
                $Response.StatusCode = 200
                $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
                $Response.OutputStream.Close()
                continue
            }
        }

        # Normalize path
        $SafePath = $RawPath -replace '/', '\'
        $FilePath = Join-Path $Root $SafePath

        # Security check: ensure file is within root (case-insensitive for Windows)
        $FullFilePath = [System.IO.Path]::GetFullPath($FilePath)
        $FullRoot = [System.IO.Path]::GetFullPath($Root)

        if ($FullFilePath.StartsWith($FullRoot, [System.StringComparison]::OrdinalIgnoreCase) -and [System.IO.File]::Exists($FullFilePath)) {
            $Ext = [System.IO.Path]::GetExtension($FullFilePath).ToLower()
            $ContentType = $MimeTypes[$Ext]
            if (-not $ContentType) { $ContentType = "application/octet-stream" }

            $Response.ContentType = $ContentType
            $Bytes = [System.IO.File]::ReadAllBytes($FullFilePath)
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.StatusCode = 200
        } else {
            $Response.StatusCode = 404
            $NotFoundHtml = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found: $RawPath</h1>")
            $Response.ContentType = "text/html; charset=utf-8"
            $Response.ContentLength64 = $NotFoundHtml.Length
            $Response.OutputStream.Write($NotFoundHtml, 0, $NotFoundHtml.Length)
        }
        $Response.OutputStream.Close()
    } catch {
        # Catch client aborts / cancellation
    }
}
