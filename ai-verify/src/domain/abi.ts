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
  {
    type: "function",
    name: "perbaruiStatus",
    stateMutability: "nonpayable",
    inputs: [
      { name: "idHash", type: "bytes32" },
      { name: "status", type: "uint8" },
    ],
    outputs: [],
  },
] as const;

export const disbursementPoolAbi = [
  {
    type: "function",
    name: "setujuiPencairan",
    stateMutability: "nonpayable",
    inputs: [
      { name: "programId", type: "bytes32" },
      { name: "idHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

export const BeneficiaryStatus = {
  Pending: 0,
  Verified: 1,
  Rejected: 2,
  Suspended: 3,
} as const;
