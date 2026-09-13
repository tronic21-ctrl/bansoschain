import "dotenv/config";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { RPC_URL, RELAYER_PK } from "../config";

export const relayerAccount = privateKeyToAccount(RELAYER_PK);

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
});

export const walletClient = createWalletClient({
  account: relayerAccount,
  chain: bscTestnet,
  transport: http(RPC_URL),
});
