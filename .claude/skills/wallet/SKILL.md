---
name: wallet
description: Create wallet (if missing) and report its address and balance
---

# /wallet — Wallet Setup & Balance

Arc is **mainnet**. Native gas is **real USDC**. There is no faucet.

## Steps

1. Check if .env has a wallet:
   ```bash
   grep WALLET_ADDRESS .env | cut -d'=' -f2
   ```

2. If empty:
   ```bash
   make install
   make wallet
   grep WALLET_ADDRESS .env | cut -d'=' -f2
   ```
   `make wallet` prints ONLY the address.

3. Balance: MCP `get_account` with `address` = wallet. Do **not** call `rpc_native_balance` — that tool does not exist on the live server.

4. Report address and balance. If zero, tell the user to fund with real USDC from an exchange or bridge before sending or deploying.

## SECURITY

- NEVER read PRIVATE_KEY
- NEVER use `generate_disposable_test_wallet`
- ONLY read WALLET_ADDRESS from .env
