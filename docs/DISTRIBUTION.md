# Getting updates to phones without downloading the APK by hand

Short version: **the app now updates itself.** Once your phones run version 19 or later, each new GitHub release
appears in the app as "Update available". The reader taps *Update*, Android asks for confirmation, and the update
installs over the old version. Nothing is lost, and no app store or payment is needed.

Two one-time steps make this work, and both are free.

## 1. A permanent signing key (required, free)

Android installs an update only if it is signed with **the same key** as the installed app. If the release workflow
has no key, it signs every release with a new temporary key, and those builds can never update each other.

On any computer with Java installed:

```bash
keytool -genkeypair -keystore release.jks -alias hcc -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Church History"
```

```bash
base64 -w0 release.jks > release.jks.b64
```

(On macOS use `base64 -i release.jks -o release.jks.b64`.)

In the repository on GitHub, open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
|---|---|
| `KEYSTORE_B64` | the contents of `release.jks.b64` |
| `KEYSTORE_PASS` | the password you typed for the keystore |

**Keep `release.jks` and its password safe, off GitHub** (a password manager plus a USB stick, for example).
If you lose it, no phone can update again: everyone would have to uninstall and reinstall, which deletes their
reading progress unless they saved a backup file first (Settings → *Save to a file*).

If phones currently have a build signed with a temporary key, install the first build signed with your permanent key
by hand: uninstall, then install. From then on, updates arrive by themselves.

## 2. Publishing a release (as before)

```bash
git tag v19
```

```bash
git push origin v19
```

The **Release APK** workflow builds and signs the app, runs the unit tests and attaches two files to the release:

- `ChurchHistory-19.apk`: what phones install, and what the in-app updater downloads.
- `ChurchHistory-19.aab`: the Android App Bundle that app stores ask for. Keep it in case you use one later.

The version comes from the tag (`v19` → 19.0, `v19.1` → 19.1). Always use a higher tag than the last one.

## How the in-app updater behaves

- When the app opens (at most twice a day), it asks GitHub for the latest release. If that release is newer, it offers
  *Update*, *Later* or *Skip this version*. **Settings → Updates** has *Check for updates* and an on/off switch.
- Once a night it checks again and shows a notification, so people who rarely open the app still hear about updates.
- The first time someone taps *Update*, Android asks them to allow "Install unknown apps" for Church History. That's
  one switch, needed only once.
- If an app store installed the app (Google Play, Galaxy Store, F-Droid, Obtainium and others), the updater stays
  quiet and leaves updates to the store.
- It reads only public release information from `api.github.com`. Nothing about the reader is sent.

## Optional free ways to distribute

- **Obtainium** (free, open source): an app that watches GitHub releases and updates apps from them. In Obtainium,
  choose *Add app* and paste `https://github.com/rapha1232/church_history`. It's useful if you prefer one updater for many apps.
- **F-Droid** (free): the main open-source store. It builds the app itself from this repository, which is MIT-licensed
  with open data, so it qualifies. To apply, open a "Request for Packaging" or a merge request at
  `gitlab.com/fdroid/fdroiddata`. Review takes weeks. F-Droid signs with its own key, so people should choose either
  F-Droid or the GitHub APK and not switch between them.
- **Samsung Galaxy Store** (free seller account at `seller.samsungapps.com`): reaches Samsung phones and updates them
  through the store. Upload the `.apk`, a 512×512 icon (`android/icon512.png`), screenshots, a short description
  and a privacy policy URL. The app collects no data, so a one-paragraph page on GitHub Pages is enough.

## Google Play: not used (one-time fee of US$25)

A Google Play developer account costs US$25. New personal accounts must also run a closed test with 12 testers for
14 days before the app can be published. If you change your mind later, the `.aab` attached to every release is the
file Play asks for, and the app already targets the Android version Play currently requires.

## Coming from Google: developer verification (2026–2027)

Google is rolling out "developer verification" for apps installed outside Play on certified Android phones:
- **30 September 2026:** Brazil, Indonesia, Singapore and Thailand.
- **2027:** worldwide.

Unregistered apps can still be installed through an "advanced" flow or ADB. To keep installs and updates smooth for
ordinary users, the developer registers in the Android Developer Console:

- **Free** "limited distribution" account (email only, no ID): covers up to **20 devices**. That's enough for
  family, friends or a parish group.
- **Standard** account: US$25, for more devices than that.

Registration ties your package name (`org.hcc.history`) and your signing key to you, which is one more reason to keep
`release.jks` safe. Outside those four countries, nothing changes before the 2027 rollout.

### Registering with the free account (enough for up to 20 devices)

1. Create the signing key and the two GitHub secrets first (section 1). Registration links the app to this key.
2. Print the key's fingerprint and copy the `SHA256:` line:

   ```bash
   keytool -list -v -keystore release.jks -alias hcc
   ```

3. Sign up in the Android Developer Console and choose the free limited-distribution account (email only, no ID).
4. Register the app with the package name `org.hcc.history` and that SHA-256 fingerprint.
5. Release as usual. If you need more than 20 devices later, upgrade to the standard account. The package name and
   key stay the same, so nobody has to reinstall.

