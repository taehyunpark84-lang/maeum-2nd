param(
    [string]$NodeHome = (Join-Path $env:USERPROFILE 'AppData\Local\Author Software\nvm\installs\v24.21.0')
)

# Dot-source this file to use the installed runtime in the current PowerShell.
# This does not change nvm, the registry, or the system/user PATH.
$nodeExecutable = Join-Path $NodeHome 'node.exe'
$npmExecutable = Join-Path $NodeHome 'npm.cmd'
if (-not (Test-Path -LiteralPath $nodeExecutable -PathType Leaf) -or
    -not (Test-Path -LiteralPath $npmExecutable -PathType Leaf)) {
    throw "Node.js and npm.cmd were not found in '$NodeHome'. Supply -NodeHome with an installed Node.js directory."
}

if (($env:Path -split ';')[0] -ne $NodeHome) {
    $env:Path = "$NodeHome;$env:Path"
}
& $nodeExecutable --version
if ($LASTEXITCODE -ne 0) { throw 'Node.js failed to start.' }
& $npmExecutable --version
if ($LASTEXITCODE -ne 0) { throw 'npm failed to start.' }
