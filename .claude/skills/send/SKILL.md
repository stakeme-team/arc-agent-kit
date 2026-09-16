---
name: send
description: Send native USDC to a recent block miner (mainnet, real funds)
---

# /send — Send Tokens

**MAINNET. REAL USDC.** Confirm the amount with the user. Prefer 0.001 USDC or less.

Live explorer MCP **does not broadcast**. It only returns an unsigned skeleton.

## Steps

1. Address:
   ```bash
   grep WALLET_ADDRESS .env | cut -d'=' -f2
   ```

2. Balance: MCP `get_account`. If insufficient, stop.

3. Recipient: MCP `list_blocks` with `limit: 1`, then `get_block` with that height/hash. Use the block `miner` (do **not** call `list_transactions`).

4. Prepare: MCP `prepare_native_transfer` with:
   - `to`: miner address
   - `value`: base-10 **wei** string, not a decimal amount  
     0.001 USDC (18 decimals) = `"1000000000000000"`  
   Do **not** send `from` or `amount` — the live schema rejects them.

5. Sign (Claude Code / Cursor):
   ```bash
   echo '<unsigned_tx_json>' | make sign
   ```
   AI SDK path: the signing bridge fills nonce/gas and returns `serializedTransaction`.

6. Broadcast **locally** (not MCP):
   - AI SDK: `broadcast_signed_raw` with `serializedTransaction`
   - CLI: `echo 0x… | npx tsx scripts/broadcast-tx.ts`

7. Confirm: MCP `get_transaction` with the hash. There is no `wait_for_transaction` tool.

## SECURITY

- NEVER read PRIVATE_KEY
- NEVER paste keys into chat
- This spends real USDC
