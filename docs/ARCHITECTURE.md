# Arc Agent Kit — Architecture

## Overview

MCP-based toolkit for the Arc blockchain. Two usage modes:

1. **Subscription** — Claude Code / Cursor / Codex via `.mcp.json` (main flow)
2. **AI SDK** — programmatic agents (Vercel AI SDK + Claude/OpenAI)

MCP server: `https://api.arc.exploreme.pro/mcp` (HTTP transport).

**Target network: Arc testnet** (chain ID `5042002`). Native gas token is **USDC** (denom `ausdc`). The agent can fund the wallet via `claim_faucet_tokens`.

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
- `.claude/skills/wallet.md` — `/wallet` command (address + balance, can claim from faucet)
- `.claude/skills/send.md` — `/send` command
- `.claude/skills/deploy.md` — `/deploy` command
- `.claude/settings.json` — `guard.sh` hook config

## Chain-specific notes

- MCP URL: `api.arc.exploreme.pro/mcp`
- Native token: `USDC` (denom: `ausdc`)
- Chain ID: `5042002`
- Env var for MCP override: `ARC_MCP_URL`
- **Faucet available on Arc testnet** — `claim_faucet_tokens` and `get_faucet_payout_status` are exposed; the `/wallet` skill can claim test USDC if balance is 0. Demos numbered 01 (send) and 02 (deploy).

## References

- Arc MCP: `https://api.arc.exploreme.pro/mcp`
- Arc explorer: `https://arc.exploreme.pro`
