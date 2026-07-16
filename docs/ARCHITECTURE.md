# Arc Agent Kit — Architecture

## Overview

MCP-based toolkit for the Arc blockchain. Two usage modes:

1. **Subscription** — Claude Code / Cursor / Codex via `.mcp.json` (main flow)
2. **AI SDK** — programmatic agents (Vercel AI SDK + Claude/OpenAI)

MCP server: `https://api.arc.exploreme.pro/mcp` (HTTP transport).

**Target network: Arc mainnet** (chain ID `5042`). Native gas token is **USDC** (denom `ausdc`). There is no faucet — the wallet must be funded with real USDC before it can send or deploy.

## Key Architecture Decisions

### Security: Two protection levels

1. **Simple mode** — key in `.env`, `guard.sh` hook blocks the agent from reading it
2. **Secure mode** — key encrypted in `.keystore/wallet.json`, signing daemon on a Unix socket

**The agent never sees the private key.** Signing happens via `sign-tx.ts` (stdin JSON → stdout signed hex).

### Wallet creation

The agent CAN safely run `npx tsx scripts/wallet-manager.ts generate --simple`:
- Script generates the key internally
- Saves to `.env`
- stdout shows ONLY the address (not the key)
- `guard.sh` does NOT block this command

### Signing daemon modes

- **Auto** (default) — signs immediately
- **Manual** (`--manual` flag) — shows full TX JSON, waits for y/n approval
- **Password file** — `.keystore/.password` for Docker detached mode

### Docker isolation

- `signer` container: `network_mode: none` (no network even if an npm package is malicious)
- `node_modules` in a Docker volume (not host)
- Source mounted, dependencies isolated

## MCP configs (per platform)

- Claude Code: `.mcp.json` with `"type": "http"` (NOT `"url"` — that's a common mistake)
- Cursor: `.cursor/mcp.json`
- Codex: `.codex/config.toml` with the `mcp-remote` bridge (Codex only supports STDIO)

## Files that matter

### Security-critical
- `scripts/guard.sh` — blocks attack vectors (allows `grep WALLET_ADDRESS .env`)
- `scripts/security-test.ts` — guard test suite
- `scripts/keystore-utils.ts` — encrypt/decrypt (Ethereum V3 format)
- `scripts/wallet-manager.ts` — generate/import (uses `keystore-utils`)
- `scripts/sign-tx.ts` — CLI signer (simple mode: `.env`; secure mode: via socket)
- `scripts/signer-daemon.ts` — Unix socket server, manual/auto modes

### Core (AI SDK)
- `src/mcp-client.ts` — `createMCPClient` wrapper
- `src/signing-bridge.ts` — intercepts `prepare_*` tool results, signs
- `src/agent.ts` — multi-provider (Claude/OpenAI)
- `src/wallet.ts` — address getter + signing interface

### Agent instructions
- `CLAUDE.md` — agent rules
- `.claude/skills/wallet.md` — `/wallet` command (address + balance)
- `.claude/skills/send.md` — `/send` command
- `.claude/skills/deploy.md` — `/deploy` command
- `.claude/settings.json` — `guard.sh` hook config

## Chain-specific notes

- MCP URL: `api.arc.exploreme.pro/mcp`
- Native token: `USDC` (denom: `ausdc`)
- Chain ID: `5042`
- Env var for MCP override: `ARC_MCP_URL`
- **No faucet on mainnet** — fund the wallet with real USDC before running the demos (numbered 01 send, 02 deploy). `claim_faucet_tokens` still exists on the server but returns a no-op explainer for mainnet addresses.
- The server exposes ~88 tools total; only a subset is used by this kit's flows (see `CLAUDE.md`). Tool names do **not** follow an `_evm_` naming convention — e.g. balance is `rpc_native_balance`/`get_account`, not `get_balance`; blocks are `list_blocks`/`get_block`, not `list_evm_blocks`.
- Some tool descriptions returned by the server say "0G" or reference `ZEROG_FAUCET_URL` — leftover text from a shared MCP server implementation, not an Arc-specific bug in this kit. The chain data itself is correctly Arc/USDC.

## References

- Arc MCP: `https://api.arc.exploreme.pro/mcp`
- Arc explorer: `https://arc.exploreme.pro`
