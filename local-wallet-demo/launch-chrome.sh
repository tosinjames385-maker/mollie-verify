#!/bin/zsh
set -euo pipefail
PROFILE="${HOME}/chrome-wallet-demo-profile"
SITE="https://www.verifiedjup.ag/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v?connect=metamask"
mkdir -p "$PROFILE"
open -na "Google Chrome" --args \
  --remote-debugging-port=9222 \
  --user-data-dir="$PROFILE" \
  "$SITE"
echo "Opened the dedicated Chrome demo profile on port 9222."
echo "Install MetaMask in this window if it is not already there."
