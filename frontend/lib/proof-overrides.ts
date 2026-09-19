// Override manual buat idHash yang metadataURI on-chain-nya rusak permanen
// (immutable, gak ada fungsi update di kontrak) - lihat catatan Fase 5/6.
export const PROOF_URL_OVERRIDES: Record<string, string> = {
  "0x11dadb1cc33f8fa1d162361197ad56faa0528dcd49f5bbcfbc877166df5d0744":
    "https://gist.githubusercontent.com/tronic21-ctrl/3390203a4c75d17cd4f0dc79d973022a/raw/701fe1674c34b017a0ba49ccd65782cadb699746/gistfile1.txt",
  "0x9ddff4fda21b48fda19a5d406df8ead0169054544d7326ec81596869c5c47e41":
    "https://gist.githubusercontent.com/tronic21-ctrl/044da0ca823f91be3f4d08ab8abe9828/raw/1736a9f71b1815ac3b082926a2cebf0a947fd86f/proof-01-siti.txt",
  "0xdb6361c6b9e9ce57966f96f805a6b92e0f75a6b0decc342e4b92da5e748fe81d":
    "https://gist.githubusercontent.com/tronic21-ctrl/044da0ca823f91be3f4d08ab8abe9828/raw/1736a9f71b1815ac3b082926a2cebf0a947fd86f/proof-02-yusuf.txt",
  "0xcf566bef005aeb24167fd63d61275661164b47a0952d2ae3e0ba08ff6327a1ca":
    "https://gist.githubusercontent.com/tronic21-ctrl/044da0ca823f91be3f4d08ab8abe9828/raw/1736a9f71b1815ac3b082926a2cebf0a947fd86f/proof-03-maria.txt",
  "0xfc445fa1c8ffde2b5fc4afcc643049ca18da13689effe260408d82366c0a3b61":
    "https://gist.githubusercontent.com/tronic21-ctrl/044da0ca823f91be3f4d08ab8abe9828/raw/1736a9f71b1815ac3b082926a2cebf0a947fd86f/proof-04-bambang.txt",
};
