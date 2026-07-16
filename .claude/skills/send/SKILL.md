---
name: send
description: Send native tokens to a random address from a recent block
---

# /send — Send Tokens

## Steps

1. Get wallet address:
   ```bash
   grep WALLET_ADDRESS .env | cut -d'=' -f2
   ```

2. Check balance using MCP `rpc_native_balance`. If insufficient, suggest running `/wallet` first — Arc mainnet has no faucet, the user must fund the wallet with real USDC.

3. Find a recipient address:
   - Call MCP `list_transactions` with `limit: 5` to get recent transactions (each result has `from_addr`/`to_addr` directly — no need to fetch a block separately)
   - Pick a random `from_addr` or `to_addr` from the results

4. Prepare the transfer:
   - Call MCP `prepare_native_transfer` with:
     - `from`: wallet address
     - `to`: recipient address from step 3
     - `amount`: "0.001" (small amount — this is real USDC on mainnet)

5. Sign the transaction:
   ```bash
   echo '<unsigned_tx_json_from_step_4>' | make sign
   ```
   Capture the signed hex output. Works in both native and Docker modes.

6. Broadcast:
   - Call MCP `broadcast_signed_raw_transaction` with `serializedTransaction` = signed hex

7. Wait for confirmation and get the receipt in one call:
   - Call MCP `wait_for_transaction` with the tx hash — its result already includes the full receipt (no separate receipt-lookup tool exists)
   - Report: tx hash, from, to, amount, gas used, status

## SECURITY
- NEVER read PRIVATE_KEY — use sign-tx.ts for signing
- NEVER access .env except for WALLET_ADDRESS
- This moves real USDC. Confirm the amount with the user before broadcasting if it's more than a trivial test amount.
