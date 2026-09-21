"use client";

import { useEffect, useState } from "react";
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

type Language = "id" | "en";

const copy = {
  id: {
    title: "Panel Admin", back: "← Dashboard", register: "Ajukan penerima baru", idHash: "ID Hash (bytes32)",
    manualHash: "Dihitung manual - belum ada standar hashing NIK di sistem.", wallet: "Alamat wallet penerima",
    type: "Tipe", individual: "Individual", group: "Group", metadata: "Metadata URI", submit: "Ajukan penerima",
    update: "Perbarui status penerima", pending: "Menunggu verifikasi", select: "pilih →", newStatus: "Status baru",
    verified: "Verified", rejected: "Rejected", suspended: "Suspended", updateButton: "Perbarui status",
    checking: "Memeriksa akses…", notVerifier: "Wallet ini bukan verifier terdaftar.", connect: "Connect wallet verifier untuk membuka panel admin.",
    wrongNetwork: "Pindah ke BSC Testnet dulu.", switch: "Pindah ke BSC Testnet", activeProgram: "Program aktif",
  },
  en: {
    title: "Admin Panel", back: "← Dashboard", register: "Register new beneficiary", idHash: "ID Hash (bytes32)",
    manualHash: "Calculated manually - no NIK hashing standard is defined yet.", wallet: "Beneficiary wallet address",
    type: "Type", individual: "Individual", group: "Group", metadata: "Metadata URI", submit: "Register beneficiary",
    update: "Update beneficiary status", pending: "Pending verification", select: "select →", newStatus: "New status",
    verified: "Verified", rejected: "Rejected", suspended: "Suspended", updateButton: "Update status",
    checking: "Checking access…", notVerifier: "This wallet is not a registered verifier.", connect: "Connect a verifier wallet to open the admin panel.",
    wrongNetwork: "Switch to BSC Testnet first.", switch: "Switch to BSC Testnet", activeProgram: "Active program",
  },
} as const;

function useLanguage() {
  const [lang, setLang] = useState<Language>("id");

  useEffect(() => {
    const stored = window.localStorage.getItem("bansoschain-language");
    if (stored === "id" || stored === "en") setLang(stored);
    const handleChange = (event: StorageEvent) => {
      if (event.key === "bansoschain-language" && (event.newValue === "id" || event.newValue === "en")) setLang(event.newValue);
    };
    window.addEventListener("storage", handleChange);
    return () => window.removeEventListener("storage", handleChange);
  }, []);

  return [lang, (next: Language) => {
    localStorage.setItem("bansoschain-language", next);
    setLang(next);
  }] as const;
}

function LanguageSwitch({ lang, setLang }: { lang: Language; setLang: (lang: Language) => void }) {
  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      {(["id", "en"] as const).map((option) => (
        <button key={option} type="button" onClick={() => setLang(option)} className={`border px-2 py-1 ${lang === option ? "border-foreground bg-foreground text-background" : "border-border hover:bg-foreground/5"}`}>
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function RegisterForm({ lang }: { lang: Language }) {
  const [idHash, setIdHash] = useState("");
  const [wallet, setWallet] = useState("");
  const [btype, setBtype] = useState<"0" | "1">("0");
  const [metadataURI, setMetadataURI] = useState("");
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });
  const errorMsg = (writeError || confirmError) && parseContractError(writeError || confirmError);

  return (
    <div>
      <h2 className="font-serif text-xl mb-3">{copy[lang].register}</h2>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>{copy[lang].idHash}</label>
          <input value={idHash} onChange={(e) => { if (writeError || confirmError) reset(); setIdHash(e.target.value); }} placeholder="0x…" className={inputCls} />
          <p className="text-xs text-foreground/50 mt-1">{copy[lang].manualHash}</p>
        </div>
        <div>
          <label className={labelCls}>{copy[lang].wallet}</label>
          <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{copy[lang].type}</label>
          <select value={btype} onChange={(e) => setBtype(e.target.value as "0" | "1")} className={inputCls}>
            <option value="0">{copy[lang].individual}</option>
            <option value="1">{copy[lang].group}</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>{copy[lang].metadata}</label>
          <textarea
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            placeholder="https://…"
            rows={2}
            className={`${inputCls} resize-y break-all`}
          />
        </div>
        <button
          disabled={!idHash || !wallet || !metadataURI || isPending || isConfirming}
          onClick={() => writeContract({ address: REGISTRY, abi: beneficiaryRegistryAbi, functionName: "usulkanPenerima", args: [idHash as `0x${string}`, wallet as `0x${string}`, Number(btype), metadataURI] })}
          className={`${btnBase} border-accent-verified text-accent-verified hover:bg-accent-verified hover:text-background`}
        >
          {isPending ? (lang === "id" ? "Konfirmasi di wallet…" : "Confirm in wallet…") : isConfirming ? (lang === "id" ? "Mengirim…" : "Sending…") : isSuccess ? (lang === "id" ? "Terdaftar ✓" : "Registered ✓") : copy[lang].submit}
        </button>
        {errorMsg && <p className="text-xs font-mono text-accent-rejected">{errorMsg}</p>}
      </div>
    </div>
  );
}

function StatusForm({ lang }: { lang: Language }) {
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
      <h2 className="font-serif text-xl mb-1">{copy[lang].update}</h2>
      {pending && pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-foreground/60 mb-1">{copy[lang].pending}</p>
          {pending.map((h) => (
            <div key={h} className="flex justify-between py-1.5 border-b border-border text-sm font-mono">
              <span>{shortenHex(h)}</span>
              <button onClick={() => setIdHash(h)} className="text-xs underline hover:text-foreground/70">{copy[lang].select}</button>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className={labelCls}>{copy[lang].idHash}</label>
          <input value={idHash} onChange={(e) => { if (writeError || confirmError) reset(); setIdHash(e.target.value); }} placeholder="0x…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{copy[lang].newStatus}</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "1" | "2" | "3")} className={inputCls}>
            <option value="1">{copy[lang].verified}</option>
            <option value="2">{copy[lang].rejected}</option>
            <option value="3">{copy[lang].suspended}</option>
          </select>
        </div>
        <button
          disabled={!idHash || isPending || isConfirming}
          onClick={() => writeContract({ address: REGISTRY, abi: beneficiaryRegistryAbi, functionName: "perbaruiStatus", args: [idHash as `0x${string}`, Number(status)] })}
          className={`${btnBase} border-accent-warning text-accent-warning hover:bg-accent-warning hover:text-background`}
        >
          {isPending ? (lang === "id" ? "Konfirmasi di wallet…" : "Confirm in wallet…") : isConfirming ? (lang === "id" ? "Mengirim…" : "Sending…") : isSuccess ? (lang === "id" ? "Diperbarui ✓" : "Updated ✓") : copy[lang].updateButton}
        </button>
        {errorMsg && <p className="text-xs font-mono text-accent-rejected">{errorMsg}</p>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [lang, setLang] = useLanguage();
  const { address, isConnected } = useAccount();
  const { isWrongNetwork, isSwitching, trySwitch } = useWrongNetwork();
  const { data: isVerifierWallet, isLoading: checking } = useReadContract({
    address: REGISTRY,
    abi: beneficiaryRegistryAbi,
    functionName: "isVerifier",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: isConnected && Boolean(address) },
  });

  if (!isConnected) return <main className="max-w-2xl mx-auto px-4 py-8"><LanguageSwitch lang={lang} setLang={setLang} /><p className="mt-4 font-mono text-sm text-foreground/60">{copy[lang].connect}</p></main>;
  if (isWrongNetwork) return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-3">
      <LanguageSwitch lang={lang} setLang={setLang} />
      <p className="font-mono text-sm text-accent-warning">{copy[lang].wrongNetwork}</p>
      <button onClick={trySwitch} disabled={isSwitching} className={`${btnBase} border-accent-warning text-accent-warning`}>{isSwitching ? (lang === "id" ? "Memindahkan…" : "Switching…") : copy[lang].switch}</button>
    </main>
  );
  if (checking) return <main className="max-w-2xl mx-auto px-4 py-8"><LanguageSwitch lang={lang} setLang={setLang} /><p className="mt-4 font-mono text-sm text-foreground/50">{copy[lang].checking}</p></main>;
  if (!isVerifierWallet) return <main className="max-w-2xl mx-auto px-4 py-8"><LanguageSwitch lang={lang} setLang={setLang} /><p className="mt-4 font-mono text-sm text-accent-rejected">{copy[lang].notVerifier}</p></main>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl">{copy[lang].title}</h1>
        <div className="flex items-center gap-3">
          <LanguageSwitch lang={lang} setLang={setLang} />
          <a href="/" className="text-xs font-mono text-foreground/60 hover:text-foreground shrink-0">{copy[lang].back}</a>
        </div>
      </div>
      <div className="border border-border bg-surface p-6">
        <RegisterForm lang={lang} />
        <StatusForm lang={lang} />
        <p className="text-xs text-foreground/50 mt-8 pt-4 border-t border-border">
          {copy[lang].activeProgram}: 0xb34b13…50ab (hardcode DEFAULT_PROGRAM_ID)
        </p>
      </div>
    </main>
  );
}