# Store questionnaires: suggested answers

These answers match how the app is built today: offline, no network permission on Android, no analytics, no ads, no purchases, and all data kept on the device. If you add any of those later, revisit every answer below.

## Apple App Store

### App Privacy ("nutrition label")
- **Data collection:** *No, we do not collect data from this app.*
  Apple counts data as "collected" only when it leaves the device. The parent's name and phone number, the children's names and their progress stay in the app's storage on the device.

### Kids category
- **List in Kids category:** Yes, age band **6–8** (or 9–11).
- **Kids-category rules this build already meets:**
  - No third-party analytics or advertising.
  - No external links.
  - No purchases.
  - The parent page sits behind a **parental gate**: the parent types the last 4 digits of their phone number. The device remembers it after the first time; the parent can lock it again from the parent page.
  - Nothing else in the app leaves it, so no other gate is needed.

### Age rating questionnaire
- Answer **None** for every content category (violence, horror, gambling, and so on).
- Answer **No** to unrestricted web access, user-generated content, chat, and location.
- The result is **4+**.

### Export compliance
- `ITSAppUsesNonExemptEncryption` is set to **false** in `ios/App/App/Info.plist`, so App Store Connect will not ask about encryption at upload.

### Review notes (paste into "Notes for Review")
> The app is fully offline. On first launch, enter any parent name, an 8–15 digit phone number and a child name. The parent page is behind a parental gate: enter the last 4 digits of the phone number you typed at sign-up. No data leaves the device.

## Google Play

### Data safety form
- **Does your app collect or share any of the required user data types?** **No.**
  Google counts data as collected only when it is sent off the device. This build has no `INTERNET` permission, so it cannot send anything.
- **Is all of the user data collected by your app encrypted in transit?** Not applicable, because nothing is transmitted.
- **Do you provide a way for users to request that their data is deleted?** Yes. Data can be deleted in the app (parent page → delete a child, or delete the account) or by uninstalling.

### Target audience and content (Families)
- **Target age groups:** 6–8 and 9–12. This places the app in the **Designed for Families** programme.
- **Appeals to children:** Yes.
- **Ads:** No ads.
- **Families policy points this build meets:**
  - No ads or ad SDKs.
  - No location.
  - No identifiers sent anywhere.
  - A privacy policy is provided.

### Content rating (IARC questionnaire)
- **Category:** "Education" / "Reference".
- Answer **No** to violence, sexuality, language, controlled substances, gambling, user interaction, data sharing, location sharing, and digital purchases.
- The expected result is **Everyone / PEGI 3**.

### App access
- All functionality is available without special access. Mention the parental gate (last 4 digits of the phone typed at sign-up) in the "App access" notes.

## Assets in this folder

| Asset | Size | Store |
| --- | --- | --- |
| `screenshots/iphone-6.9/1–6.png` | 1320 × 2868 | App Store, iPhone 6.9" (required) |
| `screenshots/ipad-13/1–6.png` | 2064 × 2752 | App Store, iPad 13" (required because the app runs on iPad) |
| `screenshots/android-phone/1–6.png` | 1080 × 1920 | Google Play, phone |
| `screenshots/android-tablet/1–6.png` | 1600 × 2560 | Google Play, 10" tablet |
| `screenshots/*/raw-1–6.png` | same sizes | the same screens without captions |
| `feature-graphic.png` | 1024 × 500 | Google Play feature graphic (required) |
| `../assets/icon-only.png` | 1024 × 1024, no transparency | App Store icon / Play high-res icon (scale to 512 × 512 for Play) |
| `privacy-policy.html` | n/a | host it at a public URL and enter that URL in both stores |
