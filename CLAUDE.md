# Arc Agent Kit

You are working with **Arc mainnet** (chain ID **5042**, native **USDC**, 18 decimals).

> **MAINNET — REAL FUNDS.** There is no faucet. `prepare_native_transfer` returns an **unsigned** skeleton. Signing and broadcasting happen **locally**. A signed broadcast spends real USDC. Prefer secure signer with manual approval (`npm run signer -- --manual`). Never paste a private key into chat.

> The explorer MCP **never signs and never broadcasts**. Official docs MCP (`https://docs.arc.io/mcp`) is read-only search.

## MCP servers

Configured in `.mcp.json`:

| Name | URL | Role |
|---|---|---|
| `arc-explorer` | `https://api.arc.exploreme.pro/mcp` | 18 live tools: reads + unsigned native transfer |
| `arc-docs` | `https://docs.arc.io/mcp` | Search / get page on docs.arc.io |

Do not invent tools. This list is the live catalog (verified 2026-09-16):

- `list_blocks`, `get_block`, `get_transaction`, `gas_oracle`, `stats_overview`, `indexer_info`, `search`
- `get_account`, `account_delegations`, `list_validators`, `get_validator`, `list_tokens`
- `get_evm_compiler_versions`, `verify_evm_contract_standard_json`, `verify_evm_contract_multi_part`, `get_evm_contract_abi`
- `prepare_staking_tx`, `prepare_native_transfer`

**Missing on this server** (do not call): `rpc_native_balance`, `list_transactions`, `broadcast_signed_raw_transaction`, `wait_for_transaction`, `prepare_erc20_transfer`, `prepare_transaction`, `prepare_delegate`, `claim_faucet_tokens`.

`list_validators` schema text may still mention “0G”. Ignore that wording; the chain is Arc 5042.

## prepare_native_transfer

Required: `to` (address), `value` (base-10 **wei** string). Not `from`, not `amount`.

0.001 USDC = `"1000000000000000"`.

Result is `{ chain_id, to, value, data, signed: false }`. Fill nonce/gas via Arc RPC, sign with `scripts/sign-tx.ts`, broadcast with `scripts/broadcast-tx.ts` or the AI SDK `broadcast_signed_raw` helper.

## SECURITY — MANDATORY

Never:

- Read `.env` except `grep WALLET_ADDRESS .env | cut -d'=' -f2`
- Read `.keystore/`
- Print `PRIVATE_KEY` or dump `env`
- Use `generate_disposable_test_wallet`

## Wallet

If no address: `npx tsx scripts/wallet-manager.ts generate --simple` (prints address only). Tell the user to fund it with real USDC.
