import { tanyaAI, ambilTeks } from "../lib/ai";
import { VerdictSchema, verdictJsonSchema, type Verdict } from "./verdictSchema";
import { INSTRUKSI_JUDGE, ATURAN_KELAYAKAN } from "./prompts";

export async function judgeProof(metadataURI: string): Promise<Verdict> {
  const proofContent = await ambilTeks(metadataURI);
  if (proofContent === null) {
    throw new Error(`Gagal ambil proof dari ${metadataURI}`);
  }

  const raw = await tanyaAI<unknown>({
    instruksi: INSTRUKSI_JUDGE,
    data: {
      aturan_kelayakan: ATURAN_KELAYAKAN,
      proof_document: proofContent,
    },
    skema: verdictJsonSchema,
    nama: "verdict_kelayakan",
  });

  // jangan percaya mentah — validasi ulang lewat zod (defense-in-depth)
  return VerdictSchema.parse(raw);
}
