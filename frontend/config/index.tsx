import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bscTestnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bscTestnet];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true, // wajib buat Next.js
});

export const metadata = {
  name: "BanSosChain",
  description: "Audit trail transparansi pencairan bansos on-chain",
  url: "http://localhost:3000", // ganti sesuai domain kalau nanti di-deploy
  icons: [],
};
