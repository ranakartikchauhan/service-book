@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo       WorkMarket - Standalone Local APK Builder
echo ======================================================
echo.

set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo [1/3] Verifying Java and Android Environment...
echo Java Home:    %JAVA_HOME%
echo Android Home: %ANDROID_HOME%
echo.

echo [2/3] Compiling Release APK with Gradle...
cd /d "%~dp0android"

call gradlew.bat assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed with error code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Build Completed Successfully!
echo ======================================================
echo 📦 APK Location:
set "APK_PATH=%~dp0android\app\build\outputs\apk\release\app-release.apk"
echo %APK_PATH%
echo ======================================================
echo.

if exist "%APK_PATH%" (
    echo Opening output folder...
    explorer /select,"%APK_PATH%"
)

pause
