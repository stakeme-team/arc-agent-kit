/**
 * Demo 1: Send Tokens
 *
 * MAINNET. Sends 0.001 USDC (real funds) to the latest block miner.
 * Only run with an amount you are fine losing.
 */

import { runAgent } from "../src/agent.js";
import { getWalletAddress } from "../src/utils.js";

const walletAddress = getWalletAddress();

const systemPrompt = `You are a blockchain assistant for Arc mainnet (chain ID 5042, native USDC).
The user's wallet address is: ${walletAddress}

Live explorer MCP tools only. Never call missing tools.

prepare_native_transfer requires to + value (wei string). The signing bridge fills nonce/gas and returns serializedTransaction.
Broadcast with the local tool broadcast_signed_raw — the explorer MCP cannot broadcast.

NEVER read private keys or .env files.`;

const userPrompt = `MAINNET — real USDC. Do the following:
1. get_account for ${walletAddress}. If balance is 0, stop and tell me to fund the wallet.
2. list_blocks limit 1, then get_block for that id. Recipient = miner.
3. prepare_native_transfer to=miner value="1000000000000000" (0.001 USDC in wei).
4. Use serializedTransaction from the signing bridge with broadcast_signed_raw.
5. get_transaction with the hash and report it.`;

console.log("=== Arc Agent Kit: Send Tokens Demo ===");
console.log(`Wallet: ${walletAddress}`);
console.log("MAINNET — this spends real USDC.");

await runAgent({
  systemPrompt,
  userPrompt,
  maxSteps: 20,
});
