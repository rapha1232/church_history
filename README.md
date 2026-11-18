# History of the Christian Church

A story-driven history of the Church in fifteen seasons, with the whole Bible in nine editions,
the original Greek and Hebrew with a lexicon, the Church Fathers on every verse, maps, a zoomable
timeline and daily readings for Catholic, Orthodox and Anglican traditions. It runs as a web page,
an Android app and an installable iPhone/iPad web app, and works fully offline.

## Get the app

- **Android:** open the [latest release](../../releases/latest) and download `ChurchHistory-<version>.apk`.
  Open it on your phone to install or update (allow installs from your browser or files app if asked).
- **iPhone and iPad:** open the web app (GitHub Pages, see below) in Safari, tap **Share → Add to Home Screen**.
  On the home page, **Save everything for offline** stores all texts and images on the device.

## What is in this repository

| Folder | Contents |
|---|---|
| `site/` | The built app: `index.html`, all images (`img/`, 344 pictures) and the Bible library (`bible/`: nine editions, Greek and Hebrew word data, lexicons, cross-references, the Fathers’ commentary, topics, people and places, lectionaries). This is exactly what ships in the APK and the web app. |
| `android/` | The Android project: manifest, Java sources (WebView shell, bridge, widgets, notifications), resources, bundled fonts. |
| `tools/` | The generators used to build `site/`: content layers (`extras*.py`), design and behaviour layers (`v1*.css`, `v1*.js`), Bible data builders (`bible.py`, `orig.py`, `fathers.py`, `tipnr.py`, …) and the browser test suites (`shot*.js`). |
| `content/` | Inputs the generators read: the base page, document texts, map geometry and image metadata. |
| `scripts/` | `build_apk.sh` (Android build) and `build_pwa.py` (iPhone/iPad web app). |
| `.github/workflows/` | Automatic releases and the web app (below). |

The generators in `tools/` were written for a working tree that also holds the downloaded source
data (Bible texts from eBible.org, STEPBible data, OpenBible.info cross-references and topics,
the HistoricalChristianFaith commentaries, original image files). Those downloads are large and
are not stored here; everything they produce is already in `site/`. To change the app, edit
`site/` (or rebuild it with the tools) and push.

## Releases: a downloadable APK for every release

The **Release APK** workflow builds the Android app from `site/` and `android/` and attaches the APK
to a GitHub release. Start it in any of these ways:

```bash
git tag v18
git push origin v18
```

or publish a release from the GitHub website with a tag such as `v18.1`, or run the workflow by hand
(Actions → Release APK → Run workflow). The tag sets the version: `v18` → version 18 (code 1800),
`v18.1` → version 18.1 (code 1801).

### One-time setup: the signing key

Android only installs an update if it is signed with the same key as the installed app. The key is
not stored in this public repository. Add it once under **Settings → Secrets and variables → Actions**:

- `KEYSTORE_B64`: the release keystore, base64-encoded (`base64 -w0 release.jks`)
- `KEYSTORE_PASS`: its password

Without these secrets the workflow still produces an APK, signed with a temporary key and marked
with a warning; it installs on a new phone but cannot update an existing installation.

## The web app on GitHub Pages (no file limits)

The **Web app** workflow publishes the iPhone/iPad web app on every push to `main` that touches
`site/`. Enable it once under **Settings → Pages → Build and deployment → Source: GitHub Actions**.
It is then served at `https://<owner>.github.io/church_history/`.

## Build locally

```bash
python3 scripts/build_pwa.py pwa                     # web app into pwa/
KEYSTORE=release.jks KEYSTORE_PASS=... bash scripts/build_apk.sh 1800 18.0   # APK into dist/
```

`build_apk.sh` needs the Android SDK (build-tools 34.0.0, platform android-34), JDK 17, Python 3 and `zip`.

## Sources and licences

Texts and data are public domain or openly licensed: KJV, WEB, Douay–Rheims, Brenton’s Septuagint
and Clementine Vulgate (eBible.org, public domain); Greek and Hebrew word data, lexicons and the
people and places index (STEPBible.org, CC BY 4.0); cross-references and topics (OpenBible.info,
CC BY); the Fathers’ commentary (public-domain translations via the HistoricalChristianFaith
Commentaries Database); BCP daily office (public domain; JSON by reubenlillie/daily-office, MIT);
Orthodox lectionary (orthocal, MIT); Catholic reading references (catholic-readings-api, MIT).
Images are public domain or Creative Commons; each picture’s author, licence and source are shown
in the app.
