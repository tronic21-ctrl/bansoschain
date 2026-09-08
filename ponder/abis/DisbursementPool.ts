export const DisbursementPoolAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "registryAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "GRACE_PERIOD",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "acceptOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ajukanSanggahan",
    "inputs": [
      {
        "name": "programId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "idHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "alasanURI",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "approvedAt",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "buatProgram",
    "inputs": [
      {
        "name": "programId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "dtype",
        "type": "uint8",
        "internalType": "enum DisbursementPool.DisbursementType"
      },
      {
        "name": "amountPerBeneficiary",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "periodInterval",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalCap",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxPerTransaction",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cairkan",
    "inputs": [
      {
        "name": "programId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "idHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "lastClaimedAt",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nonaktifkanProgram",
    "inputs": [
      {
        "name": "programId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingOwner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "programs",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "dtype",
        "type": "uint8",
        "internalType": "enum DisbursementPool.DisbursementType"
      },
      {
        "name": "amountPerBeneficiary",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "periodInterval",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalCap",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalDisbursed",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxPerTransaction",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract BeneficiaryRegistry"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setujuiPencairan",
    "inputs": [
      {
        "name": "programId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "idHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "DanaDicairkan",
    "inputs": [
      {
        "name": "programId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "idHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferStarted",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PencairanDisetujui",
    "inputs": [
      {
        "name": "programId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "idHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "approvedAt",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProgramDibuat",
    "inputs": [
      {
        "name": "programId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "dtype",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum DisbursementPool.DisbursementType"
      },
      {
        "name": "amountPerBeneficiary",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SanggahanDiajukan",
    "inputs": [
      {
        "name": "programId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "idHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "pelapor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "alasanURI",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "BelumDisetujui",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BelumWaktunya",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BukanEligible",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CapTerlampaui",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LewatBatasNominal",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MasihMasaSanggah",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ProgramTidakAktif",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "SudahDiklaim",
    "inputs": []
  }
] as const;
