# Arc Agent Kit

You are working with the **Arc blockchain** (chain ID **5042**, native **USDC**, 18 decimals) through an MCP server. This file tells you how to interact with it safely and effectively.

> ⚠️ **MAINNET — REAL FUNDS.** The default network is Arc mainnet. `prepare_native_transfer` / `prepare_erc20_transfer` / `prepare_transaction` / `prepare_delegate` move **real USDC**. Prefer **secure mode with manual approval** (`npm run signer -- --manual`) so every signature needs your `y/n`. There is **no faucet on mainnet** — fund the address from an exchange/bridge, not from this kit.

> 🟦 **This kit does not hold or expose your key to the server.** The MCP server is **read + prepare/broadcast only** — it never signs. Signing happens locally with your private key (viem). Do NOT use `generate_disposable_test_wallet` — it exposes private keys.

> **For architecture details:** See `docs/ARCHITECTURE.md`.

## MCP Server

The Arc MCP server is connected automatically via `.mcp.json` (`https://api.arc.exploreme.pro/mcp`). It exposes ~88 tools; the ones this kit's flows use:
- **Transactions (write):** `prepare_native_transfer`, `prepare_erc20_transfer`, `prepare_transaction`, `broadcast_signed_raw_transaction`, `wait_for_transaction`
- **Staking (write):** `prepare_delegate`, `prepare_undelegate`
- **Staking (read):** `list_validators`, `get_validator`, `validator_apr`, `account_delegations`
- **Balances / accounts (read):** `rpc_native_balance`, `rpc_token_balance`, `get_account` (full profile: balance, tx_count, tokens held)
- **Blocks / txs (read):** `list_blocks`, `get_block`, `list_transactions`
- **Contracts:** `rpc_read_contract`, `verify_contract_std_json`, `verify_contract_multi_part`, `verifier_compiler_versions`, `get_contract`, `get_verification_status`
- **Tokens (read):** `list_tokens`, `get_token`
- **Explorer / search:** `search`, `list_top_accounts`

> 💡 Some tool descriptions returned by this MCP server still say "0G" / reference `ZEROG_FAUCET_URL` (leftover boilerplate from a shared server implementation) — ignore that text. The actual chain data is Arc/USDC; verified independently against `chain_network` and the mainnet RPC.

## SECURITY RULES — MANDATORY

### NEVER do any of the following:
- Read `.env` file (cat, head, tail, less, grep, or any other method)
- Read `.keystore/` directory or any files in it
- Access, print, or log the `PRIVATE_KEY` environment variable
- Run `env`, `printenv`, `set`, or `export` to list environment variables
- Use `generate_disposable_test_wallet` MCP tool (it exposes private keys)
- Store, display, or transmit any private key in any form

### Wallet address
Read `WALLET_ADDRESS` from `.env` using grep:
```bash
grep WALLET_ADDRESS .env | cut -d'=' -f2
```
This is the ONLY value you should read from `.env`.

## Transaction Signing Flow

You CANNOT sign transactions directly. Use the signing script:

### Step 1: Prepare transaction via MCP
Call `prepare_native_transfer` or `prepare_transaction` to get unsigned tx JSON.

### Step 2: Sign via sign-tx.ts
```bash
echo '<unsigned_tx_json>' | npx tsx scripts/sign-tx.ts
```
This reads the private key internally and returns ONLY the signed hex.

### Step 3: Broadcast via MCP
Call `broadcast_signed_raw_transaction` with **`serializedTransaction`** = signed hex (the argument name must be exactly `serializedTransaction`, NOT `signedTransaction`).

### Step 4: Wait for confirmation
Call `wait_for_transaction` with the tx hash.

## Field name reference — `prepare_*` tools

Different prepare tools use different field names for the amount/value. Picking the wrong one returns a validation error. Use exactly:

| Tool | Required fields | Value field | Format | Example |
|---|---|---|---|---|
| `prepare_native_transfer` | `from`, `to`, `amount` | `amount` | decimal (parseEther-style, e.g. USDC amount) | `"0.001"` |
| `prepare_erc20_transfer` | `from`, `token`, `to`, `amount` | `amount` | human decimal using token decimals (`decimals`, default 18) | `"1.5"` |
| `prepare_transaction` | `from` only (`to`/`value`/`data`/`gas` optional) | `value` | decimal or `0x`-hex wei; omit `to` for contract creation | `"1000000000000000"` |
| `prepare_delegate` | `from`, `validator`, `amount` | `amount` | decimal stake amount | `"10"` |
| `prepare_undelegate` | `from`, `validator`, `shares` | `shares` | decimal share amount (uint) | `"10"` |

For `broadcast_signed_raw_transaction` the input argument is **`serializedTransaction`** (full signed `0x…` hex). The signing-bridge in `src/signing-bridge.ts` already returns that field with the same name — pass it through verbatim.

`wait_for_transaction(hash)` already returns the full receipt (including `contractAddress` for deployments) — there is no separate receipt-lookup tool, don't look for one.

## Contract Deployment Flow

1. Read bytecode from `contracts/compiled/SimpleStorage.json`
2. Call `prepare_transaction` with `from` = wallet address, no `to` field, `data` = bytecode
3. Sign: `echo '<unsigned_tx>' | npx tsx scripts/sign-tx.ts`
4. Broadcast signed tx
5. `wait_for_transaction` — its result's `contractAddress` field is the deployed address
6. Verify using `verify_contract_std_json`

## Contract Verification Flow

1. Call `verifier_compiler_versions` to find the correct Solidity version
2. Read source from `contracts/SimpleStorage.sol`
3. Call `verify_contract_std_json` with:
   - `address`: deployed contract address
   - `body`: a passthrough object forwarded as-is to the verifier — include `compiler_version` (from step 1), `contract_name`, and `input` (the standard-JSON compiler input containing the source)

## Wallet Setup

If `grep WALLET_ADDRESS .env` returns empty or .env doesn't exist, create a wallet:
```bash
npx tsx scripts/wallet-manager.ts generate --simple
```
This is SAFE to run — it outputs ONLY the wallet address. The private key is saved to `.env` internally but NEVER printed to stdout.

The new wallet has a 0 balance. Since Arc is mainnet, tell the user the address and ask them to fund it with real USDC — do not attempt to source funds yourself.

After creating, read the address:
```bash
grep WALLET_ADDRESS .env | cut -d'=' -f2
```

## Available Scripts

- `npx tsx scripts/sign-tx.ts` — Sign transaction (stdin JSON → stdout signed hex)
- `npx tsx scripts/wallet-manager.ts generate --simple` — Create wallet (safe — only outputs address)
- `npx tsx scripts/signer-daemon.ts` — Signing daemon (DO NOT run this — user runs it manually)
