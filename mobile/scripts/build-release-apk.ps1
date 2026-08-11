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

# Force production JS bundle embedding (avoids DEV/Metro startup crashes)
$env:NODE_ENV = "production"

if (Test-Path "app\.cxx") {
  Write-Host "Removing app\.cxx ..."
  cmd /c "rd /s /q app\.cxx"
}

Write-Host "Cleaning previous Android outputs ..."
& .\gradlew.bat clean

# Phone + common emulator ABIs
Write-Host "Building assembleRelease (armeabi-v7a,arm64-v8a,x86_64) ..."
& .\gradlew.bat assembleRelease "-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64"
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
