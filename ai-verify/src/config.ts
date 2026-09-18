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

// Sementara hardcode satu program aktif — usulkanPenerima() gak punya parameter programId,
// jadi belum ada cara baca ini per-penerima langsung dari chain. Kalau nanti ada >1 program
// aktif bersamaan, ini perlu jadi pilihan manual di form admin, bukan konstanta tunggal.
if (!process.env.DEFAULT_PROGRAM_ID) {
  throw new Error("DEFAULT_PROGRAM_ID belum diisi di .env");
}
export const DEFAULT_PROGRAM_ID = process.env.DEFAULT_PROGRAM_ID as `0x${string}`;
