# Babybeast

A pregnancy tracker that shows how big your baby is each week, compared to gross bugs and animals.
Built with Expo (React Native), so the same code ships to both the App Store and Google Play.

## Run it on your phone

1. Install Node.js (version 20 or newer).
2. In this folder:
   ```
   npm install
   npx expo install --fix
   npx expo start
   ```
   `expo install --fix` lines the package versions up with the latest Expo SDK if needed.
3. Get **Expo Go** on your iPhone and scan the QR code.

## Publish to the App Store

No Mac needed. Expo builds in the cloud.

1. Join the **Apple Developer Program** at developer.apple.com (USD 99 a year).
   Enroll as an organization if a company should be listed as the seller (needs a D-U-N-S number).
2. Create a free account at **expo.dev**, then run:
   ```
   npm install -g eas-cli
   eas login
   eas build:configure
   ```
3. Change `bundleIdentifier` in `app.json` if you want something other than `com.babybeast.app`.
   It has to be unique and can't be changed after the first submission.
4. Build and submit:
   ```
   eas build --platform ios --profile production
   eas submit --platform ios
   ```
   EAS creates the certificates and sets the app up in App Store Connect for you.
5. In **App Store Connect**, add the store listing, screenshots (6.9" iPhone), age rating,
   the privacy form ("Data Not Collected") and a link to a privacy policy. Then submit for review.
   It usually takes 1 to 3 days.

## What Apple looks for in health apps

- A clear note that the content isn't medical advice (shown on the setup and home screens).
- No collection of health data without consent. The due date and photos stay on the device.
- Camera and photo library prompts explain why they're needed (set in `app.json`).
- More than one screen of static content. Consider adding features before submitting (see below).

## Features

- **Countdown:** each beast unlocks at midnight when a new week starts. Future beasts stay locked.
- **Alerts:** a local notification at 8 am the day a beast unlocks. Discreet text, no "baby" or week number.
- **Beastiary:** a collection grid of every beast, with locked ones shown as "?" and their unlock date.
- **Bump diary:** one photo per week, copied into the app's own storage (not uploaded anywhere).
- **Share card:** a 9:16 story image of the week's beast, optionally with the bump photo, plus a
  secret mode that leaves out "baby" and the week number.
- **Family and friends:** invite anyone with a code like BEAST-22QM (or the link
  babybeast://join/BEAST-22QM?as=grandparent). The code holds only the due date. Each person picks
  their relation, and the app names the beast for them: grandparents follow "your grandbeast",
  aunts and uncles "your nibling beast", godparents "your godbeast", friends "your friend's beast".
  Bump photos and the diary stay with the parent-to-be. No server needed.

## Ideas for the next version

- Real illustrations instead of emoji
- A "from louse egg to armadillo" collage of all bump photos at the end
- Weekly baby development info (reviewed by a midwife)

## Files

- `App.tsx`: loading, saving and partner links
- `src/screens/`: Setup, Home, Beastiary, Diary, ShareCard, Settings
- `src/pregnancy.ts`: week, days left, unlock dates and unit calculations
- `src/notifications.ts`: scheduling the weekly alerts
- `src/partner.ts`: invite codes and links
- `src/relations.ts`: relations and the beast name for each one
- `src/photos.ts` and `src/storage.ts`: bump photos and saved settings
- `src/theme.ts`: colours and shared styles
- `data/weeks.json`: weeks 4 to 40 with size, weight, animal and gross fact
- `assets/`: icon and splash
