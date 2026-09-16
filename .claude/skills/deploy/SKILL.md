---
name: deploy
description: Deploy SimpleStorage locally, then verify via MCP
---

# /deploy — Deploy & Verify

**MAINNET. REAL USDC for gas.** The live explorer MCP has **no** `prepare_transaction`, `broadcast_signed_raw_transaction`, `rpc_read_contract`, or `verifier_compiler_versions`.

## Steps

1. Wallet + balance via `/wallet` / `get_account`. Stop if unfunded.

2. Build the deployment transaction locally (bytecode from `contracts/compiled/SimpleStorage.json`). Do not call missing MCP prepare tools.

3. Sign with `make sign` (or the AI SDK signing bridge after you construct an unsigned tx JSON with `data` = bytecode and no `to`).

4. Broadcast with `npx tsx scripts/broadcast-tx.ts` or AI SDK `broadcast_signed_raw`.

5. Look up the receipt/hash with MCP `get_transaction`. Read `contractAddress` from the explorer page if the MCP payload does not include it.

6. Verify with live MCP names:
   - `get_evm_compiler_versions`
   - `verify_evm_contract_standard_json` with `address`, `compiler_version`, `contract_name`, `standard_json`
   - `get_evm_contract_abi` after verification succeeds

## SECURITY

- NEVER read PRIVATE_KEY
- Deployment spends real USDC
