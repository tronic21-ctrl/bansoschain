import { createConfig } from "ponder";
import { BeneficiaryRegistryAbi } from "./abis/BeneficiaryRegistry";
import { DisbursementPoolAbi } from "./abis/DisbursementPool";

export default createConfig({
  chains: {
    bscTestnet: {
      id: 97,
      rpc: process.env.PONDER_RPC_URL_97,
    },
  },
  contracts: {
    BeneficiaryRegistry: {
      abi: BeneficiaryRegistryAbi,
      chain: "bscTestnet",
      address: "0xf726b1978003DB342492e29D3396C9Fe9271970C",
      startBlock: 129354493,
    },
    DisbursementPool: {
      abi: DisbursementPoolAbi,
      chain: "bscTestnet",
      address: "0x58Cb1E7Cc9C5812afb586E77c72bc452D3a528BC",
      startBlock: 129354493,
    },
  },
});
