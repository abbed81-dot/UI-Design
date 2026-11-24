# Numbers Farm (مزرعة الأرقام): iOS & Android app

The Arabic maths game from `../multiplication-game/index.html`, packaged as a native app with [Capacitor](https://capacitorjs.com).

- **One source for web and app.** The game lives in `../multiplication-game/index.html`. `npm run build` copies it into `www/` and swaps the Google Fonts links for fonts bundled in `www/fonts/`, so the app works offline.
- **Works offline.** The Android build has no internet permission (its only permission is vibration, for haptics), and neither app sends data anywhere.
- **Native touches:**
  - Full-screen layout that respects the notch and home bar.
  - Android back button support.
  - Haptics on answers.
  - Splash screen.
  - Status bar that follows light and dark mode.
  - The question timer pauses while the app is in the background.
  - A parental gate in front of the parent page.

```
mobile-app/
├── www/                  built web app (index.html is generated; fonts/ is bundled)
├── android/              Android Studio project (Gradle)
├── ios/                  Xcode project (Swift Package Manager, no CocoaPods)
├── assets/               source art for icons and splash (rendered by scripts/render-art.cjs)
├── store/                listing text, privacy policy, questionnaire answers, screenshots, feature graphic
├── scripts/              build-www, render-art, screenshots, check-listing
└── capacitor.config.json
```

## 1. Before the first release: set your own identifiers

| What | Where | Placeholder now |
| --- | --- | --- |
| App ID / bundle ID (must be unique and yours, e.g. `com.yourcompany.numbersfarm`) | `capacitor.config.json` → `appId`; `android/app/build.gradle` → `namespace` and `applicationId`; the folder `android/app/src/main/java/com/numbersfarm/kids/` and the `package` line in `MainActivity.java`; Xcode → target **App** → Signing & Capabilities → Bundle Identifier | `com.numbersfarm.kids` |
| Version | `android/app/build.gradle` (`versionCode`, `versionName`); Xcode → General → Version / Build | 1 / 1.0.0 |
| Contact email | `store/privacy-policy.html` (two places) | `[your contact email]` |

> The App ID cannot be changed after the first upload to either store, so choose it carefully.

## 2. Build the web part

```bash
cd mobile-app
npm install
npm run sync          # builds www/ from ../multiplication-game/index.html and copies it into both native projects
```

Run `npm run sync` after **every** change to the game.

## 3. Android → Google Play

Requirements: Android Studio (it installs the Android SDK and JDK 21).

1. Open the project with `npm run android` (or open the `android/` folder in Android Studio).
2. Test it on an emulator or a phone with ▶ Run.
3. Create the upload bundle:
   - Go to **Build → Generate Signed App Bundle or APK → Android App Bundle**.
   - Create an upload keystore and keep it, and its passwords, safe. You need it for every future update.
   - Choose the **release** variant.
   - The bundle is written to `android/app/release/app-release.aab`.
4. Upload to Google Play:
   - In Google Play Console, create the app.
   - Fill in the listing from `store/listing.md`.
   - Add the screenshots from `store/screenshots/android-*` and `store/feature-graphic.png`.
   - Use `store/play-icon-512.png` as the icon.
   - Answer the questionnaires using `store/compliance.md`.
   - Upload the `.aab` to a testing track first, then to Production.

Command-line alternative:

```bash
cd android
./gradlew bundleRelease
```

This produces an unsigned `app/build/outputs/bundle/release/app-release.aab`. Sign it with your keystore, or configure `signingConfigs` in `app/build.gradle`.

## 4. iOS → App Store

Requirements: a Mac with Xcode 16 or later, and an Apple Developer Program membership.

1. Open the project with `npm run ios` (or open `ios/App/App.xcodeproj` in Xcode). Swift packages resolve automatically; no CocoaPods are needed.
2. Set up signing: target **App** → **Signing & Capabilities** → choose your Team, then set the Bundle Identifier.
3. Test it on a simulator or an iPhone or iPad.
4. Upload the build:
   - Choose **Product → Archive**.
   - Click **Distribute App → App Store Connect → Upload**.
5. Submit for review in App Store Connect:
   - Create the app with the same bundle ID.
   - Fill in the listing from `store/listing.md`.
   - Add the screenshots from `store/screenshots/iphone-6.9` and `store/screenshots/ipad-13`.
   - Set App Privacy to *Data Not Collected*.
   - Turn on the Kids category and answer the age rating questions using `store/compliance.md`.
   - Paste the review notes from `store/compliance.md`.
   - Select the build and submit for review.

## 5. Regenerating art and screenshots

```bash
node scripts/render-art.cjs     # assets/*.png and store/feature-graphic.png
npm run assets                  # all icon and splash sizes for iOS and Android from assets/
node scripts/screenshots.cjs    # store/screenshots/* (needs Playwright + Chromium)
python3 scripts/check-listing.py   # checks listing text against store character limits
```

## Accounts and costs

- **Apple Developer Program:** US$99 per year.
- **Google Play developer account:** a one-time US$25 fee.
  New personal Play accounts must run a closed test with at least 12 testers for 14 days before they can publish to Production.

## Licences of bundled content

- **Fonts:** Baloo Bhaijaan 2 and Tajawal, under the SIL Open Font License 1.1 (see `www/fonts/OFL-*.txt`).
- **Goat bleat:** "Single Goat Bleating 2x" by Kinoton, CC0 1.0 (freesound.org/s/581240).
- **Sheep icon and art:** drawn for this project in `scripts/render-art.cjs`.
