export const beneficiaryRegistryAbi = [
  {
    type: "function",
    name: "beneficiaries",
    stateMutability: "view",
    inputs: [{ name: "idHash", type: "bytes32" }],
    outputs: [
      { name: "idHash", type: "bytes32" },
      { name: "wallet", type: "address" },
      { name: "btype", type: "uint8" },
      { name: "status", type: "uint8" },
      { name: "metadataURI", type: "string" },
      { name: "registeredAt", type: "uint256" },
      { name: "registeredBy", type: "address" },
    ],
  },
] as const;

export const disbursementPoolAbi = [
  {
    type: "function",
    name: "cairkan",
    stateMutability: "nonpayable",
    inputs: [
      { name: "programId", type: "bytes32" },
      { name: "idHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "ajukanSanggahan",
    stateMutability: "nonpayable",
    inputs: [
      { name: "programId", type: "bytes32" },
      { name: "idHash", type: "bytes32" },
      { name: "alasanURI", type: "string" },
    ],
    outputs: [],
  },
] as const;
