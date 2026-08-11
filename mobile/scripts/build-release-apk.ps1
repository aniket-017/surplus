# Builds a release APK on Windows via a short junction path (C:\sm).
# Avoids CMake/ninja MAX_PATH (260) failures from deep Desktop\Projects paths.
$ErrorActionPreference = "Stop"

$mobileDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$shortRoot = "C:\sm"

if (-not (Test-Path "$shortRoot\android\gradlew.bat")) {
  if (Test-Path $shortRoot) {
    cmd /c "rmdir `"$shortRoot`""
  }
  cmd /c "mklink /J `"$shortRoot`" `"$mobileDir`""
  if (-not (Test-Path "$shortRoot\android\gradlew.bat")) {
    throw "Failed to create junction $shortRoot -> $mobileDir"
  }
  Write-Host "Created junction $shortRoot -> $mobileDir"
} else {
  Write-Host "Using existing junction $shortRoot"
}

Set-Location "$shortRoot\android"

if (Test-Path "app\.cxx") {
  Write-Host "Removing app\.cxx ..."
  cmd /c "rd /s /q app\.cxx"
}

# arm64-v8a covers modern phones; fewer ABIs = shorter/faster Windows builds
Write-Host "Building assembleRelease (arm64-v8a) ..."
& .\gradlew.bat assembleRelease "-PreactNativeArchitectures=arm64-v8a"
$exit = $LASTEXITCODE

$apk = Join-Path $mobileDir "android\app\build\outputs\apk\release\app-release.apk"
if ($exit -eq 0 -and (Test-Path $apk)) {
  Write-Host ""
  Write-Host "BUILD OK"
  Write-Host "APK: $apk"
} else {
  Write-Host "BUILD FAILED (exit $exit)"
}

exit $exit
