---
name: deploy
description: Deploy and verify a smart contract on Arc
---

# /deploy — Deploy & Verify Smart Contract

## Steps

1. Get wallet address:
   ```bash
   grep WALLET_ADDRESS .env | cut -d'=' -f2
   ```

2. Check balance using MCP `rpc_native_balance`. Deployment needs gas (real USDC — Arc mainnet has no faucet).

3. Read the compiled contract:
   ```bash
   cat contracts/compiled/SimpleStorage.json
   ```
   Extract the `bytecode` field (starts with 0x).

4. Prepare deployment transaction:
   - Call MCP `prepare_transaction` with:
     - `from`: wallet address
     - `data`: bytecode from step 3
     - Do NOT include `to` (contract creation)

5. Sign the transaction:
   ```bash
   echo '<unsigned_tx_json>' | make sign
   ```

6. Broadcast:
   - Call MCP `broadcast_signed_raw_transaction` with signed hex

7. Wait for receipt:
   - Call MCP `wait_for_transaction` with tx hash — the result already includes the receipt; extract `contractAddress` from it (no separate receipt-lookup tool exists)

8. Verify the contract:
   - Call MCP `verifier_compiler_versions` to find Solidity versions
   - Read source: `cat contracts/SimpleStorage.sol`
   - Call MCP `verify_contract_std_json` with:
     - `address`: deployed contract address
     - `body`: passthrough object forwarded to the verifier — include `compiler_version` (matching version from step 8, e.g. "v0.8.28+commit.7893614a"), `contract_name`: "SimpleStorage", and `input`: the Solidity standard-JSON compiler input containing the source code

9. Test the contract (only works once verified — `rpc_read_contract` decodes against the verified ABI):
   - Call MCP `rpc_read_contract` with:
     - `address`: contract address
     - `method`: "retrieve"
     - `args`: []
   - Report the result

10. Report to user:
    - Contract address
    - Deployment tx hash
    - Verification status
    - Current stored value

## SECURITY
- NEVER read PRIVATE_KEY — use sign-tx.ts for signing
- NEVER access .env except for WALLET_ADDRESS
