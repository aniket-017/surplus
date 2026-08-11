# Capture Surplus Android crash logs. Connect phone with USB debugging, then:
#   powershell -ExecutionPolicy Bypass -File .\scripts\capture-crash-log.ps1
$ErrorActionPreference = "Stop"
$sdkCandidates = @("D:\Android\Sdk", "$env:LOCALAPPDATA\Android\Sdk")
$sdk = $sdkCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $sdk) { throw "Android SDK not found" }
$adb = Join-Path $sdk "platform-tools\adb.exe"

Write-Host "Devices:"
& $adb devices -l
$out = Join-Path $PSScriptRoot "..\crash-log.txt"
& $adb logcat -c
Write-Host "Open the Surplus app on the phone now. Capturing 20s..."
Start-Sleep 20
& $adb logcat -d -v time *:S AndroidRuntime:E ReactNative:E ReactNativeJS:E SoLoader:E libc:F DEBUG:F | Out-File -FilePath $out -Encoding utf8
Write-Host "Saved: $out"
Get-Content $out -Tail 80
