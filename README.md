<table border="0" cellpadding="0" cellspacing="0">
<tr>
<td valign="top">

# Arc Agent Kit

Arc Agent Kit is an all-in-one MCP toolkit for the [Arc](https://arc.exploreme.pro) blockchain written in TypeScript. It combines wallet operations, local-only signing, contract deployment and verification, and block and token exploration — usable from Claude Code, Cursor, Codex, or directly via the Vercel AI SDK.

Built for **humans**. Perfect for **AI**.

</td>
<td valign="top" width="220" align="right">
<img src="assets/logo.png" alt="Arc Agent Kit" width="180">
</td>
</tr>
</table>

---

## Why Arc Agent Kit

**Your private key never leaves your machine.** MCP only prepares unsigned transactions — signing happens locally, the key is never sent to the AI model or remote server.

**Two protection levels.**
- **Simple** — a guard hook blocks the agent from reading `.env`.
- **Secure** — encrypted keystore + signing daemon in a separate isolated process; the agent only ever receives the signed hex.

**Two ways to use.**
- **Subscription** (free) — connect MCP to Claude Code / Cursor / Codex, use your existing subscription.
- **AI SDK** (developers) — programmatic agents via Vercel AI SDK with Claude or OpenAI.

**Test-friendly.** Arc is a testnet (chain ID `5042002`, native gas token **USDC**). The agent can claim test tokens from the built-in faucet via `claim_faucet_tokens`.

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
│          │  query blocks   │
│ Key in   │  verify         │
│ .env or  │  explorer       │
│ keystore │  faucet         │
└──────────┴─────────────────┘
```

## Requirements

- **Node.js 20+** and **npm** — required
- **GNU Make** — included on macOS/Linux by default
- **Docker + Docker Compose** — optional, only if you want supply-chain isolated installs (recommended for production)

The kit ships with two execution modes:
- **`native`** (default) — runs `npm install` and scripts directly on the host. Fastest, simplest.
- **`docker`** — installs and runs everything inside Docker containers. Install scripts can't touch the host. Recommended if you don't fully trust npm dependencies.

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
| `/wallet` | Show wallet address and balance; claim test USDC from the faucet if balance is 0 |
| `/send` | Send tokens to a random address from a recent block |
| `/deploy` | Deploy and verify a smart contract |

Or just chat: *"Send 0.001 USDC to a random address from the latest block"*

> See also: [Cursor setup](docs/cursor-setup.md) · [Codex setup](docs/codex-setup.md)

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

## Run in Docker

Both quick starts above default to running on the host. To run everything inside Docker (isolating npm install and the signer from your host), pin Docker mode once:

```bash
make use-docker     # writes MODE := docker to Makefile.local
make install        # now runs inside Docker
make wallet
```

Switch back with `make use-native`. You can also override per-command without pinning: `MODE=docker make install`.

## Security

### Simple Mode (default)

Private key in `.env`, protected by guard hooks that block the agent from reading it.

```bash
npx tsx scripts/wallet-manager.ts generate --simple
```

Guard blocks 26+ attack vectors (tested):
```bash
npm run security-test
# ✓ cat .env           → BLOCKED
# ✓ grep PRIVATE .env  → BLOCKED
# ✓ echo $PRIVATE_KEY  → BLOCKED
# ✓ python3 read .env  → BLOCKED
# ... 26/26 passed ✓
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
│   └── security-test.ts         # Test guard (26+ attack vectors)
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

<img width="1210" height="120" alt="arc banner-dark" src="https://github.com/user-attachments/assets/2a623236-4762-4c62-8fca-c66723b17b96" />

## MCP Tools

The Arc MCP server at `https://api.arc.exploreme.pro/mcp` exposes 79 tools across these categories:

| Category | Examples |
|---|---|
| Transactions | `prepare_native_transfer`, `prepare_erc20_transfer`, `prepare_transaction`, `broadcast_signed_raw_transaction`, `wait_for_transaction` |
| Balances | `get_balance`, `get_token_balance`, `get_erc1155_balance` |
| Blocks | `list_evm_blocks`, `get_evm_block_by_height`, `get_evm_block_rpc` |
| Contracts | `read_evm_contract`, `verify_evm_contract_standard_json`, `prepare_contract_write` |
| Tokens | `list_erc20_tokens`, `get_erc20_token_by_address`, `get_erc721_token_by_address` |
| Explorer | `explorer_search`, `get_evm_account_by_address`, `list_top_accounts` |
| Faucet | `claim_faucet_tokens`, `get_faucet_payout_status` |
| Validators | `list_validators`, `get_validators_active_set`, `get_validator_signatures` |

## License

MIT
