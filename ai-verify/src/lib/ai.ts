import { LLM } from "../config";

type Opsi = {
  instruksi: string; // peran + aturan main AI (system prompt)
  data: unknown; // bahan yang dinilai — dikirim sebagai DATA, bukan perintah
  skema: object; // JSON Schema: bentuk jawaban yang kita terima
  nama?: string;
};

export const tanyaAI = async <T>({ instruksi, data, skema, nama = "jawaban" }: Opsi): Promise<T> => {
  const res = await fetch(`${LLM.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${LLM.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: LLM.model,
      messages: [
        { role: "system", content: instruksi },
        { role: "user", content: JSON.stringify(data) },
      ],
      temperature: 0,
      response_format: { type: "json_schema", json_schema: { name: nama, strict: true, schema: skema } },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const hasil = await res.json();
  const pilihan = hasil.choices?.[0];

  if (pilihan?.message?.refusal) throw new Error(`LLM menolak: ${pilihan.message.refusal}`);
  if (pilihan?.finish_reason === "length") throw new Error("Jawaban terpotong — perpendek input");

  return JSON.parse(pilihan.message.content) as T;
};

export const ambilTeks = async (uri: string, maksKarakter = 8000) => {
  const url = uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.slice(7)}` : uri;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.text()).slice(0, maksKarakter);
  } catch {
    return null;
  }
};
