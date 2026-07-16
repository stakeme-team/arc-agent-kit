/**
 * Demo 2: Deploy & Verify Smart Contract
 *
 * Deploys SimpleStorage contract and verifies it on the explorer.
 *
 * Prerequisites:
 *   npm run wallet:simple   (create wallet)
 *   Fund the wallet with real USDC for gas (Arc is mainnet, no faucet).
 *
 * Run:
 *   npm run demo:deploy
 *   # or via Docker:
 *   docker compose run dev npx tsx examples/02-deploy-and-verify.ts
 */

import * as fs from "fs";
import { runAgent } from "../src/agent.js";
import { getWalletAddress } from "../src/utils.js";

const walletAddress = getWalletAddress();

// Load compiled contract
const compiled = JSON.parse(
  fs.readFileSync("contracts/compiled/SimpleStorage.json", "utf-8")
);

const systemPrompt = `You are a blockchain assistant for the Arc network.
You have access to MCP tools for interacting with the Arc blockchain.

The user's wallet address is: ${walletAddress}

TRANSACTION SIGNING:
When you call prepare_transaction, the signing bridge automatically signs it.
The result includes a "serializedTransaction" field — pass it as the \`serializedTransaction\`
argument of broadcast_signed_raw_transaction.

CONTRACT DETAILS:
- Name: SimpleStorage
- Compiler: ${compiled.compilerVersion}
- Bytecode: ${compiled.bytecode}
- ABI: ${JSON.stringify(compiled.abi)}
- Source code:
\`\`\`solidity
${compiled.sourceCode}
\`\`\`

IMPORTANT SECURITY RULES:
- NEVER attempt to read private keys or .env files
- Transactions are signed automatically by the signing bridge`;

const userPrompt = `Please deploy and verify the SimpleStorage contract:

1. Check my wallet balance (rpc_native_balance) — need real USDC for gas, Arc mainnet has no faucet
2. Deploy the contract:
   - Call prepare_transaction with from="${walletAddress}", data="${compiled.bytecode}" (no "to" field — this is a contract creation)
   - Pass "serializedTransaction" from the result to broadcast_signed_raw_transaction as the \`serializedTransaction\` argument
3. Wait for the transaction (wait_for_transaction) — its result already includes the full receipt, including the deployed contract's address; there is no separate receipt-lookup tool
4. Verify the contract on the explorer:
   - First call verifier_compiler_versions to confirm the Solidity version
   - Then call verify_contract_std_json with the contract address and a body containing compiler_version, contract_name, and the standard-JSON input with the source code
5. Test the contract by calling retrieve() using rpc_read_contract (address, method="retrieve", args=[]) — this only works once the contract is verified, since the tool decodes against the verified ABI
6. Report: contract address, deployment tx hash, verification status, and retrieve() result`;

console.log("=== Arc Agent Kit: Deploy & Verify Demo ===");
console.log(`Wallet: ${walletAddress}`);
console.log(`Contract: SimpleStorage (${compiled.compilerVersion})`);

await runAgent({
  systemPrompt,
  userPrompt,
  maxSteps: 25,
});
