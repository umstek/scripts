$targetDir = Join-Path $env:USERPROFILE "bin"
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir
}

$scriptPath = Join-Path $PSScriptRoot "s"
$linkPath = Join-Path $targetDir "s"

New-Item -ItemType SymbolicLink -Path $linkPath -Target $scriptPath

Write-Host "Please add `"$targetDir`" to PATH, if `s` is not working."

