param(
    [string]$JavaHome = 'C:\Program Files\Java\jdk-21.0.12',
    [string]$AndroidSdk = 'C:\Users\dream\AppData\Local\Android\Sdk',
    [switch]$Offline
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$mobileRoot = Join-Path $projectRoot 'mobile'
$previousJava = $env:JAVA_HOME
$previousAndroid = $env:ANDROID_HOME
$previousNodeEnv = $env:NODE_ENV
Push-Location $mobileRoot
try {
    if (-not (Test-Path "$JavaHome/bin/java.exe")) { throw 'Java installation not found.' }
    if (-not (Test-Path "$AndroidSdk/platform-tools/adb.exe")) { throw 'Android SDK not found.' }
    $env:JAVA_HOME = $JavaHome
    $env:ANDROID_HOME = $AndroidSdk
    $env:NODE_ENV = 'production'
    & npx.cmd expo prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed.' }
    Set-Location android
    $gradleArgs = @(':app:assembleRelease', '-PreactNativeArchitectures=arm64-v8a', '--console=plain', '--max-workers=2')
    if ($Offline) { $gradleArgs += '--offline' }
    & .\gradlew.bat @gradleArgs
    if ($LASTEXITCODE -ne 0) { throw 'APK build failed.' }
    $destination = Join-Path $projectRoot 'output/apk'
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    $apk = Join-Path $destination 'maeum-2nd-test-arm64.apk'
    Copy-Item -LiteralPath 'app/build/outputs/apk/release/app-release.apk' -Destination $apk
    Get-FileHash -Algorithm SHA256 -LiteralPath $apk
    Write-Output 'Test APK only: the generated Expo template uses a debug signing key for release builds.'
} finally {
    Pop-Location
    $env:JAVA_HOME = $previousJava
    $env:ANDROID_HOME = $previousAndroid
    $env:NODE_ENV = $previousNodeEnv
}
