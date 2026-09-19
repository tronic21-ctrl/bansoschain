import { useAccount, useChainId, useSwitchChain } from "wagmi";

export const BSC_TESTNET_ID = 97;

export function parseContractError(err: unknown): string {
  if (!err) return "";
  const errObj = err as { shortMessage?: string; message?: string };
  const msg = [errObj.shortMessage, errObj.message].filter(Boolean).join(" ") || String(err);
  if (msg.includes("User rejected") || msg.includes("user rejected") || msg.includes("denied") || msg.includes("Rejected")) {
    return "Transaksi dibatalkan di dompet (User rejected).";
  }
  if (msg.includes("insufficient funds")) {
    return "Saldo tBNB di dompet tidak mencukupi untuk gas fee.";
  }
    if (msg.includes("MasihMasaSanggah")) {
    return "Belum bisa dicairkan — masih dalam masa sanggah 24 jam sejak disetujui.";
  }
  if (msg.includes("BukanEligible")) {
    return "Penerima ini berstatus tidak eligible (kemungkinan disuspend atau ditolak) — dana tidak bisa dicairkan.";
  }
  if (msg.includes("ProgramTidakAktif")) {
    return "Program bansos ini sudah tidak aktif.";
  }
  if (msg.includes("SudahDiklaim")) {
    return "Dana untuk penerima ini sudah pernah dicairkan sebelumnya.";
  }
  if (msg.includes("CapTerlampaui")) {
    return "Batas total dana program ini sudah terlampaui.";
  }
  if (msg.includes("LewatBatasNominal")) {
    return "Nominal pencairan melebihi batas maksimum per transaksi.";
  }
  if (msg.includes("BelumWaktunya")) {
    return "Belum waktunya untuk pencairan periode ini.";
  }
  if (msg.includes("BelumDisetujui")) {
    return "Pencairan ini belum disetujui verifier.";
  }
  if (msg.includes("BukanVerifier")) {
    return "Wallet ini bukan verifier terdaftar.";
  }
  if (msg.includes("PenerimaSudahTerdaftar")) {
    return "ID Hash ini sudah terdaftar sebelumnya.";
  }
  if (msg.includes("PenerimaTidakDitemukan")) {
    return "ID Hash ini belum pernah diajukan.";
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