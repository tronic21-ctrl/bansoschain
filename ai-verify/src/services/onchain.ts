import { publicClient, walletClient } from "../lib/viemClient";
import { CONTRACTS } from "../config";
import {
  beneficiaryRegistryAbi,
  disbursementPoolAbi,
  BeneficiaryStatus,
} from "../domain/abi";

export async function getBeneficiary(idHash: `0x${string}`) {
  const result = (await publicClient.readContract({
    address: CONTRACTS.beneficiaryRegistry,
    abi: beneficiaryRegistryAbi,
    functionName: "beneficiaries",
    args: [idHash],
  })) as unknown as [string, string, number, number, string, bigint, string];

  const [, wallet, btype, status, metadataURI, registeredAt, registeredBy] = result;
  return { wallet, btype, status, metadataURI, registeredAt, registeredBy };
}

export async function setBeneficiaryStatus(idHash: `0x${string}`, eligible: boolean) {
  const status = eligible ? BeneficiaryStatus.Verified : BeneficiaryStatus.Rejected;
  const hash = await walletClient.writeContract({
    address: CONTRACTS.beneficiaryRegistry,
    abi: beneficiaryRegistryAbi,
    functionName: "perbaruiStatus",
    args: [idHash, status],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function approveDisbursement(programId: `0x${string}`, idHash: `0x${string}`) {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.disbursementPool,
    abi: disbursementPoolAbi,
    functionName: "setujuiPencairan",
    args: [programId, idHash],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
