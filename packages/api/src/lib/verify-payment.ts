import { createPublicClient, decodeEventLog, defineChain, http, parseAbiItem } from "viem";

const kiteTestnet = defineChain({
  id: 2368,
  name: "Kite Testnet",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-testnet.gokite.ai"] } },
});

const kiteMainnet = defineChain({
  id: 2366,
  name: "Kite Mainnet",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.gokite.ai"] } },
});

const clients = {
  testnet: createPublicClient({ chain: kiteTestnet, transport: http() }),
  mainnet: createPublicClient({ chain: kiteMainnet, transport: http() }),
};

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export interface VerifyPaymentInput {
  txHash: `0x${string}`;
  expectedToken: `0x${string}`;
  expectedTo: `0x${string}`;
  expectedFrom: `0x${string}`;
  expectedValueWei: bigint;
  network: "mainnet" | "testnet";
}

export async function verifyPayment(opts: VerifyPaymentInput): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const client = clients[opts.network];
  const receipt = await client.getTransactionReceipt({ hash: opts.txHash }).catch(() => null);
  if (!receipt) return { ok: false, reason: "tx not found" };
  if (receipt.status !== "success") return { ok: false, reason: "tx reverted" };

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== opts.expectedToken.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: [TRANSFER_EVENT],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "Transfer") continue;
      const { from, to, value } = decoded.args;
      if (from.toLowerCase() !== opts.expectedFrom.toLowerCase()) continue;
      if (to.toLowerCase() !== opts.expectedTo.toLowerCase()) continue;
      if (value >= opts.expectedValueWei) return { ok: true };
      return { ok: false, reason: `value too low (${value} < ${opts.expectedValueWei})` };
    } catch {
      continue;
    }
  }
  return { ok: false, reason: "no matching Transfer log" };
}
