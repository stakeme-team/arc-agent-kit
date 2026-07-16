/**
 * Demo 1: Send Tokens
 *
 * Sends a small amount of native tokens to a random address
 * found in a recent transaction.
 *
 * Arc is mainnet — this moves REAL USDC to a randomly chosen address.
 * Only run with an amount you're fine losing.
 *
 * Prerequisites:
 *   npm run wallet:simple   (create wallet)
 *   Fund the wallet with real USDC (Arc is mainnet, native gas token is USDC, no faucet).
 *
 * Run:
 *   npm run demo:send
 *   # or via Docker:
 *   docker compose run dev npx tsx examples/01-send-tokens.ts
 */

import { runAgent } from "../src/agent.js";
import { getWalletAddress } from "../src/utils.js";

const walletAddress = getWalletAddress();

const systemPrompt = `You are a blockchain assistant for the Arc network.
You have access to MCP tools for interacting with the Arc blockchain.

The user's wallet address is: ${walletAddress}

TRANSACTION SIGNING:
When you call prepare_native_transfer or prepare_transaction, the signing bridge
automatically signs the transaction. The result will include a "serializedTransaction" field.
Pass it as the \`serializedTransaction\` argument to broadcast_signed_raw_transaction.

IMPORTANT SECURITY RULES:
- NEVER attempt to read private keys or .env files
- NEVER use generate_disposable_test_wallet tool
- Transactions are signed automatically by the signing bridge`;

const userPrompt = `Please do the following:
1. Check my wallet balance (rpc_native_balance). If it's 0, stop and tell me to fund the wallet with real USDC first — there is no faucet on mainnet.
2. Get recent transactions (list_transactions with limit 5) to find candidate addresses
3. Choose a random from_addr or to_addr from the results as the recipient
4. Send 0.001 native tokens to that address:
   - Call prepare_native_transfer with from=${walletAddress}, to=<recipient>, amount="0.001"
   - The result will include "serializedTransaction" — pass it to broadcast_signed_raw_transaction as the \`serializedTransaction\` argument
5. Wait for the transaction to confirm (wait_for_transaction) — its result already includes the full receipt, report those details`;

console.log("=== Arc Agent Kit: Send Tokens Demo ===");
console.log(`Wallet: ${walletAddress}`);

await runAgent({
  systemPrompt,
  userPrompt,
  maxSteps: 20,
});
