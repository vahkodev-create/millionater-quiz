## Publish to Google Play (TWA / Bubblewrap)

This project is a PWA for **Միլիոնատեր Quiz**. The clean Play Store path is:

- Host the game on **HTTPS**
- Wrap it as an Android app using **Trusted Web Activity (TWA)**
- Upload the generated **`.aab`** to Google Play Console

Current Google Play requirements to keep in mind:

- New apps and updates must target Android 15 / API 35 or higher.
- New Play apps should be uploaded as Android App Bundles (`.aab`).
- Use Play App Signing in Play Console.

### 1) Generate required PNG icons

```sh
npm install
npm run gen:icons
```

This generates:

- `icons/icon-192.png`
- `icons/icon-512.png`
- `icons/maskable-192.png`
- `icons/maskable-512.png`

### 2) Deploy the site (HTTPS)

You must host these files on a public HTTPS origin, for example:

- `https://yourdomain.com/`
- `https://yourdomain.com/manifest.json`

Important:
- `manifest.json` currently uses `start_url: "/"` and `scope: "/"`.
  Host at the root of the domain, or change these if you deploy under a subpath.

### 3) Create the Android wrapper with Bubblewrap

Install Bubblewrap:

```sh
npm i -g @bubblewrap/cli
```

Initialize the wrapper (run this in the project folder):

```sh
bubblewrap init --manifest https://yourdomain.com/manifest.json
```

When prompted:
- Use a unique **package name**, e.g. `com.yourname.millionater`
- Choose **Play App Signing** in Play Console later (recommended)

Build an Android App Bundle:

```sh
bubblewrap build
```

Bubblewrap outputs a `.aab` you can upload to Play Console.

### 4) Add Digital Asset Links (required for TWA)

TWA requires an `assetlinks.json` hosted at:

- `https://yourdomain.com/.well-known/assetlinks.json`

This repo includes a template at:

- `.well-known/assetlinks.json`

You must replace:
- `package_name`
- `sha256_cert_fingerprints`

To get the SHA-256 fingerprint after Bubblewrap creates/signs the project, run (inside the generated Android project):

```sh
keytool -list -v -keystore <your-keystore>.jks -alias <your-alias>
```

Then copy the `SHA256:` value into `assetlinks.json`.

### 5) Play Console upload

- Create an app in Google Play Console
- Upload the `.aab` to **Internal testing** first
- Fill in:
  - Store listing (use `STORE_LISTING.md` as a draft)
  - Data safety
  - Content rating
  - Privacy policy URL, for example `https://yourdomain.com/privacy.html`

### Files already prepared in this repo

- `manifest.json`
- `service-worker.js`
- `analytics-config.js`
- `analytics.js`
- `icons/`
- `.well-known/assetlinks.json` template
- `STORE_LISTING.md`
- `privacy.html`

### 6) Optional analytics setup

The app includes Firebase-ready analytics, disabled by default.

To enable it:

1. Create a Firebase project.
2. Add a Web App in Firebase.
3. Copy the Firebase config into `analytics-config.js`.
4. Change `enabled: false` to `enabled: true`.
5. Confirm the privacy policy and Play/App Store privacy forms disclose analytics.

Tracked anonymously:

- `app_open`
- `session_start`
- `onboarding_complete`
- `game_start`
- `question_shown`
- `question_answered`
- `lifeline_used`
- `setting_changed`
- `game_finish`

Each event includes an anonymous local user ID, session ID, and detected platform such as `android_app`, `ios_app`, `android_web`, `ios_web`, or `web`.

### What I need from you to build the uploadable `.aab`

- Public HTTPS URL where the game will live
- Final Android package name, like `com.vahram.millionater`
- Whether you already have a Google Play Developer account
