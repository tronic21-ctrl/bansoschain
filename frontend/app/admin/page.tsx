"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { beneficiaryRegistryAbi } from "@/lib/abi";
import { fetchPendingBeneficiaries } from "@/lib/graphql";
import { parseContractError, useWrongNetwork } from "@/lib/web3-helpers";
import { shortenHex } from "@/lib/format";

const REGISTRY = process.env.NEXT_PUBLIC_BENEFICIARY_REGISTRY_ADDRESS as `0x${string}`;
const btnBase = "border px-4 py-2 font-mono text-sm transition-colors disabled:opacity-40";
const inputCls = "w-full border border-border p-2 font-mono text-sm bg-transparent";
const labelCls = "block text-xs text-foreground/60 mb-1";

function RegisterForm() {
  const [idHash, setIdHash] = useState("");
  const [wallet, setWallet] = useState("");
  const [btype, setBtype] = useState<"0" | "1">("0");
  const [metadataURI, setMetadataURI] = useState("");
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });
  const errorMsg = (writeError || confirmError) && parseContractError(writeError || confirmError);

  return (
    <div>
      <h2 className="font-serif text-xl mb-3">Ajukan penerima baru</h2>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>ID Hash (bytes32)</label>
          <input value={idHash} onChange={(e) => { if (writeError || confirmError) reset(); setIdHash(e.target.value); }} placeholder="0x…" className={inputCls} />
          <p className="text-xs text-foreground/50 mt-1">Dihitung manual — belum ada standar hashing NIK di sistem.</p>
        </div>
        <div>
          <label className={labelCls}>Alamat wallet penerima</label>
          <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tipe</label>
          <select value={btype} onChange={(e) => setBtype(e.target.value as "0" | "1")} className={inputCls}>
            <option value="0">Individual</option>
            <option value="1">Group</option>
          </select>
        </div>
      <div>
          <label className={labelCls}>Metadata URI</label>
          <textarea
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value.replace(/\n/g, ""))}
            placeholder="https://…"
            rows={2}
            className={`${inputCls} resize-y break-all`}
          />
        </div>
      </div>
        <button
          disabled={!idHash || !wallet || !metadataURI || isPending || isConfirming}
          onClick={() => writeContract({ address: REGISTRY, abi: beneficiaryRegistryAbi, functionName: "usulkanPenerima", args: [idHash as `0x${string}`, wallet as `0x${string}`, Number(btype), metadataURI] })}
          className={`${btnBase} border-accent-verified text-accent-verified hover:bg-accent-verified hover:text-background`}
        >
          {isPending ? "Konfirmasi di wallet…" : isConfirming ? "Mengirim…" : isSuccess ? "Terdaftar ✓" : "Ajukan penerima"}
        </button>
        {errorMsg && <p className="text-xs font-mono text-accent-rejected">{errorMsg}</p>}
      </div>
    </div>
  );
}

function StatusForm() {
  const [idHash, setIdHash] = useState("");
  const [status, setStatus] = useState<"1" | "2" | "3">("1");
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });
  const errorMsg = (writeError || confirmError) && parseContractError(writeError || confirmError);

  const { data: pending } = useQuery({
    queryKey: ["pending-beneficiaries"],
    queryFn: fetchPendingBeneficiaries,
    refetchInterval: 15_000,
  });

  return (
    <div className="border-t border-border pt-6 mt-6">
      <h2 className="font-serif text-xl mb-1">Perbarui status penerima</h2>
      {pending && pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-foreground/60 mb-1">Menunggu verifikasi</p>
          {pending.map((h) => (
            <div key={h} className="flex justify-between py-1.5 border-b border-border text-sm font-mono">
              <span>{shortenHex(h)}</span>
              <button onClick={() => setIdHash(h)} className="text-xs underline hover:text-foreground/70">pilih →</button>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className={labelCls}>ID Hash</label>
          <input value={idHash} onChange={(e) => { if (writeError || confirmError) reset(); setIdHash(e.target.value); }} placeholder="0x…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Status baru</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "1" | "2" | "3")} className={inputCls}>
            <option value="1">Verified</option>
            <option value="2">Rejected</option>
            <option value="3">Suspended</option>
          </select>
        </div>
        <button
          disabled={!idHash || isPending || isConfirming}
          onClick={() => writeContract({ address: REGISTRY, abi: beneficiaryRegistryAbi, functionName: "perbaruiStatus", args: [idHash as `0x${string}`, Number(status)] })}
          className={`${btnBase} border-accent-warning text-accent-warning hover:bg-accent-warning hover:text-background`}
        >
          {isPending ? "Konfirmasi di wallet…" : isConfirming ? "Mengirim…" : isSuccess ? "Diperbarui ✓" : "Perbarui status"}
        </button>
        {errorMsg && <p className="text-xs font-mono text-accent-rejected">{errorMsg}</p>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { isWrongNetwork, isSwitching, trySwitch } = useWrongNetwork();
  const { data: isVerifierWallet, isLoading: checking } = useReadContract({
    address: REGISTRY,
    abi: beneficiaryRegistryAbi,
    functionName: "isVerifier",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: isConnected && Boolean(address) },
  });

  if (!isConnected) return <main className="max-w-2xl mx-auto px-4 py-8"><p className="font-mono text-sm text-foreground/60">Connect wallet verifier untuk membuka panel admin.</p></main>;
  if (isWrongNetwork) return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-3">
      <p className="font-mono text-sm text-accent-warning">Pindah ke BSC Testnet dulu.</p>
      <button onClick={trySwitch} disabled={isSwitching} className={`${btnBase} border-accent-warning text-accent-warning`}>{isSwitching ? "Memindahkan…" : "Pindah ke BSC Testnet"}</button>
    </main>
  );
  if (checking) return <main className="max-w-2xl mx-auto px-4 py-8"><p className="font-mono text-sm text-foreground/50">Memeriksa akses…</p></main>;
  if (!isVerifierWallet) return <main className="max-w-2xl mx-auto px-4 py-8"><p className="font-mono text-sm text-accent-rejected">Wallet ini bukan verifier terdaftar.</p></main>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl">Panel Admin</h1>
        <a href="/" className="text-xs font-mono text-foreground/60 hover:text-foreground shrink-0">← Dashboard</a>
      </div>
      <RegisterForm />
      <StatusForm />
      <p className="text-xs text-foreground/50 mt-8 pt-4 border-t border-border">Program aktif: 0xb34b13…50ab (hardcode DEFAULT_PROGRAM_ID)</p>
    </main>
  );
}