import { createPublicClient, http, type Hex } from "viem";

export const ARC_CHAIN_ID = 5042;
const DEFAULT_RPC = "https://arc-rpc.stakeme.pro";

export function getPublicClient() {
  const url = process.env.ARC_RPC_URL || DEFAULT_RPC;
  return createPublicClient({
    chain: {
      id: ARC_CHAIN_ID,
      name: "Arc",
      nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
      rpcUrls: { default: { http: [url] } },
    },
    transport: http(url),
  });
}

/** Fill nonce/gas on an explorer unsigned skeleton so viem can sign it. */
export async function completeUnsignedTx(
  skeleton: Record<string, unknown>,
  from: `0x${string}`,
): Promise<Record<string, unknown>> {
  const client = getPublicClient();
  const to = skeleton.to as `0x${string}` | undefined;
  const data = (skeleton.data as Hex | undefined) || "0x";
  const value = BigInt(String(skeleton.value ?? "0"));
  const nonce = await client.getTransactionCount({ address: from });
  const gas = await client.estimateGas({ account: from, to, data, value });
  const fees = await client.estimateFeesPerGas();
  return {
    to,
    data,
    value: value.toString(),
    nonce,
    gas: gas.toString(),
    chainId: ARC_CHAIN_ID,
    maxFeePerGas: fees.maxFeePerGas.toString(),
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas.toString(),
  };
}

export async function broadcastRaw(serializedTransaction: Hex): Promise<Hex> {
  return getPublicClient().sendRawTransaction({ serializedTransaction });
}
