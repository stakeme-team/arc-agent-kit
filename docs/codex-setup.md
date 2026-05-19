# OpenAI Codex + Arc MCP Setup

## Prerequisites

- [OpenAI Codex CLI](https://github.com/openai/codex) installed
- ChatGPT Pro subscription
- Node.js 20+

## Important: Codex MCP Limitation

Codex supports MCP servers via **STDIO transport only** (not remote HTTP/SSE). To connect to the remote Arc MCP server, we use `mcp-remote` as a bridge.

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/stakeme-team/arc-agent-kit
cd arc-agent-kit

# 2. Install dependencies
npm install

# 3. Create a wallet
npm run wallet:simple

# 4. Run Codex
codex
```

Codex reads `.codex/config.toml` which uses `mcp-remote` to proxy the Arc MCP server through STDIO.

## Configuration

The `.codex/config.toml` contains:

```toml
[mcp_servers.arc]
command = "npx"
args = ["mcp-remote", "https://api.arc.exploreme.pro/mcp"]
```

This uses the `mcp-remote` npm package to bridge HTTP/SSE to STDIO.

## Usage

In Codex, ask:

```
"Check my Arc wallet balance — address is in .env as WALLET_ADDRESS"
"Send 0.001 tokens to a random address from a recent block"
"Deploy the SimpleStorage contract and verify it on the explorer"
```

## Troubleshooting

- **mcp-remote not found**: Run `npm install -g mcp-remote`
- **Timeout errors**: The `mcp-remote` bridge may have connection timeouts. Try restarting Codex.
- **Tool discovery fails**: Ensure `https://api.arc.exploreme.pro/mcp` is accessible from your network.
