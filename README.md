# History of the Christian Church

A story-driven history of the Church in fifteen seasons, with the whole Bible in nine editions,
the original Greek and Hebrew with a lexicon, the Church Fathers on every verse, maps, a zoomable
timeline and daily readings for Catholic, Orthodox and Anglican traditions. It runs as a web page,
an Android app and an installable iPhone/iPad web app, and works fully offline.

## Get the app

- **Android:** open the [latest release](../../releases/latest) and download `ChurchHistory-<version>.apk`.
  Open it on your phone to install it (allow installs from your browser or files app if asked). After that the app
  **updates itself**: it offers each new release when you open it. See [docs/DISTRIBUTION.md](docs/DISTRIBUTION.md).
- **iPhone and iPad:** open the web app (GitHub Pages, see below) in Safari, tap **Share → Add to Home Screen**.
  On the home page, **Save everything for offline** stores all texts and images on the device.

## What is in this repository

| Folder | Contents |
|---|---|
| `site/` | The built app: `index.html`, all images (`img/`, 344 pictures) and the Bible library (`bible/`: nine editions, Greek and Hebrew word data, lexicons, cross-references, the Fathers’ commentary, topics, people and places, lectionaries). This is exactly what ships in the APK and the web app. |
| `android/` | The Android project (Gradle, Kotlin and Java): WebView shell, bridge, widgets, notifications, study packs, backup, updater, resources in five languages, bundled fonts, unit tests in `android/test/`. |
| `DESIGN.md` | The design contract: audit of the app, design direction and research, tokens, components, banned patterns and a checklist. Read it before changing the look. Implemented by `tools/v20.*` (design layer) and `tools/v21.*` (navigation and Studies), with `tools/v22.py` (the default Bible edition in Settings) `tools/v23.*` (the early Christian texts reader) and `tools/v24.*` (authenticity labels, each with its sources), `tools/v25.*` (quote cards with full attribution), `tools/v26.*` (how many Fathers comment on each verse) and `tools/v27.*` (the deuterocanon in the New Testament; data from `tools/dc_allusions.py`), applied in order: `for s in 20 21 22 23 24 25 26 27; do python3 tools/v$s.py; done`. The texts in `site/bible/texts/` are built by `tools/fathers_texts.py` from public-domain CCEL editions (see the script for the sources and how they were checked). The Greek and Latin originals beside them (`*.orig.js`) are built afterwards by `tools/originals.py` from Open Greek and Latin editions (CC BY-SA 4.0). |
| `docs/` | `DISTRIBUTION.md`: signing key, releases, self-updates and free ways to distribute the app. |
| `tools/` | The generators used to build `site/`: content layers (`extras*.py`), design and behaviour layers (`v1*.css`, `v1*.js`), Bible data builders (`bible.py`, `orig.py`, `fathers.py`, `tipnr.py`, …) and the browser test suites (`shot*.js`). |
| `content/` | Inputs the generators read: the base page, document texts, map geometry and image metadata. |
| `scripts/` | `build_apk.sh` (Android build, APK and AAB), `prepare_assets.py` (copies the site into the app, leaving out the study packs) and `build_pwa.py` (iPhone/iPad web app). |
| `.github/workflows/` | Automatic releases and the web app (below). |

The generators in `tools/` were written for a working tree that also holds the downloaded source
data (Bible texts from eBible.org, STEPBible data, OpenBible.info cross-references and topics,
the HistoricalChristianFaith commentaries, original image files). Those downloads are large and
are not stored here; everything they produce is already in `site/`. To change the app, edit
`site/` (or rebuild it with the tools) and push.

## Releases: a downloadable APK for every release (and self-updates)

The **Release APK** workflow builds the Android app from `site/` and `android/` and attaches the APK
to a GitHub release. Start it in any of these ways:

```bash
git tag v18
git push origin v18
```

or publish a release from the GitHub website with a tag such as `v18.1`, or run the workflow by hand
(Actions → Release APK → Run workflow). The tag sets the version: `v18` → version 18 (code 1800),
`v18.1` → version 18.1 (code 1801).

**Automatic releases.** Merging a change to `site/` or `android/` into `main` makes the **Release on merge**
workflow tag that commit with the next version (the highest `vN` tag plus one, e.g. `v24` → `v25`, computed by
`scripts/next_version.sh`) and start the Release APK build for it. Put `[skip release]` in the merge commit
message to skip it. Tags pushed by hand still work as before.

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
KEYSTORE=release.jks KEYSTORE_PASS=... bash scripts/build_apk.sh 1900 19.0   # APK and AAB into dist/
(cd android && ./gradlew testReleaseUnitTest)                                   # unit tests
```

`build_apk.sh` needs JDK 17 or later, the Android SDK (platform android-36; set `ANDROID_HOME`) and Python 3.
Gradle downloads everything else. Widget resources and the interface strings come from `tools/widget_res.py` and
`tools/strings_res.py` (English, Spanish, Portuguese, French and Arabic).

### Study packs

The word-by-word Greek and Hebrew, the lexicons and concordance, the Greek Bible and the Vulgate are left out of the
APK. That brings it down from 63 MB to about 50 MB. The app downloads each file from the GitHub Pages web app the
first time it is needed and keeps it. **Settings → Offline study packs** downloads a whole pack ahead of time.
The web app must stay published for this.

### Bible editions from a file

**Settings → Bible editions from a file** adds a translation from a JSON file to the device it is used on
(formats: `[{book, chapters:[{chapter, verses:[{verse, text}]}]}]`, `{books:[…]}` or `{"Genesis":{"1":{"1":"…"}}}`).
It is stored only on that device and never added to this repository. Use it only for translations you have the right
to use: copyrighted translations such as the NABRE (© Confraternity of Christian Doctrine) cannot be redistributed
in this public app without the publisher's licence.

## Sources and licences

Texts and data are public domain or openly licensed: KJV, WEB, Douay–Rheims, Brenton’s Septuagint
and Clementine Vulgate (eBible.org, public domain); Greek and Hebrew word data, lexicons and the
people and places index (STEPBible.org, CC BY 4.0); cross-references and topics (OpenBible.info,
CC BY); the Fathers’ commentary (public-domain translations via the HistoricalChristianFaith
Commentaries Database); BCP daily office (public domain; JSON by reubenlillie/daily-office, MIT);
Orthodox lectionary (orthocal, MIT); Catholic reading references (catholic-readings-api, MIT).
Images are public domain or Creative Commons; each picture’s author, licence and source are shown
in the app.
