// config.ts = satu tempat untuk semua konfigurasi & konstanta

export const RPC_URL = process.env.RPC_URL ?? "https://bsc-testnet-rpc.publicnode.com";

export const CONTRACTS = {
  beneficiaryRegistry: process.env.BENEFICIARY_REGISTRY_ADDRESS as `0x${string}`,
  disbursementPool: process.env.DISBURSEMENT_POOL_ADDRESS as `0x${string}`,
} as const;

if (!process.env.RELAYER_PRIVATE_KEY) {
  throw new Error("RELAYER_PRIVATE_KEY belum diisi di .env");
}
export const RELAYER_PK = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;

// LLM juri: endpoint OpenAI-compatible (OpenRouter / OpenAI / Google AI Studio dll)
export const LLM = {
  baseUrl: (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
  apiKey: process.env.LLM_API_KEY,
  model: process.env.LLM_MODEL ?? "gpt-4o-mini",
} as const;

export const PONDER_GRAPHQL_URL = (process.env.PONDER_GRAPHQL_URL ?? "http://localhost:42069").replace(/\/$/, "");
export const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_SECONDS ?? 15) * 1000;
