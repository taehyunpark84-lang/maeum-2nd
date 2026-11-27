param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('api', 'worker', 'mobile', 'emotion')]
    [string]$Service,
    [string]$NodeHome = "$env:LOCALAPPDATA/Author Software/nvm/installs/v24.21.0"
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$previousPath = $env:Path
$previousPackagerHost = $env:REACT_NATIVE_PACKAGER_HOSTNAME
$previousModelDirectory = $env:MODEL_DIR
Push-Location $projectRoot
try {
    if ($Service -eq 'emotion') {
        Set-Location scripts/emotion_server
        if (-not (Test-Path '.venv/Scripts/python.exe') -or
            -not (Test-Path 'koelectra_emotion6_multi_best/model.safetensors')) {
            throw 'Prepare the isolated emotion environment and model. See docs/TEAM_INTEGRATION.md.'
        }
        $env:MODEL_DIR = (Resolve-Path 'koelectra_emotion6_multi_best').Path
        & ./.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8001
    } elseif ($Service -eq 'mobile') {
        if (-not (Test-Path 'mobile/.env')) { throw 'Prepare mobile/.env first. See docs/LOCAL_DEVELOPMENT.md.' }
        $mobileEnv = Get-Content 'mobile/.env' -Raw
        if ($mobileEnv -notmatch '(?m)^EXPO_PUBLIC_LOCAL_DEVELOPMENT=1\r?$') {
            throw 'Local development flag is required in mobile/.env.'
        }
        $apiLine = [regex]::Match($mobileEnv, '(?m)^EXPO_PUBLIC_API_URL=(.+)\r?$')
        if (-not $apiLine.Success) { throw 'EXPO_PUBLIC_API_URL is required.' }
        $apiUri = [uri]$apiLine.Groups[1].Value.Trim()
        $localAddresses = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
            ForEach-Object { $_.GetIPProperties().UnicastAddresses } |
            ForEach-Object { $_.Address.ToString() }
        if ($apiUri.Scheme -ne 'http' -or $apiUri.Port -ne 8000 -or $apiUri.Host -notin $localAddresses) {
            throw 'API URL must use this PC IPv4 address and port 8000. Update mobile/.env after Wi-Fi changes.'
        }
        $env:REACT_NATIVE_PACKAGER_HOSTNAME = $apiUri.Host
        if (Test-Path "$NodeHome/node.exe") { $env:Path = "$NodeHome;$env:Path" }
        Set-Location mobile
        & npm.cmd start -- --lan --clear
    } else {
        if (-not (Test-Path 'backend/.env')) { throw 'Prepare backend/.env first. See docs/LOCAL_DEVELOPMENT.md.' }
        Set-Location backend
        # Fail before starting if this launcher points outside its own development storage.
        & ./.venv/Scripts/python.exe -c "from pathlib import Path; from sqlalchemy.engine import make_url; from app.config import ROOT, DATA, DATABASE_URL, AI_MODE, API_KEY; u=make_url(DATABASE_URL); assert AI_MODE in ('mock', 'openai'), 'Unsupported AI mode'; assert AI_MODE != 'openai' or API_KEY.strip(), 'Set OPENAI_API_KEY in this worktree backend/.env first'; assert DATA == (ROOT/'storage').resolve(), 'Unexpected storage'; assert u.drivername == 'sqlite' and Path(u.database).resolve() == DATA/'maeum-development.db', 'Unexpected development DB'"
        if ($LASTEXITCODE -ne 0) { throw 'Local backend configuration check failed.' }
        if ($Service -eq 'api') {
            & ./.venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
        } else {
            & ./.venv/Scripts/python.exe -u -m app.worker
        }
    }
    if ($LASTEXITCODE -ne 0) { throw "$Service exited with code $LASTEXITCODE" }
} finally {
    Pop-Location
    $env:Path = $previousPath
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $previousPackagerHost
    $env:MODEL_DIR = $previousModelDirectory
}
