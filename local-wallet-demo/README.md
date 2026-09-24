# Local wallet-security demo

This bot runs on **your computer only**. It is not part of `verifiedjup.ag` and visitors do not install it.

The live site stays public and connects MetaMask normally. This local watcher only presses **Cancel** on one matching review in your dedicated Chrome profile.

## Architecture

```
https://www.verifiedjup.ag
  → MetaMask browser extension
  → local Chrome watcher on this computer
  → exact demo request check
  → Cancel only
```

The website never clicks MetaMask. The bot never clicks **Confirm**, **Approve**, **Send**, **Sign**, or **Submit**.

## One-time setup

1. Quit every Chrome window with **Command+Q**.
2. Start the dedicated demo Chrome:

```bash
chmod +x local-wallet-demo/launch-chrome.sh
./local-wallet-demo/launch-chrome.sh
```

3. In that Chrome window, install MetaMask and import **your test wallet only**.
4. Keep that window on port `9222`. Do not use your everyday Chrome profile.

## Run the bot

```bash
npm run bot:wallet-demo
```

Open [http://127.0.0.1:3940](http://127.0.0.1:3940).

Use:

- **START BOT**
- **STOP BOT**
- **EMERGENCY STOP**

## Test on the live site

1. In the demo Chrome, open:

`https://www.verifiedjup.ag/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v?connect=metamask`

2. Connect MetaMask.
3. When MetaMask shows **Transaction request** with **Estimated changes**, **Account**, **Recipient**, **Solana Mainnet**, and **0.000005 SOL**, the bot clicks **Cancel**.
4. The dashboard should show `Request: CANCELLED` and `Last action: Cancel pressed`.
5. The log file is `bot-output/sol-review-reject.json`.

If any of those fields is missing or different, the bot does nothing.

## Safety

This is an authorized demo on your own computer and test wallet. It does not extract secrets, approve transfers, or run on visitors' machines.
