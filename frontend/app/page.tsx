"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppKit } from "@reown/appkit/react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { fetchAuditTrail } from "@/lib/graphql";
import { parseContractError, useWrongNetwork } from "@/lib/web3-helpers";
import { buildAuditRows, STATUS_LABEL, STATUS_COLOR, type AuditRow } from "@/lib/audit";
import { beneficiaryRegistryAbi, disbursementPoolAbi } from "@/lib/abi";
import { shortenHex, formatTimestamp, formatAmount } from "@/lib/format";
import { PROOF_URL_OVERRIDES } from "@/lib/proof-overrides";

const REGISTRY = process.env.NEXT_PUBLIC_BENEFICIARY_REGISTRY_ADDRESS as `0x${string}`;
const POOL = process.env.NEXT_PUBLIC_DISBURSEMENT_POOL_ADDRESS as `0x${string}`;

function AdminLink() {
  const { address, isConnected } = useAccount();
  const { data: isVerifierWallet } = useReadContract({
    address: REGISTRY,
    abi: beneficiaryRegistryAbi,
    functionName: "isVerifier",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: isConnected && Boolean(address) },
  });

  if (!isConnected || !isVerifierWallet) return null;

  return (
    <a
      href="/admin"
      className="border border-border px-3 py-1.5 font-mono text-xs hover:bg-foreground hover:text-background transition-colors"
    >
      Panel Admin →
    </a>
  );
}

function ConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { isWrongNetwork, isSwitching, trySwitch, switchChainAvailable } = useWrongNetwork();

  if (isConnected && isWrongNetwork) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => (switchChainAvailable ? trySwitch() : open({ view: "Networks" }))}
          disabled={isSwitching}
          className="border border-accent-warning bg-accent-warning/10 text-accent-warning px-3 py-1.5 font-mono text-xs hover:bg-accent-warning/20 transition-colors"
        >
          {isSwitching ? "Memindahkan…" : "Pindah ke BSC Testnet"}
        </button>
        <button
          onClick={() => open()}
          className="rounded-none border border-border px-3 py-1.5 font-mono text-xs hover:bg-foreground hover:text-background transition-colors"
        >
          {address ? shortenHex(address) : "Wallet"}
        </button>
      </div>
    );
  }

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
  const { isConnected, isWrongNetwork, isSwitching, trySwitch } = useWrongNetwork();

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

  const rawError = writeError || confirmError;
  const errorMessage = rawError ? parseContractError(rawError) : null;

  if (!row.programId) return null;

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <label className="block text-sm text-foreground/60">Ajukan Sanggahan</label>
      <textarea
        value={reason}
        onChange={(e) => {
          if (rawError) resetWrite();
          setReason(e.target.value);
        }}
        placeholder="Jelaskan kecurigaan Anda soal pengajuan ini…"
        rows={2}
        className="w-full border border-border p-2 font-mono text-sm bg-transparent"
      />

      {!isConnected ? (
        <p className="text-sm text-foreground/50">Connect wallet dulu untuk mengajukan sanggahan.</p>
      ) : isWrongNetwork ? (
        <button
          type="button"
          onClick={trySwitch}
          disabled={isSwitching}
          className="border border-accent-warning bg-accent-warning/10 text-accent-warning px-4 py-2 font-mono text-sm hover:bg-accent-warning/20 transition-colors"
        >
          {isSwitching ? "Memindahkan…" : "Pindah ke BSC Testnet untuk Sanggah"}
        </button>
      ) : (
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
      )}

      {errorMessage && (
        <div className="border border-accent-rejected/40 bg-accent-rejected/5 p-3 text-xs font-mono text-accent-rejected space-y-1">
          <div className="flex items-center justify-between font-semibold">
            <span>Gagal Mengajukan Sanggahan</span>
            <button type="button" onClick={() => resetWrite()} className="text-foreground/60 hover:text-foreground underline text-[11px]">
              Tutup
            </button>
          </div>
          <p className="break-words leading-relaxed">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

function IndexerBadge({ source }: { source: "live" | "fallback" }) {
  if (source === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-accent-verified">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-verified" />
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground/50" title="Indexer tidak terjangkau — ini data cadangan, bukan data real-time">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
      Demo Mode — data cadangan
    </span>
  );
}

function ProgramSummaryCard({ programId }: { programId: `0x${string}` }) {
  const { data: program } = useReadContract({
    address: POOL,
    abi: disbursementPoolAbi,
    functionName: "programs",
    args: [programId],
  });

  if (!program) return null;

  const totalCap = program[3];
  const totalDisbursed = program[4];
  const active = program[7];
  const pct = totalCap > 0n ? Number((totalDisbursed * 100n) / totalCap) : 0;

  return (
    <div className="border border-border p-4 space-y-2">
      <div className="flex items-center justify-between font-mono text-sm">
        <span className="text-foreground/60">
          Program {shortenHex(programId)}{!active && " (nonaktif)"}
        </span>
        <span>
          {formatAmount(totalDisbursed.toString())} / {formatAmount(totalCap.toString())}
        </span>
      </div>
      <div className="h-1.5 w-full bg-border">
        <div className="h-1.5 bg-accent-verified" style={{ width: `${pct}%` }} />
      </div>
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

    const { isConnected, isWrongNetwork, isSwitching, trySwitch } = useWrongNetwork();
  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

  const rawError = writeError || confirmError;
  const errorMessage = rawError ? parseContractError(rawError) : null;

  const canCairkan = row.status === "siap_cair" && row.programId;

  return (
    <div className="border border-border border-t-0 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Detail Pengajuan</h2>
        <button onClick={onClose} className="text-sm text-foreground/50 hover:text-foreground">
          Tutup
        </button>
      </div>

      <div className="space-y-1 font-mono text-sm text-foreground/70">
        <div>{row.idHash}</div>
        {onchain?.[1] && <div>Wallet: {onchain[1]}</div>}
      </div>

      {proof && (
        <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed border-l-2 border-border pl-4">
          {proof}
        </pre>
      )}

      <ol className="space-y-2 font-mono text-sm">
        <li>
          → Diajukan{" "}
          {row.registeredTxHash && (
            <a href={`https://testnet.bscscan.com/tx/${row.registeredTxHash}`} target="_blank" rel="noopener noreferrer" className="underline text-foreground/50 hover:text-foreground">
              (verifikasi)
            </a>
          )}
        </li>
        {row.approvedAt && (
          <li>
            → Disetujui: {formatTimestamp(row.approvedAt)}{" "}
            {row.approvedTxHash && (
              <a href={`https://testnet.bscscan.com/tx/${row.approvedTxHash}`} target="_blank" rel="noopener noreferrer" className="underline text-foreground/50 hover:text-foreground">
                (verifikasi)
              </a>
            )}
          </li>
        )}
        {row.disbursedAt && (
          <li>
            → Dana Cair: {formatTimestamp(row.disbursedAt)}{" "}
            {row.disbursedTxHash && (
              <a href={`https://testnet.bscscan.com/tx/${row.disbursedTxHash}`} target="_blank" rel="noopener noreferrer" className="underline text-foreground/50 hover:text-foreground">
                (verifikasi)
              </a>
            )}
          </li>
        )}
        {row.disputes.map((d, i) => (
          <li key={i} className="text-accent-rejected">
            → Disanggah oleh {shortenHex(d.pelapor)} ({formatTimestamp(d.timestamp)}): {d.alasanURI}{" "}
            <a href={`https://testnet.bscscan.com/tx/${d.txHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              (verifikasi)
            </a>
          </li>
        ))}
      </ol>

      {canCairkan && (
        <div className="space-y-2">
          {!isConnected ? (
            <p className="text-sm text-foreground/50">Connect wallet dulu untuk mencairkan dana.</p>
          ) : isWrongNetwork ? (
            <button
              type="button"
              onClick={trySwitch}
              disabled={isSwitching}
              className="border border-accent-warning bg-accent-warning/10 text-accent-warning px-4 py-2 font-mono text-sm hover:bg-accent-warning/20 transition-colors"
            >
              {isSwitching ? "Memindahkan…" : "Pindah ke BSC Testnet untuk Cairkan Dana"}
            </button>
          ) : (
            <button
              disabled={isPending || isConfirming || isSuccess}
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

          {errorMessage && (
            <div className="border border-accent-rejected/40 bg-accent-rejected/5 p-3 text-xs font-mono text-accent-rejected space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span>Gagal Mencairkan Dana</span>
                <button type="button" onClick={() => resetWrite()} className="text-foreground/60 hover:text-foreground underline text-[11px]">
                  Tutup
                </button>
              </div>
              <p className="break-words leading-relaxed">{errorMessage}</p>
            </div>
          )}
        </div>
      )}

      {row.approvedAt && <DisputeForm row={row} />}
    </div>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const { isWrongNetwork, isSwitching, trySwitch, chainId } = useWrongNetwork();

  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-trail"],
    queryFn: fetchAuditTrail,
    select: (result) => ({ rows: buildAuditRows(result.data), source: result.source }),
    refetchInterval: 15_000,
  });

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl">BanSosChain</h1>
          {data && <IndexerBadge source={data.source} />}
      </div>
        <div className="flex items-center gap-2">
          <AdminLink />
          <ConnectButton />
        </div>
      </div>

      {isWrongNetwork && (
        <div className="border border-accent-warning/40 bg-accent-warning/5 p-3.5 font-mono text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-accent-warning">
          <span>
            Dompet terhubung ke jaringan yang salah (Chain ID: {chainId}). BanSosChain beroperasi di <strong>BNB Chain Testnet (Chain ID 97)</strong>.
          </span>
          <button
            onClick={trySwitch}
            disabled={isSwitching}
            className="px-3 py-1.5 bg-accent-warning text-background font-mono text-xs whitespace-nowrap transition-colors disabled:opacity-50"
          >
            {isSwitching ? "Memindahkan…" : "Pindah ke BSC Testnet"}
          </button>
        </div>
      )}

      {isLoading && <p className="font-mono text-sm text-foreground/50">Memuat data…</p>}
      {error && <p className="font-mono text-sm text-accent-rejected">Gagal ambil data dari indexer.</p>}

      {data && (
        <>
          <SummaryStrip rows={data.rows} />

          {[...new Set(data.rows.map((r) => r.programId).filter(Boolean))].map((pid) => (
            <ProgramSummaryCard key={pid} programId={pid as `0x${string}`} />
          ))}

          <table className="w-full border border-border border-t-0 font-mono text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground/50">
                <th className="p-3 font-normal">Penerima</th>
                <th className="p-3 font-normal">Status</th>
                <th className="p-3 font-normal">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.idHash} onClick={() => setSelected(row)} className="border-b border-border last:border-b-0 cursor-pointer hover:bg-foreground/5">
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
