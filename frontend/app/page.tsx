"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useAppKit } from "@reown/appkit/react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSimulateContract,
} from "wagmi";
import { fetchAuditTrail } from "@/lib/graphql";
import { parseContractError, useWrongNetwork } from "@/lib/web3-helpers";
import { buildAuditRows, STATUS_LABEL, STATUS_COLOR, type AuditRow } from "@/lib/audit";
import { beneficiaryRegistryAbi, disbursementPoolAbi } from "@/lib/abi";
import { shortenHex, formatTimestamp, formatAmount } from "@/lib/format";
import { PROOF_URL_OVERRIDES } from "@/lib/proof-overrides";

const REGISTRY = process.env.NEXT_PUBLIC_BENEFICIARY_REGISTRY_ADDRESS as `0x${string}`;
const POOL = process.env.NEXT_PUBLIC_DISBURSEMENT_POOL_ADDRESS as `0x${string}`;

type Language = "id" | "en";

const copy = {
  id: {
    admin: "Panel Admin →",
    connect: "Connect Wallet",
    about: "Tentang prototype",
    prototype: "Prototype",
    submitted: "Diajukan",
    approved: "Disetujui",
    disbursed: "Dana Cair",
    recipient: "Penerima",
    status: "Status",
    amount: "Jumlah",
    empty: "Belum ada pengajuan.",
    language: "Bahasa",
    menu: "Menu",
    close: "Tutup",
    live: "Live",
    fallback: "Demo Mode - data cadangan",
    fallbackBanner: "Indexer langsung sedang tidak bisa diakses. Tabel di bawah menampilkan data cadangan, bukan data real-time.",
  },
  en: {
    admin: "Admin Panel →",
    connect: "Connect Wallet",
    about: "About prototype",
    prototype: "Prototype",
    submitted: "Submitted",
    approved: "Approved",
    disbursed: "Disbursed",
    recipient: "Recipient",
    status: "Status",
    amount: "Amount",
    empty: "No applications yet.",
    language: "Language",
    menu: "Menu",
    close: "Close",
    live: "Live",
    fallback: "Demo Mode - fallback data",
    fallbackBanner: "The live indexer is currently unreachable. The table below shows fallback data, not real-time data.",
  },
} as const;

function statusLabel(status: AuditRow["status"], lang: Language) {
  const labels = {
    id: STATUS_LABEL,
    en: {
      ...STATUS_LABEL,
      menunggu_verifikasi: "Pending Verification",
      disetujui_masa_sanggah: "Approved",
      siap_cair: "Ready for Disbursement",
      dicairkan: "Disbursed",
      ditolak: "Rejected",
      disuspend: "Suspended",
    },
  } as const;

  return labels[lang][status];
}

function proofLabel(label: string, lang: Language) {
  if (lang === "id") return label;
  return {
    Nama: "Name",
    Domisili: "Residence",
    "Alasan pengajuan": "Application reason",
  }[label] ?? label;
}

function AdminLink({ lang }: { lang: Language }) {
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
      {copy[lang].admin}
    </a>
  );
}

function ConnectButton({ lang }: { lang: Language }) {
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
          {isSwitching
            ? lang === "id" ? "Memindahkan…" : "Switching…"
            : lang === "id" ? "Pindah ke BSC Testnet" : "Switch to BSC Testnet"}
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
      {isConnected && address ? shortenHex(address) : copy[lang].connect}
    </button>
  );
}

function SummaryStrip({ rows, lang }: { rows: AuditRow[]; lang: Language }) {
  const diajukan = rows.length;
  const disetujui = rows.filter((r) =>
    r.status === "disetujui_masa_sanggah" || r.status === "siap_cair" || r.status === "dicairkan"
  ).length;
  const cair = rows.filter((r) => r.status === "dicairkan").length;

  const stats = [
    { label: copy[lang].submitted, value: diajukan },
    { label: copy[lang].approved, value: disetujui },
    { label: copy[lang].disbursed, value: cair },
  ];

  return (
    <div className="grid min-w-0 grid-cols-3 border border-border bg-surface">
      {stats.map((s, i) => (
        <div key={s.label} className={`min-w-0 p-3 sm:p-4 ${i > 0 ? "border-l border-border" : ""}`}>
          <div className="font-mono text-2xl sm:text-3xl">{s.value}</div>
          <div className="text-xs text-foreground/60 sm:text-sm">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function DisputeForm({ row, lang }: { row: AuditRow; lang: Language }) {
  const [reason, setReason] = useState("");
  const { isConnected, isWrongNetwork, isSwitching, trySwitch } = useWrongNetwork();

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

  const rawError = writeError || confirmError;
  const errorMessage = rawError ? parseContractError(rawError) : null;

  if (!row.programId) return null;

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <label className="block text-sm text-foreground/60">{lang === "id" ? "Ajukan Sanggahan" : "Submit Objection"}</label>
      <textarea
        value={reason}
        onChange={(e) => {
          if (rawError) resetWrite();
          setReason(e.target.value);
        }}
        placeholder={lang === "id" ? "Jelaskan kecurigaan Anda soal pengajuan ini…" : "Explain your concern about this application…"}
        rows={2}
        className="w-full border border-border p-2 font-mono text-sm bg-transparent"
      />

      {!isConnected ? (
        <p className="text-sm text-foreground/50">
          {lang === "id" ? "Connect wallet dulu untuk mengajukan sanggahan." : "Connect a wallet first to submit an objection."}
        </p>
      ) : isWrongNetwork ? (
        <button
          type="button"
          onClick={trySwitch}
          disabled={isSwitching}
          className="border border-accent-warning bg-accent-warning/10 text-accent-warning px-4 py-2 font-mono text-sm hover:bg-accent-warning/20 transition-colors"
        >
          {isSwitching
            ? lang === "id" ? "Memindahkan…" : "Switching…"
            : lang === "id" ? "Pindah ke BSC Testnet untuk Sanggah" : "Switch to BSC Testnet to Object"}
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
          {isPending
            ? lang === "id" ? "Konfirmasi di wallet…" : "Confirm in wallet…"
            : isConfirming ? lang === "id" ? "Mengirim…" : "Sending…"
            : isSuccess ? lang === "id" ? "Sanggahan Terkirim ✓" : "Objection Submitted ✓"
            : lang === "id" ? "Kirim Sanggahan" : "Submit Objection"}
        </button>
      )}

      {errorMessage && (
        <div className="border border-accent-rejected/40 bg-accent-rejected/5 p-3 text-xs font-mono text-accent-rejected space-y-1">
          <div className="flex items-center justify-between font-semibold">
            <span>{lang === "id" ? "Gagal Mengajukan Sanggahan" : "Objection Failed"}</span>
            <button type="button" onClick={() => resetWrite()} className="text-foreground/60 hover:text-foreground underline text-[11px]">
              {lang === "id" ? "Tutup" : "Close"}
            </button>
          </div>
          <p className="break-words leading-relaxed">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

function IndexerBadge({ source, lang }: { source: "live" | "fallback"; lang: Language }) {
  if (source === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-accent-verified">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-verified" />
        {copy[lang].live}
      </span>
    );
  }
  return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground/50" title={copy[lang].fallbackBanner}>
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
      {copy[lang].fallback}
    </span>
  );
}

function PrototypeInfo({ onClose, lang }: { onClose: () => void; lang: Language }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto border border-border bg-surface p-5 shadow-xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prototype-info-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-accent-verified">
              {lang === "id" ? "Prototype Hackathon" : "Hackathon Prototype"}
            </p>
            <h2 id="prototype-info-title" className="font-serif text-2xl">
              {lang === "id" ? "Tentang BanSOSChain" : "About BanSOSChain"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-sm text-foreground/50 underline hover:text-foreground"
          >
            {copy[lang].close}
          </button>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-mono text-xs uppercase tracking-wider text-foreground/50">{lang === "id" ? "Tentang prototype" : "About the prototype"}</h3>
            <p>
              {lang === "id"
                ? "BanSOSChain adalah prototype transparansi bantuan sosial berbasis blockchain. Prototype ini menunjukkan bagaimana pengajuan, persetujuan, sanggahan, dan pencairan dapat memiliki riwayat yang mudah diperiksa."
                : "BanSOSChain is a blockchain-based social assistance transparency prototype. It shows how applications, approvals, objections, and disbursements can have an auditable history."}
            </p>
            <p className="border border-accent-warning/40 bg-accent-warning/5 p-3 text-foreground/70">
              {lang === "id"
                ? "Data yang ditampilkan saat ini adalah data simulasi untuk demonstrasi hackathon, bukan data resmi pemerintah."
                : "The data shown is simulated for the hackathon demonstration and is not official government data."}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-foreground/50">{lang === "id" ? "Cara kerja alur bantuan" : "How the assistance flow works"}</h3>
            <ol className="grid gap-3 sm:grid-cols-5">
              {[
                lang === "id"
                  ? ["01", "Diajukan", "Data bantuan didaftarkan."]
                  : ["01", "Submitted", "Assistance data is registered."],
                lang === "id"
                  ? ["02", "Dinilai AI", "Model AI menilai kelayakan, verdiknya ditulis on-chain."]
                  : ["02", "AI-reviewed", "An AI model assesses eligibility; the verdict is written on-chain."],
                lang === "id"
                  ? ["03", "Disetujui", "Pengajuan melewati verifikasi, pencairan disetujui."]
                  : ["03", "Approved", "The application passes verification and disbursement is approved."],
                lang === "id"
                  ? ["04", "Masa sanggah", "Keberatan dapat diajukan selama 24 jam."]
                  : ["04", "Objection period", "Objections can be submitted during a 24-hour window."],
                lang === "id"
                  ? ["05", "Dicairkan", "Dana benar-benar berpindah dari kontrak ke wallet penerima."]
                  : ["05", "Disbursed", "Funds actually move from the contract to the recipient's wallet."],
              ].map(([number, title, description]) => (
                <li key={number} className="border border-border bg-background p-3">
                  <div className="mb-2 font-mono text-xs text-accent-verified">{number}</div>
                  <div className="font-medium">{title}</div>
                  <p className="mt-1 text-xs text-foreground/60">{description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-foreground/50">{lang === "id" ? "Istilah teknis" : "Technical terms"}</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                lang === "id"
                  ? ["Wallet", "Akun digital di blockchain. Siapa pun bisa memicu pencairan, tapi dana selalu terkirim ke wallet penerima yang tercatat."]
                  : ["Wallet", "A blockchain account. Anyone can trigger a disbursement, but funds always go to the recipient wallet on record."],
                lang === "id"
                  ? ["ID Hash", "Kode acak pengganti identitas penerima, dipakai agar data tetap privat di blockchain publik."]
                  : ["ID Hash", "A randomized code standing in for a recipient's identity, keeping data private on a public blockchain."],
                lang === "id"
                  ? ["Address", "Identitas digital akun yang tercatat dalam sistem."]
                  : ["Address", "The digital identity of an account recorded in the system."],
                lang === "id"
                  ? ["On-chain", "Data atau riwayat yang dicatat pada jaringan blockchain."]
                  : ["On-chain", "Data or history recorded on a blockchain network."],
                lang === "id"
                  ? ["mDANA", "Satuan dana atau token simulasi dalam prototype, bukan otomatis Rupiah."]
                  : ["mDANA", "A simulated fund or token unit in this prototype, not automatically Indonesian Rupiah."],
                lang === "id"
                  ? ["Audit trail", "Riwayat perubahan status pengajuan yang dapat diperiksa."]
                  : ["Audit trail", "A reviewable history of application status changes."],
              ].map(([term, description]) => (
                <div key={term} className="border-b border-border pb-2">
                  <dt className="font-mono text-xs text-foreground/70">{term}</dt>
                  <dd className="mt-1 text-xs text-foreground/60">{description}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </section>
    </div>
  );
}

function MenuButton({
  lang,
  open,
  onToggle,
  onAbout,
}: {
  lang: Language;
  open: boolean;
  onToggle: () => void;
  onAbout: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={copy[lang].menu}
        className="flex h-10 w-10 items-center justify-center border border-border font-mono text-lg hover:bg-foreground hover:text-background"
      >
        <span aria-hidden="true">☰</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-56 border border-border bg-surface p-3 shadow-lg" role="menu">
          <div className="mb-2 border-b border-border pb-2">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-foreground/50">{copy[lang].language}</span>
            <div className="flex gap-1">
              {(["id", "en"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    localStorage.setItem("bansoschain-language", option);
                    window.dispatchEvent(new CustomEvent("bansoschain-language", { detail: option }));
                  }}
                  className={`border px-3 py-1 font-mono text-xs ${lang === option ? "border-foreground bg-foreground text-background" : "border-border hover:bg-foreground/5"}`}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <AdminLink lang={lang} />
          <button
            type="button"
            onClick={onAbout}
            className="mt-2 block w-full border border-border px-3 py-2 text-left font-mono text-xs hover:bg-foreground hover:text-background"
            role="menuitem"
          >
            {copy[lang].about}
          </button>
        </div>
      )}
    </div>
  );
}

function ProgramSummaryCard({ programId, lang }: { programId: `0x${string}`; lang: Language }) {
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
    <div className="min-w-0 border border-border bg-surface p-4 space-y-2">
      <div className="flex flex-col gap-1 font-mono text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 break-words text-foreground/60">
          Program {shortenHex(programId)}{!active && (lang === "id" ? " (nonaktif)" : " (inactive)")}
        </span>
        <span className="break-words sm:text-right">
          {formatAmount(totalDisbursed.toString())} / {formatAmount(totalCap.toString())}
        </span>
      </div>
      <div className="h-1.5 w-full bg-border">
        <div className="h-1.5 bg-accent-verified" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DetailPanel({ row, onClose, lang, source }: { row: AuditRow; onClose: () => void; lang: Language; source: "live" | "fallback" }) {
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

  const { error: simulateError } = useSimulateContract({
    address: POOL,
    abi: disbursementPoolAbi,
    functionName: "cairkan",
    args: [row.programId!, row.idHash],
    query: { enabled: Boolean(canCairkan) && isConnected && !isWrongNetwork },
  });
  const preflightError =
    simulateError && !isPending && !isConfirming && !isSuccess ? parseContractError(simulateError) : null;

  return (
      <div className="border border-border bg-surface p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">{lang === "id" ? "Detail Pengajuan" : "Application Details"}</h2>
        <button onClick={onClose} className="text-sm text-foreground/50 hover:text-foreground">
          {lang === "id" ? "Tutup" : "Close"}
        </button>
      </div>

      <div className="space-y-1 font-mono text-sm text-foreground/70 break-all">
        <div>{row.idHash}</div>
        {onchain?.[1] && <div>{lang === "id" ? "Wallet" : "Wallet"}: {onchain[1]}</div>}
      </div>

      {proof && (
        <div className="min-w-0 border border-border bg-background p-4 space-y-1.5">
          <div className="text-[11px] font-mono text-foreground/40 uppercase tracking-wider mb-2">
            {lang === "id" ? "Data Pengajuan" : "Application Data"}
          </div>
          {proof.split('\n').filter(Boolean).map((line: string, i: number) => {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0 && colonIdx < 25) {
              const key = line.slice(0, colonIdx).trim();
              const value = line.slice(colonIdx + 1).trim();
              return (
                <div key={i} className="flex flex-col items-start gap-0 text-sm leading-relaxed sm:flex-row sm:gap-2">
                  <span className="text-foreground/80 sm:w-[140px] sm:shrink-0">{proofLabel(key, lang)}:</span>
                  <span className="min-w-0 break-words text-foreground">{value}</span>
                </div>
              );
            }
            return <div key={i} className="text-sm text-foreground leading-relaxed">{line}</div>;
          })}
        </div>
      )}

      <ol className="space-y-2 font-mono text-sm">
        <li>
          → {lang === "id" ? "Diajukan" : "Submitted"}
          {source === "live" && onchain?.[5] ? `: ${formatTimestamp(Number(onchain[5]))}` : ""}{" "}
          {row.registeredTxHash && (
            <a href={`https://testnet.bscscan.com/tx/${row.registeredTxHash}`} target="_blank" rel="noopener noreferrer" className="underline text-accent-verified hover:text-foreground">
              ({lang === "id" ? "lihat di BscScan" : "view on BscScan"})
            </a>
          )}
        </li>
        {row.approvedAt && (
          <li>
            → {lang === "id" ? "Disetujui" : "Approved"}: {formatTimestamp(row.approvedAt)}{" "}
            {row.approvedTxHash && (
              <a href={`https://testnet.bscscan.com/tx/${row.approvedTxHash}`} target="_blank" rel="noopener noreferrer" className="underline text-accent-verified hover:text-foreground">
                ({lang === "id" ? "lihat di BscScan" : "view on BscScan"})
              </a>
            )}
          </li>
        )}
        {row.disbursedAt && (
          <li>
            → {lang === "id" ? "Dana Cair" : "Disbursed"}: {formatTimestamp(row.disbursedAt)}{" "}
            {row.disbursedTxHash && (
              <a href={`https://testnet.bscscan.com/tx/${row.disbursedTxHash}`} target="_blank" rel="noopener noreferrer" className="underline text-accent-verified hover:text-foreground">
                ({lang === "id" ? "lihat di BscScan" : "view on BscScan"})
              </a>
            )}
          </li>
        )}
        {row.disputes.map((d, i) => (
          <li key={i} className="text-accent-rejected">
            → {lang === "id" ? "Disanggah oleh" : "Objected by"} {shortenHex(d.pelapor)} ({formatTimestamp(d.timestamp)}): {d.alasanURI}{" "}
            <a href={`https://testnet.bscscan.com/tx/${d.txHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              ({lang === "id" ? "verifikasi" : "verify"})
            </a>
          </li>
        ))}
      </ol>

      {canCairkan && (
        <div className="space-y-2">
          {!isConnected ? (
            <p className="text-sm text-foreground/50">
              {lang === "id" ? "Connect wallet dulu untuk mencairkan dana." : "Connect a wallet first to disburse funds."}
            </p>
          ) : isWrongNetwork ? (
            <button
              type="button"
              onClick={trySwitch}
              disabled={isSwitching}
              className="border border-accent-warning bg-accent-warning/10 text-accent-warning px-4 py-2 font-mono text-sm hover:bg-accent-warning/20 transition-colors"
            >
              {isSwitching
                ? lang === "id" ? "Memindahkan…" : "Switching…"
                : lang === "id" ? "Pindah ke BSC Testnet untuk Cairkan Dana" : "Switch to BSC Testnet to Disburse Funds"}
            </button>
          ) : (
            <button
              disabled={isPending || isConfirming || isSuccess || Boolean(simulateError)}
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
              {isPending
                ? lang === "id" ? "Konfirmasi di wallet…" : "Confirm in wallet…"
                : isConfirming ? lang === "id" ? "Memproses…" : "Processing…"
                : isSuccess ? lang === "id" ? "Dana Cair ✓" : "Funds Disbursed ✓"
                : lang === "id" ? "Cairkan Dana" : "Disburse Funds"}
            </button>
          )}

          {preflightError && (
            <div className="border border-accent-rejected/40 bg-accent-rejected/5 p-3 text-xs font-mono text-accent-rejected space-y-1">
              <div className="font-semibold">{lang === "id" ? "Tidak Bisa Dicairkan" : "Cannot Disburse"}</div>
              <p className="break-words leading-relaxed">{preflightError}</p>
            </div>
          )}

          {errorMessage && (
            <div className="border border-accent-rejected/40 bg-accent-rejected/5 p-3 text-xs font-mono text-accent-rejected space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span>{lang === "id" ? "Gagal Mencairkan Dana" : "Disbursement Failed"}</span>
                <button type="button" onClick={() => resetWrite()} className="text-foreground/60 hover:text-foreground underline text-[11px]">
                  {lang === "id" ? "Tutup" : "Close"}
                </button>
              </div>
              <p className="break-words leading-relaxed">{errorMessage}</p>
            </div>
          )}
        </div>
      )}

      {row.approvedAt && <DisputeForm row={row} lang={lang} />}
    </div>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [showPrototypeInfo, setShowPrototypeInfo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState<Language>("id");
  const { isWrongNetwork, isSwitching, trySwitch, chainId } = useWrongNetwork();

    useEffect(() => {
    const storedLanguage = window.localStorage.getItem("bansoschain-language");
    if (storedLanguage === "id" || storedLanguage === "en") setLang(storedLanguage);

    const handleLanguageChange = (event: Event) => {
      const language = (event as CustomEvent<Language>).detail;
      if (language === "id" || language === "en") setLang(language);
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "bansoschain-language" && (event.newValue === "id" || event.newValue === "en")) {
        setLang(event.newValue);
      }
    };

    window.addEventListener("bansoschain-language", handleLanguageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("bansoschain-language", handleLanguageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-trail"],
    queryFn: fetchAuditTrail,
    select: (result) => ({ rows: buildAuditRows(result.data), source: result.source }),
    refetchInterval: 15_000,
  });

  return (
    <main className="mx-auto min-w-0 max-w-4xl space-y-6 overflow-x-hidden px-4 py-8">
      <div className="mb-6 flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <a href="/" className="flex min-w-0 items-center">
            <Image
              src="/logo-wordmark-light.svg"
              alt="BanSOSChain"
              width={230}
              height={42}
              priority
              className="h-auto w-[180px] sm:h-[42px] sm:w-auto"
            />
          </a>
          {data && (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="min-w-0"><IndexerBadge source={data.source} lang={lang} /></span>
              <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground/50">
                {copy[lang].prototype}
              </span>
            </div>
          )}
        </div>
        <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <ConnectButton lang={lang} />
          <MenuButton
            lang={lang}
            open={menuOpen}
            onToggle={() => setMenuOpen((value) => !value)}
            onAbout={() => {
              setMenuOpen(false);
              setShowPrototypeInfo(true);
            }}
          />
        </div>
      </div>

      {isWrongNetwork && (
        <div className="border border-accent-warning/40 bg-accent-warning/5 p-3.5 font-mono text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-accent-warning">
          <span>
            {lang === "id"
              ? <>Dompet terhubung ke jaringan yang salah (Chain ID: {chainId}). BanSOSChain beroperasi di <strong>BNB Chain Testnet (Chain ID 97)</strong>.</>
              : <>Wallet is connected to the wrong network (Chain ID: {chainId}). BanSOSChain operates on <strong>BNB Chain Testnet (Chain ID 97)</strong>.</>}
          </span>
          <button
            onClick={trySwitch}
            disabled={isSwitching}
            className="px-3 py-1.5 bg-accent-warning text-background font-mono text-xs whitespace-nowrap transition-colors disabled:opacity-50"
          >
            {isSwitching
              ? lang === "id" ? "Memindahkan…" : "Switching…"
              : lang === "id" ? "Pindah ke BSC Testnet" : "Switch to BSC Testnet"}
          </button>
        </div>
      )}

      {data && data.source === "fallback" && (
        <div className="border border-border bg-background p-3.5 font-mono text-xs text-foreground/70">
          {copy[lang].fallbackBanner}
        </div>
      )}

      {isLoading && <p className="font-mono text-sm text-foreground/50">{lang === "id" ? "Memuat data…" : "Loading data…"}</p>}
      {error && <p className="font-mono text-sm text-accent-rejected">{lang === "id" ? "Gagal ambil data dari indexer." : "Failed to load data from the indexer."}</p>}

      {data && (
        <>
          <SummaryStrip rows={data.rows} lang={lang} />

          {[...new Set(data.rows.map((r) => r.programId).filter(Boolean))].map((pid) => (
            <ProgramSummaryCard key={pid} programId={pid as `0x${string}`} lang={lang} />
          ))}

          <div className="w-full min-w-0">
            <table className="w-full table-fixed border border-border bg-surface font-mono text-sm">
              <thead>
                <tr className="border-b border-border text-left text-foreground/50">
                  <th className="w-[37%] p-3 font-normal">{copy[lang].recipient}</th>
                  <th className="w-[37%] p-3 font-normal">{copy[lang].status}</th>
                  <th className="w-[26%] p-3 font-normal">{copy[lang].amount}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-foreground/50">
                      {copy[lang].empty}
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr
                      key={row.idHash}
                      onClick={() => setSelected(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(row);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={lang === "id"
                        ? `Lihat detail pengajuan ${shortenHex(row.idHash)}`
                        : `View application details ${shortenHex(row.idHash)}`}
                      className="border-b border-border last:border-b-0 cursor-pointer hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-verified"
                    >
                      <td className="break-words p-3">{shortenHex(row.idHash)}</td>
                      <td className={`break-words p-3 ${STATUS_COLOR[row.status]}`}>
                        {statusLabel(row.status, lang)}
                        {row.disputes.length > 0 && (
                          <span className="ml-2 inline-block border border-accent-rejected px-1.5 py-0.5 align-middle text-[10px] font-mono text-accent-rejected">
                            {row.disputes.length} {lang === "id" ? "sanggahan" : row.disputes.length > 1 ? "objections" : "objection"}
                          </span>
                        )}
                      </td>
                      <td className="break-words p-3">{row.amountPerBeneficiary ? formatAmount(row.amountPerBeneficiary) : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

      {selected && <DetailPanel row={selected} lang={lang} source={data.source} onClose={() => setSelected(null)} />}
        </>
      )}

      {showPrototypeInfo && <PrototypeInfo lang={lang} onClose={() => setShowPrototypeInfo(false)} />}
    </main>
  );
}
