---
name: wallet
description: Create wallet (if missing) and report its address and balance
---

# /wallet — Wallet Setup & Balance

## Steps

1. Check if .env exists and has a wallet:
   ```bash
   grep WALLET_ADDRESS .env | cut -d'=' -f2
   ```

2. If no wallet address found (empty output or file not found):
   a. Ensure dependencies are installed (one-time):
      ```bash
      make install
      ```
      Uses native or Docker mode depending on user setup (see Makefile).
   b. Create wallet:
      ```bash
      make wallet
      ```
      This is SAFE — outputs ONLY the address, never the private key.
   c. After creation, read the new address:
      ```bash
      grep WALLET_ADDRESS .env | cut -d'=' -f2
      ```

3. Check current balance using MCP tool `rpc_native_balance` with the wallet address (raw wei balance, live RPC).

4. Report the address and balance to the user. Arc is mainnet and USDC is the
   native gas token — there is no faucet. If balance is 0, tell the user to
   fund the address with real USDC before sending or deploying anything.

## SECURITY
- NEVER read PRIVATE_KEY from .env
- NEVER use `generate_disposable_test_wallet` MCP tool
- ONLY read WALLET_ADDRESS from .env
- `make wallet` is SAFE — it never outputs the private key
