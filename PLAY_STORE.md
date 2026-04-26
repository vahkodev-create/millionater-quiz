## Publish to Google Play (TWA / Bubblewrap)

This project is a PWA. The Play Store path is:

- Host the game on **HTTPS**
- Wrap it as an Android app using **Trusted Web Activity (TWA)**
- Upload the generated **`.aab`** to Google Play Console

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
- Use a unique **package name**, e.g. `com.yourname.millionroad`
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
  - Store listing (title/description/screenshots)
  - Data safety
  - Content rating
  - Privacy policy URL (required)

