<div align="center">

<img src="assets/logo.png" alt="Arc Agent Kit" width="96">

# Arc Agent Kit

**All-in-one MCP toolkit for the [Arc](https://arc.exploreme.pro) blockchain, in TypeScript.**

Wallet operations · local-only signing · transfers · contract deploy & verification · staking (delegate / undelegate) · full chain exploration — from **Claude Code**, **Cursor**, **Codex**, or directly via the **Vercel AI SDK**.

Built for **humans**. Perfect for **AI**.

[![MCP](https://img.shields.io/badge/MCP-server-6E56CF)](https://modelcontextprotocol.io)
[![Arc](https://img.shields.io/badge/Arc-mainnet_5042-0a3ab5)](https://arc.exploreme.pro)
[![Node](https://img.shields.io/badge/Node-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![viem](https://img.shields.io/badge/built_with-viem-FFC517)](https://viem.sh)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)

</div>

---

## Why Arc Agent Kit

**Your private key never leaves your machine.** MCP only prepares *unsigned* transactions — signing happens locally, and the key is never sent to the AI model or a remote server.

**Two protection levels.**
- **Simple** — a guard hook blocks the agent from reading `.env`.
- **Secure** — encrypted keystore + a signing daemon in a separate, isolated process; the agent only ever receives the signed hex.

**Two ways to use.**
- **Subscription** (free) — connect MCP to Claude Code / Cursor / Codex and use your existing subscription.
- **AI SDK** (developers) — programmatic agents via the Vercel AI SDK with Claude or OpenAI.

**Arc-native.** Beyond plain EVM transfers: delegate USDC to validators (`prepare_delegate`), undelegate, deploy and verify Solidity contracts on-chain, and explore the full chain (blocks, txs, accounts, contracts, tokens, validators).

> ⚠️ **Mainnet — real funds.** The default network is **Arc mainnet (chain ID 5042, native USDC)**. `/send`, `/deploy`, and any `prepare_delegate`/`prepare_undelegate` call move **real USDC**. There is **no faucet on mainnet** — fund your address from an exchange/bridge. Prefer **secure mode with manual approval** (`npm run signer -- --manual`) so every signature needs your `y/n`.

---

## Architecture

```
┌────────────────────────────┐
│  You (chat or code)        │
├────────────────────────────┤
│  AI Agent                  │
│  (Claude / GPT / local)    │
│                            │
│  Sees: wallet address,     │
│        MCP tool results    │
│  Never sees: private key   │
├──────────┬─────────────────┤
│ sign-tx  │  MCP Server     │
│ (local)  │  (remote)       │
│          │                 │
│ Signs tx │  prepare_*      │
│ locally  │  broadcast      │
│          │  query chain    │
│ Key in   │  verify         │
│ .env or  │  explorer       │
│ keystore │  staking        │
└──────────┴─────────────────┘
```

**Key principle:** the private key NEVER leaves your machine. MCP prepares the unsigned tx → you sign locally → the signed hex is broadcast back through MCP.

---

## Requirements

- **Node.js 20+** and **npm** — required
- **GNU Make** — included on macOS/Linux by default
- **Docker + Docker Compose** — optional, only if you want supply-chain isolated installs (recommended for production)

The kit ships with two execution modes:
- **`native`** (default) — runs `npm install` and scripts directly on the host. Fastest, simplest.
- **`docker`** — installs and runs everything inside Docker containers. Install scripts can't touch the host. Recommended if you don't fully trust npm dependencies.

---

## Quick Start — Claude Code

```bash
git clone https://github.com/stakeme-team/arc-agent-kit
cd arc-agent-kit

make install   # install dependencies
make wallet    # create wallet
claude         # open Claude Code
```

Run `make help` to see all shortcuts.

Claude Code auto-detects `.mcp.json` and connects to Arc. Use the built-in skills:

| Skill | What it does |
|---|---|
| `/wallet` | Show wallet address and balance |
| `/send` | Send tokens to a random address from a recent transaction |
| `/deploy` | Deploy and verify a smart contract |

> **Real funds.** Arc mainnet USDC has real value. `/send` picks a random recipient from a recent transaction — only use it with an amount you're fine losing.

Or just chat:

> *"Send 0.001 USDC to a random address from a recent transaction"*

> See also: [Cursor setup](docs/cursor-setup.md) · [Codex setup](docs/codex-setup.md)

---

## Quick Start — AI SDK

```bash
git clone https://github.com/stakeme-team/arc-agent-kit
cd arc-agent-kit
make install

cp .env.example .env
make wallet
# Edit .env: add ANTHROPIC_API_KEY or OPENAI_API_KEY

make send       # send tokens to random address
make deploy     # deploy & verify contract
```

Switch between Claude and OpenAI:
```env
AI_PROVIDER=anthropic   # or openai
```

---

## Run in Docker

Both quick starts above default to running on the host. To run everything inside Docker (isolating npm install and the signer from your host), pin Docker mode once:

```bash
make use-docker     # writes MODE := docker to Makefile.local
make install        # now runs inside Docker
make wallet
```

Switch back with `make use-native`. You can also override per-command without pinning: `MODE=docker make install`.

---

## Security

### Simple Mode (default)

Private key in `.env`, protected by guard hooks that block the agent from reading it.

```bash
npx tsx scripts/wallet-manager.ts generate --simple
```

Guard blocks 20 attack vectors (27 checks total, tested):
```bash
npm run security-test
# ✓ cat .env           → BLOCKED
# ✓ grep PRIVATE .env  → BLOCKED
# ✓ echo $PRIVATE_KEY  → BLOCKED
# ✓ python3 read .env  → BLOCKED
# ... 27/27 passed ✓
```

### Secure Mode (signing daemon)

Private key encrypted in keystore, decrypted only in a separate daemon process. The agent physically cannot access the key.

```bash
# Create encrypted wallet
npx tsx scripts/wallet-manager.ts generate --secure

# Start daemon (separate terminal)
npx tsx scripts/signer-daemon.ts
# Unlock password: ********
# ✓ Signer ready: 0x742d...
# ✓ Socket: /tmp/arc-signer.sock
```

```
┌───────────────────┐     ┌───────────────────┐
│  Agent            │     │  Signer Daemon     │
│  (no key access)  │────▶│  (key in memory)   │
│                   │unix │                    │
│  Gets: signed hex │◀────│  Signs tx          │
└───────────────────┘sock └───────────────────┘
```

<details>
<summary><b>Approval modes (auto / manual)</b></summary>

**Auto mode** (default) — signs transactions immediately:
```bash
npx tsx scripts/signer-daemon.ts
```

**Manual mode** — requires human approval for each transaction:
```bash
npx tsx scripts/signer-daemon.ts --manual
```

In manual mode, every signing request shows transaction details and waits for your approval:

```
  ⚠  Sign transaction?
     Type:    TRANSFER
     To:      0x5f98ce551fFbd3C5C6bA571e0F793F8ADE228F96
     Value:   0.01 (10000000000000000 wei)
     Gas:     25200

     Approve? [y/n]: y
     ✓ Signed: to=0x5f98ce... value=10000000000000000
```

If you reject (`n`), the agent receives an error and can inform you that the transaction was declined.

</details>

<details>
<summary><b>Password file (for Docker detached)</b></summary>

To run the daemon without interactive password input:

```bash
echo "your_password" > .keystore/.password
chmod 600 .keystore/.password

docker compose up -d signer
docker compose logs signer
```

</details>

<details>
<summary><b>Docker isolation</b></summary>

Protect against supply chain attacks in npm packages:

```bash
# Install deps in container (node_modules isolated)
docker compose run --rm install

# Run demos in container
docker compose run --rm dev npx tsx examples/01-send-tokens.ts

# Signer daemon with NO network access
docker compose up signer
```

</details>

---

## MCP Tools

The Arc MCP server at `https://api.arc.exploreme.pro/mcp` exposes 88 tools; the categories this kit's flows use:

| Category | Tools |
|---|---|
| **Transactions** (write) | `prepare_native_transfer`, `prepare_erc20_transfer`, `prepare_transaction`, `broadcast_signed_raw_transaction`, `wait_for_transaction` |
| **Staking** (write) | `prepare_delegate`, `prepare_undelegate` |
| **Staking** (read) | `list_validators`, `get_validator`, `validator_apr`, `validator_delegations`, `account_delegations` |
| **Balances / accounts** | `rpc_native_balance`, `rpc_token_balance`, `balance_at_block`, `get_account` |
| **Blocks / txs** | `list_blocks`, `get_block`, `list_block_transactions`, `list_transactions`, `get_transaction` |
| **Contracts** | `rpc_read_contract`, `verify_contract_std_json`, `verify_contract_multi_part`, `verifier_compiler_versions`, `get_contract` |
| **Tokens** | `list_tokens`, `get_token`, `list_token_holders`, `list_account_tokens` |
| **Explorer / search** | `search`, `list_top_accounts`, `list_top_contracts` |

> There is no faucet on Arc mainnet — `claim_faucet_tokens` still exists but returns a no-op explainer for mainnet addresses. Some tool descriptions returned by the server say "0G" or reference `ZEROG_FAUCET_URL` — leftover text from a shared MCP implementation; the underlying chain data is genuinely Arc/USDC (verified against `chain_network` and the mainnet RPC directly).

---

## Project Structure

```
arc-agent-kit/
├── CLAUDE.md                    # Agent instructions for Arc
├── .mcp.json                    # Claude Code MCP config
├── .cursor/mcp.json             # Cursor MCP config
├── .codex/config.toml           # Codex MCP config (via mcp-remote)
│
├── .claude/
│   ├── settings.json            # Guard hook config
│   └── skills/
│       ├── wallet/SKILL.md      # /wallet skill
│       ├── send/SKILL.md        # /send skill
│       └── deploy/SKILL.md      # /deploy skill
│
├── scripts/
│   ├── wallet-manager.ts        # Create/import wallet
│   ├── sign-tx.ts               # Sign tx (stdin → stdout)
│   ├── signer-daemon.ts         # Signing daemon (secure mode)
│   ├── guard.sh                 # Block agent from reading keys
│   └── security-test.ts         # Test guard (20 attack vectors, 27 checks)
│
├── src/                         # AI SDK core library
│   ├── mcp-client.ts            # MCP client factory
│   ├── wallet.ts                # Wallet (address only for LLM)
│   ├── signing-bridge.ts        # Auto-sign prepare_* results
│   ├── agent.ts                 # Agent factory (Claude + OpenAI)
│   └── utils.ts                 # Helpers
│
├── examples/                    # AI SDK demos
│   ├── 01-send-tokens.ts
│   └── 02-deploy-and-verify.ts
│
├── contracts/
│   ├── SimpleStorage.sol
│   └── compiled/SimpleStorage.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── claude-code-setup.md
│   ├── cursor-setup.md
│   ├── codex-setup.md
│   └── prompts.md               # Ready-to-use prompts
│
├── Dockerfile
└── docker-compose.yml
```

---

## License

MIT
