#!/usr/bin/env bash
# Build the Android APK from site/ and android/.
#   scripts/build_apk.sh <versionCode> <versionName>
# Needs: Android SDK (build-tools 34.0.0, platform android-34), JDK 17, python3, zip.
# Signing: set KEYSTORE (path), KEYSTORE_PASS, KEY_ALIAS (default hcc). Output: dist/ChurchHistory-<versionName>.apk
set -euo pipefail
CODE=${1:?versionCode}; NAME=${2:?versionName}
ROOT=$(cd "$(dirname "$0")/.." && pwd); cd "$ROOT"
SDK=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/opt/android-sdk}}
BT=$SDK/build-tools/34.0.0; AJ=$SDK/platforms/android-34/android.jar
: "${KEYSTORE:?set KEYSTORE to the signing keystore path}"; : "${KEYSTORE_PASS:?set KEYSTORE_PASS}"; ALIAS=${KEY_ALIAS:-hcc}

# 1. app assets: the site, with Google Fonts replaced by the bundled copies
python3 - <<'P'
import re, shutil
s = open('site/index.html', encoding='utf-8').read()
s = re.sub(r'<link rel="preconnect"[^>]*>', '', s)
s = re.sub(r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">', '<link href="fonts.css" rel="stylesheet">', s)
s = s.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
assert 'fonts.googleapis' not in s
open('android/assets/index.html', 'w', encoding='utf-8').write(s)
for d in ('img', 'bible'):
    shutil.rmtree('android/assets/' + d, ignore_errors=True); shutil.copytree('site/' + d, 'android/assets/' + d)
for f in ('quotes.json', 'onthisday.json', 'verses.json'): shutil.copy('tools/' + f, 'android/assets/' + f)
P

# 2. compile, package, align, sign
B=android/build; rm -rf "$B"; mkdir -p "$B/res" "$B/gen" "$B/classes" dist
"$BT/aapt2" compile --dir android/res -o "$B/res/res.zip"
"$BT/aapt2" link -o "$B/base.apk" -I "$AJ" --manifest android/AndroidManifest.xml -A android/assets --java "$B/gen" "$B/res/res.zip" \
  --min-sdk-version 24 --target-sdk-version 34 --version-code "$CODE" --version-name "$NAME" -0 webp -0 woff2 -0 json
javac --release 8 -nowarn -classpath "$AJ" -d "$B/classes" "$B/gen/org/hcc/history/R.java" android/src/org/hcc/history/*.java 2>&1 | grep -v "^Note:\|warning: \[options\]\|warnings\?$" || true
"$BT/d8" --min-api 24 --lib "$AJ" --output "$B" $(find "$B/classes" -name '*.class')
cp "$B/base.apk" "$B/unsigned.apk"; (cd "$B" && zip -q -j unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 "$B/unsigned.apk" "$B/aligned.apk"
OUT="dist/ChurchHistory-$NAME.apk"
"$BT/apksigner" sign --ks "$KEYSTORE" --ks-key-alias "$ALIAS" --ks-pass env:KEYSTORE_PASS --key-pass env:KEYSTORE_PASS --out "$OUT" "$B/aligned.apk"
"$BT/apksigner" verify "$OUT"
ls -la "$OUT"
