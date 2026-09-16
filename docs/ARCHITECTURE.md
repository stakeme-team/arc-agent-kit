# Arc Agent Kit — Architecture

MCP toolkit for **Arc mainnet** (chain ID `5042`, native USDC, 18 decimals). No faucet.

1. **Subscription** — Claude Code / Cursor / Codex via `.mcp.json`
2. **AI SDK** — programmatic agents

## MCP

| Server | URL |
|---|---|
| Explorer | `https://api.arc.exploreme.pro/mcp` (18 tools, unsigned prepare only) |
| Docs | `https://docs.arc.io/mcp` (read-only) |

Override explorer URL with `ARC_MCP_URL`. RPC for nonce/gas/broadcast: `ARC_RPC_URL` (default `https://arc-rpc.stakeme.pro`).

Claude Code: `.mcp.json` with `"type": "http"`. Cursor: `.cursor/mcp.json`. Codex: `.codex/config.toml` + `mcp-remote`.

## Signing

Explorer MCP never signs. `prepare_native_transfer` returns `{ to, value, data, chain_id, signed: false }`.

1. Fill nonce/gas (`src/rpc.ts` / public RPC)
2. Sign (`sign-tx.ts` or signing daemon)
3. Broadcast (`scripts/broadcast-tx.ts` or AI SDK `broadcast_signed_raw`)

## Security

- Simple: key in `.env`, `guard.sh` blocks reads
- Secure: keystore + signer daemon, `--manual` for y/n
- Agent may only `grep WALLET_ADDRESS .env`

## Live vs stale names

Do not document 88 tools. Do not call `rpc_native_balance`, `list_transactions`, `broadcast_signed_raw_transaction`, `wait_for_transaction`, `prepare_transaction`.
