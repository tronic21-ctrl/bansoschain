"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { fetchAuditTrail } from "@/lib/graphql";
import { buildAuditRows, STATUS_LABEL, STATUS_COLOR, type AuditRow } from "@/lib/audit";
import { beneficiaryRegistryAbi, disbursementPoolAbi } from "@/lib/abi";
import { shortenHex, formatTimestamp, formatAmount } from "@/lib/format";
import { PROOF_URL_OVERRIDES } from "@/lib/proof-overrides";

const REGISTRY = process.env.NEXT_PUBLIC_BENEFICIARY_REGISTRY_ADDRESS as `0x${string}`;
const POOL = process.env.NEXT_PUBLIC_DISBURSEMENT_POOL_ADDRESS as `0x${string}`;

function ConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  return (
    <button
      onClick={() => open()}
      className="rounded-none border border-border px-4 py-2 font-mono text-sm hover:bg-foreground hover:text-background transition-colors"
    >
      {isConnected && address ? shortenHex(address) : "Connect Wallet"}
    </button>
  );
}

function SummaryStrip({ rows }: { rows: AuditRow[] }) {
  const diajukan = rows.length;
  const disetujui = rows.filter((r) => r.status === "disetujui_masa_sanggah" || r.status === "siap_cair").length;
  const cair = rows.filter((r) => r.status === "dicairkan").length;

  const stats = [
    { label: "Diajukan", value: diajukan },
    { label: "Disetujui", value: disetujui },
    { label: "Dana Cair", value: cair },
  ];

  return (
    <div className="grid grid-cols-3 border border-border">
      {stats.map((s, i) => (
        <div key={s.label} className={`p-4 ${i > 0 ? "border-l border-border" : ""}`}>
          <div className="font-mono text-3xl">{s.value}</div>
          <div className="text-sm text-foreground/60">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function DisputeForm({ row }: { row: AuditRow }) {
  const [reason, setReason] = useState("");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!row.programId) return null;

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <label className="block text-sm text-foreground/60">Ajukan Sanggahan</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Jelaskan kecurigaan Anda soal pengajuan ini…"
        rows={2}
        className="w-full border border-border p-2 font-mono text-sm bg-transparent"
      />
      <button
        disabled={!reason || isPending || isConfirming}
        onClick={() =>
          writeContract({
            address: POOL,
            abi: disbursementPoolAbi,
            functionName: "ajukanSanggahan",
            args: [row.programId!, row.idHash, reason],
          })
        }
        className="border border-accent-rejected text-accent-rejected px-4 py-2 font-mono text-sm hover:bg-accent-rejected hover:text-background transition-colors disabled:opacity-40"
      >
        {isPending ? "Konfirmasi di wallet…" : isConfirming ? "Mengirim…" : isSuccess ? "Sanggahan Terkirim ✓" : "Kirim Sanggahan"}
      </button>
    </div>
  );
}

function DetailPanel({ row, onClose }: { row: AuditRow; onClose: () => void }) {
  const { data: onchain } = useReadContract({
    address: REGISTRY,
    abi: beneficiaryRegistryAbi,
    functionName: "beneficiaries",
    args: [row.idHash],
  });

    const onchainMetadataURI = onchain?.[4] as string | undefined;
    const metadataURI = PROOF_URL_OVERRIDES[row.idHash] ?? onchainMetadataURI;

  const { data: proof } = useQuery({
    queryKey: ["proof", metadataURI],
    queryFn: async () => {
      const res = await fetch(`/api/proof?url=${encodeURIComponent(metadataURI!)}`);
      const json = await res.json();
      return json.content as string;
    },
    enabled: Boolean(metadataURI),
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const canCairkan = row.status === "siap_cair" && row.programId;

  return (
    <div className="border border-border border-t-0 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Detail Pengajuan</h2>
        <button onClick={onClose} className="text-sm text-foreground/50 hover:text-foreground">
          Tutup
        </button>
      </div>

      <div className="font-mono text-sm text-foreground/70">{row.idHash}</div>

      {proof && (
        <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed border-l-2 border-border pl-4">
          {proof}
        </pre>
      )}

      <ol className="space-y-2 font-mono text-sm">
        <li>→ Diajukan</li>
        {row.approvedAt && <li>→ Disetujui: {formatTimestamp(row.approvedAt)}</li>}
        {row.disbursedAt && <li>→ Dana Cair: {formatTimestamp(row.disbursedAt)}</li>}
                {row.disputes.map((d, i) => (
          <li key={i} className="text-accent-rejected">
            → Disanggah oleh {shortenHex(d.pelapor)} ({formatTimestamp(d.timestamp)}): {d.alasanURI}
          </li>
        ))}
      </ol>

            {canCairkan && (
        <button
          disabled={isPending || isConfirming}
          onClick={() =>
            writeContract({
              address: POOL,
              abi: disbursementPoolAbi,
              functionName: "cairkan",
              args: [row.programId!, row.idHash],
            })
          }
          className="border border-accent-verified text-accent-verified px-4 py-2 font-mono text-sm hover:bg-accent-verified hover:text-background transition-colors disabled:opacity-40"
        >
          {isPending ? "Konfirmasi di wallet…" : isConfirming ? "Memproses…" : isSuccess ? "Dana Cair ✓" : "Cairkan Dana"}
        </button>
      )}

      {row.approvedAt && <DisputeForm row={row} />}
    </div>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-trail"],
    queryFn: fetchAuditTrail,
    select: buildAuditRows,
    refetchInterval: 15_000,
  });

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">BanSosChain</h1>
        <ConnectButton />
      </div>

      {isLoading && <p className="font-mono text-sm text-foreground/50">Memuat data…</p>}
      {error && <p className="font-mono text-sm text-accent-rejected">Gagal ambil data dari indexer.</p>}

      {data && (
        <>
          <SummaryStrip rows={data} />

          <table className="w-full border border-border border-t-0 font-mono text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground/50">
                <th className="p-3 font-normal">Penerima</th>
                <th className="p-3 font-normal">Status</th>
                <th className="p-3 font-normal">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.idHash}
                  onClick={() => setSelected(row)}
                  className="border-b border-border last:border-b-0 cursor-pointer hover:bg-foreground/5"
                >
                  <td className="p-3">{shortenHex(row.idHash)}</td>
                  <td className={`p-3 ${STATUS_COLOR[row.status]}`}>{STATUS_LABEL[row.status]}</td>
                  <td className="p-3">{row.amountPerBeneficiary ? formatAmount(row.amountPerBeneficiary) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selected && <DetailPanel row={selected} onClose={() => setSelected(null)} />}
        </>
      )}
    </main>
  );
}
