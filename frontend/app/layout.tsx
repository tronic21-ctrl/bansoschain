import type { Metadata } from "next";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import "./globals.css";

// Matikan next/font/google sementara agar dev server tidak stuck mengunduh font
const sourceSerif = { variable: "--font-source-serif" };
const plexMono = { variable: "--font-plex-mono" };

export const metadata: Metadata = {
  title: "BanSosChain — Audit Trail Pencairan Bansos",
  description: "Transparansi pencairan bantuan sosial, tercatat on-chain.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookies = headersList.get("cookie");

  return (
    <html
      lang="id"
      className={`${sourceSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}