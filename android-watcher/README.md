# Cancel Watcher

Phone-only demo app. After install it watches MetaMask on this test device and taps **Cancel** on one matching review. It never taps **Confirm**.

`verifiedjup.ag` only opens the wallet request. This app is what presses Cancel on the phone.

## Install once

1. Open `android-watcher` in Android Studio.
2. Connect the dedicated test phone with USB for this install only.
3. Enable USB debugging and tap **Allow** on the phone.
4. Run the app onto the phone (`Run` → `app`).
5. On the phone open **Cancel Watcher**.
6. Tap **Open accessibility settings**.
7. Turn on **Cancel Watcher**.
8. Go back to the app and tap **START AUTOMATION**.
9. Unplug the USB cable.

You do not need `adb devices` or `npm run bot:android-demo` after that.

## Use on the live site

1. Keep the phone on the internet.
2. Open `https://www.verifiedjup.ag` in MetaMask or the phone browser.
3. Connect the dedicated test wallet.
4. When MetaMask shows **Transaction request** with **Estimated changes**, **Account**, **Recipient**, **Solana Mainnet**, and **0.000005 SOL**, this app taps **Cancel**.
5. The app returns to **WAITING_FOR_REQUEST**.

## Stop

Tap **STOP AUTOMATION**. The service stops touching MetaMask immediately.

After a phone reboot, the watcher starts again if it was left running.
