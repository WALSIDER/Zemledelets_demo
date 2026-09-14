param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
$siteUrl = 'http://localhost:8080'
$probeUrl = 'http://127.0.0.1:8080'
$serverFile = Join-Path $projectDir 'server.js'
$stdoutFile = Join-Path $projectDir 'localhost-8080.log'
$stderrFile = Join-Path $projectDir 'localhost-8080.error.log'

function Test-LocalPort {
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect('127.0.0.1', 8080)
        return $true
    } catch {
        return $false
    } finally {
        $connection.Dispose()
    }
}

function Test-SiteReady {
    try {
        $response = Invoke-WebRequest -Uri $probeUrl -UseBasicParsing -TimeoutSec 2
        $html = Get-Content -LiteralPath (Join-Path $projectDir 'public\index.html') -Raw -Encoding UTF8
        $expectedTitle = [regex]::Match($html, '<title>.*?</title>').Value
        if (-not $expectedTitle -or -not $response.Content.Contains($expectedTitle)) {
            return $false
        }
        $bootstrap = Invoke-RestMethod -Uri "$probeUrl/api/bootstrap" -TimeoutSec 2
        return $null -ne $bootstrap.siteMetrics
    } catch {
        return $false
    }
}

try {
    if (Test-LocalPort) {
        if (-not (Test-SiteReady)) {
            throw 'Port 8080 is occupied by another application, or the site is not responding. Close that application and try again.'
        }
        Write-Host "Site is already running: $siteUrl"
    } else {
        $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
        $nodeCandidates = @(
            (Join-Path $projectDir '.tools\node.exe'),
            (Join-Path $projectDir 'node.exe'),
            $(if ($nodeCommand) { $nodeCommand.Source }),
            (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
            (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
            (Join-Path $projectDir '..\StrelaPortal\.tools\node-v22.19.0-win-x64\node.exe')
        )
        $nodePath = $nodeCandidates | Where-Object {
            $_ -and (Test-Path -LiteralPath $_ -PathType Leaf)
        } | Select-Object -First 1

        if (-not $nodePath) {
            throw 'Node.js was not found. Install Node.js LTS from https://nodejs.org/ and run this file again.'
        }

        $env:PORT = '8080'
        Write-Host "Starting site: $siteUrl"
        $serverProcess = Start-Process -FilePath $nodePath `
            -ArgumentList @("`"$serverFile`"") `
            -WorkingDirectory $projectDir -WindowStyle Hidden `
            -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile -PassThru

        $ready = $false
        $deadline = (Get-Date).AddSeconds(20)
        while ((Get-Date) -lt $deadline) {
            if ($serverProcess.HasExited) {
                throw "Server stopped unexpectedly. See log: $stderrFile"
            }
            if (Test-SiteReady) {
                $ready = $true
                break
            }
            Start-Sleep -Milliseconds 250
        }
        if (-not $ready) {
            throw "Server did not respond in time. See logs: $stdoutFile and $stderrFile"
        }
        Write-Host "Site is running in the background. PID: $($serverProcess.Id)"
    }

    if (-not $NoBrowser) {
        Start-Process $siteUrl
    }
    Write-Host $siteUrl
    exit 0
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
