import { signTransaction, getAddress } from "./wallet.js";
import { broadcastRaw, completeUnsignedTx } from "./rpc.js";

const PREPARE_TOOLS = ["prepare_native_transfer"];

/**
 * MCP tool results come wrapped in the standard envelope.
 * Unsigned-tx fields live at structuredContent.data.
 */
function extractUnsignedTx(result: unknown): Record<string, unknown> | null {
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (r.isError) return null;
    const structured = r.structuredContent as
      | { data?: Record<string, unknown> }
      | undefined;
    if (structured?.data) return structured.data;
    return r;
  }
  if (typeof result === "string") {
    try {
      return JSON.parse(result) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

type McpTool = {
  execute?: (args: unknown, options: unknown) => Promise<unknown>;
  [key: string]: unknown;
};

/**
 * When the agent calls prepare_native_transfer:
 * 1. MCP returns an unsigned skeleton (to + value wei). It does not sign or broadcast.
 * 2. Fill nonce/gas from Arc RPC, sign locally.
 * 3. Return serializedTransaction. Broadcast with the local broadcast_signed_raw tool.
 */
export function augmentToolsWithSigning(
  tools: Record<string, McpTool>,
): Record<string, McpTool> {
  const augmented = { ...tools };

  for (const toolName of PREPARE_TOOLS) {
    const original = augmented[toolName];
    if (!original?.execute) continue;
    const originalExecute = original.execute;
    augmented[toolName] = {
      ...original,
      execute: async (args: unknown, options: unknown) => {
        const result = await originalExecute(args, options);
        const unsigned = extractUnsignedTx(result);
        if (!unsigned) return result;
        try {
          const from = getAddress() as `0x${string}`;
          const filled = await completeUnsignedTx(unsigned, from);
          const serializedTransaction = await signTransaction(filled);
          return JSON.stringify({
            ...filled,
            serializedTransaction,
            _note:
              "Signed locally. The explorer MCP cannot broadcast. Call broadcast_signed_raw with serializedTransaction.",
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return JSON.stringify({
            ...unsigned,
            _signingError: message,
            _note: "Signing failed. Check wallet setup: npm run wallet:simple",
          });
        }
      },
    };
  }

  augmented.get_wallet_address = {
    description: "Get the local wallet address (no private key exposure)",
    inputSchema: { type: "object" as const, properties: {} },
    execute: async () => JSON.stringify({ address: getAddress() }),
  };

  augmented.broadcast_signed_raw = {
    description:
      "Broadcast a locally signed raw transaction to Arc RPC. Moves real USDC on mainnet.",
    inputSchema: {
      type: "object" as const,
      properties: { serializedTransaction: { type: "string" } },
      required: ["serializedTransaction"],
    },
    execute: async (args: unknown) => {
      const serialized =
        args && typeof args === "object" && "serializedTransaction" in args
          ? String((args as { serializedTransaction: unknown }).serializedTransaction)
          : "";
      const hash = await broadcastRaw(serialized as `0x${string}`);
      return JSON.stringify({ hash, explorer: `https://arc.exploreme.pro/tx/${hash}` });
    },
  };

  return augmented;
}
