import { useAccount, useChainId, useSwitchChain } from "wagmi";

export const BSC_TESTNET_ID = 97;

export function parseContractError(err: unknown): string {
  if (!err) return "";
  const errObj = err as { shortMessage?: string; message?: string };
  const msg = errObj.shortMessage || errObj.message || String(err);
  if (msg.includes("User rejected") || msg.includes("user rejected") || msg.includes("denied") || msg.includes("Rejected")) {
    return "Transaksi dibatalkan di dompet (User rejected).";
  }
  if (msg.includes("insufficient funds")) {
    return "Saldo tBNB di dompet tidak mencukupi untuk gas fee.";
  }
  if (msg.includes("MasihMasaSanggah")) {
    return "Belum bisa dicairkan — masih dalam masa sanggah 24 jam sejak disetujui.";
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