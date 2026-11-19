#!/usr/bin/env bash
# Build the Android app from site/ and android/ with Gradle.
#   scripts/build_apk.sh <versionCode> <versionName>
# Needs: JDK 17+, the Android SDK (platform android-36; set ANDROID_HOME), python3.
# Signing: set KEYSTORE (path), KEYSTORE_PASS, KEY_ALIAS (default hcc); without KEYSTORE the APK is unsigned.
# Output: dist/ChurchHistory-<versionName>.apk (install directly) and dist/ChurchHistory-<versionName>.aab (app stores).
set -euo pipefail
CODE=${1:?versionCode}; NAME=${2:?versionName}
ROOT=$(cd "$(dirname "$0")/.." && pwd); cd "$ROOT"
export ANDROID_HOME=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/opt/android-sdk}}

# 1. app assets: the site, with Google Fonts replaced by the bundled copies; study packs left out (downloaded on first use)
python3 scripts/prepare_assets.py

# 2. compile, package and sign
mkdir -p dist
(cd android && ./gradlew --no-daemon -q -PVERSION_CODE="$CODE" -PVERSION_NAME="$NAME" assembleRelease bundleRelease)
cp android/build/outputs/apk/release/app-release*.apk "dist/ChurchHistory-$NAME.apk" 2>/dev/null || cp android/build/outputs/apk/release/*.apk "dist/ChurchHistory-$NAME.apk"
cp android/build/outputs/bundle/release/*.aab "dist/ChurchHistory-$NAME.aab"
ls -la dist/ChurchHistory-"$NAME".*
