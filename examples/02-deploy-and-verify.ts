/**
 * Demo 2: Deploy & Verify
 *
 * MAINNET. Live MCP cannot prepare contract-creation txs.
 * This demo asks the agent to use get_account, local signing notes,
 * then verify_evm_contract_* tools after you already have an address.
 *
 * For a full deploy, construct bytecode locally and broadcast via
 * scripts/broadcast-tx.ts — do not call missing MCP tools.
 */

import * as fs from "fs";
import { runAgent } from "../src/agent.js";
import { getWalletAddress } from "../src/utils.js";

const walletAddress = getWalletAddress();
const compiled = JSON.parse(
  fs.readFileSync("contracts/compiled/SimpleStorage.json", "utf-8"),
);

const systemPrompt = `You are a blockchain assistant for Arc mainnet (chain ID 5042).
Wallet: ${walletAddress}

Live MCP has no prepare_transaction, broadcast_signed_raw_transaction, wait_for_transaction, rpc_native_balance, rpc_read_contract, or verifier_compiler_versions.

Use get_account for balance, get_evm_compiler_versions, verify_evm_contract_standard_json, get_evm_contract_abi, get_transaction.

Contract name SimpleStorage. Compiler ${compiled.compilerVersion}.
NEVER read private keys.`;

const userPrompt = `MAINNET. Check get_account for ${walletAddress}. If funded, explain that deployment must be signed and broadcast locally (explorer MCP does not deploy). Then show how to verify SimpleStorage with get_evm_compiler_versions and verify_evm_contract_standard_json once a contract address exists.`;

console.log("=== Arc Agent Kit: Deploy & Verify Demo ===");
console.log(`Wallet: ${walletAddress}`);
console.log("MAINNET — deployment spends real USDC.");

await runAgent({
  systemPrompt,
  userPrompt,
  maxSteps: 25,
});
