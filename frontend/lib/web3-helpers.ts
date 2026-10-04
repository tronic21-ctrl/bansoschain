import { useAccount, useChainId, useSwitchChain } from "wagmi";

export const BSC_TESTNET_ID = 97;

type ErrorLang = "id" | "en";

const ERROR_MESSAGES: Array<{ match: string[]; id: string; en: string }> = [
  {
    match: ["User rejected", "user rejected", "denied", "Rejected"],
    id: "Transaksi dibatalkan di dompet (User rejected).",
    en: "Transaction was cancelled in your wallet.",
  },
  {
    match: ["insufficient funds"],
    id: "Saldo tBNB di dompet tidak mencukupi untuk gas fee.",
    en: "Not enough tBNB in your wallet to pay the gas fee.",
  },
  {
    match: ["MasihMasaSanggah"],
    id: "Belum bisa dicairkan - masih dalam masa sanggah 24 jam sejak disetujui.",
    en: "Cannot disburse yet - the 24-hour objection window since approval is still open.",
  },
  {
    match: ["BukanEligible"],
    id: "Penerima ini berstatus tidak eligible (kemungkinan disuspend atau ditolak) - dana tidak bisa dicairkan.",
    en: "This recipient is not eligible (likely suspended or rejected) - funds cannot be disbursed.",
  },
  {
    match: ["ProgramTidakAktif"],
    id: "Program bansos ini sudah tidak aktif.",
    en: "This aid program is no longer active.",
  },
  {
    match: ["SudahDiklaim"],
    id: "Dana untuk penerima ini sudah pernah dicairkan sebelumnya.",
    en: "Funds for this recipient have already been disbursed.",
  },
  {
    match: ["CapTerlampaui"],
    id: "Batas total dana program ini sudah terlampaui.",
    en: "This program's total funding cap has been exceeded.",
  },
  {
    match: ["LewatBatasNominal"],
    id: "Nominal pencairan melebihi batas maksimum per transaksi.",
    en: "The disbursement amount exceeds the maximum per transaction.",
  },
  {
    match: ["BelumWaktunya"],
    id: "Belum waktunya untuk pencairan periode ini.",
    en: "It is not yet time for this period's disbursement.",
  },
  {
    match: ["BelumDisetujui"],
    id: "Pencairan ini belum disetujui verifier.",
    en: "This disbursement has not been approved by a verifier yet.",
  },
  {
    match: ["BukanVerifier"],
    id: "Wallet ini bukan verifier terdaftar.",
    en: "This wallet is not a registered verifier.",
  },
  {
    match: ["PenerimaSudahTerdaftar"],
    id: "ID Hash ini sudah terdaftar sebelumnya.",
    en: "This ID Hash is already registered.",
  },
  {
    match: ["PenerimaTidakDitemukan"],
    id: "ID Hash ini belum pernah diajukan.",
    en: "This ID Hash has not been submitted before.",
  },
];

export function parseContractError(err: unknown, lang: ErrorLang = "id"): string {
  if (!err) return "";
  const errObj = err as { shortMessage?: string; message?: string };
  const msg = [errObj.shortMessage, errObj.message].filter(Boolean).join(" ") || String(err);
  for (const entry of ERROR_MESSAGES) {
    if (entry.match.some((m) => msg.includes(m))) return entry[lang];
  }
  return errObj.shortMessage || (msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
}

export function useWrongNetwork() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const isWrongNetwork = isConnected && chainId !== BSC_TESTNET_ID;

  function trySwitch() {
    if (switchChain) switchChain({ chainId: BSC_TESTNET_ID });
  }

  return { isConnected, isWrongNetwork, isSwitching, trySwitch, switchChainAvailable: Boolean(switchChain), chainId };
}
