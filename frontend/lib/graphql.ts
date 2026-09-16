import { GraphQLClient, gql } from "graphql-request";

const PONDER_URL = (process.env.NEXT_PUBLIC_PONDER_GRAPHQL_URL ?? "http://localhost:42069") + "/";
export const ponderClient = new GraphQLClient(PONDER_URL);

export const AUDIT_TRAIL_QUERY = gql`
  query {
    beneficiariess {
      items { idHash registeredBy btype status registeredAt updatedAt txHash }
    }
    programss {
      items { programId dtype amountPerBeneficiary createdAt }
    }
    approvalss {
      items { id programId idHash approvedAt txHash }
    }
    disbursementss {
      items { id programId idHash amount timestamp txHash }
    }
    disputess {
      items { id programId idHash pelapor alasanURI timestamp txHash }
    }
  }
`;

type Beneficiary = { idHash: string; registeredBy: string; btype: string; status: string; registeredAt: string; updatedAt: string; txHash: string };
type Program = { programId: string; dtype: string; amountPerBeneficiary: string; createdAt: string };
type Approval = { id: string; programId: string; idHash: string; approvedAt: string; txHash: string };
type Disbursement = { id: string; programId: string; idHash: string; amount: string; timestamp: string; txHash: string };
type Dispute = { id: string; programId: string; idHash: string; pelapor: string; alasanURI: string; timestamp: string; txHash: string };

export type AuditTrailData = {
  beneficiariess: { items: Beneficiary[] };
  programss: { items: Program[] };
  approvalss: { items: Approval[] };
  disbursementss: { items: Disbursement[] };
  disputess: { items: Dispute[] };
};

export const FALLBACK_AUDIT_DATA: AuditTrailData = {
  beneficiariess: {
    items: [
      { idHash: "0x11dadb1cc33f8fa1d162361197ad56faa0528dcd49f5bbcfbc877166df5d0744", registeredBy: "0xfc1A156Cd9eEadd74F0Cbab57dA08b46779efae7", btype: "Individual", status: "Verified", registeredAt: "1725860000", updatedAt: "1725860500", txHash: "0x0" },
      { idHash: "0x43ae79592721a744efb4c7cbb5e0488835b53dc475b6829e0615e643e529ac1f", registeredBy: "0xfc1A156Cd9eEadd74F0Cbab57dA08b46779efae7", btype: "Individual", status: "Verified", registeredAt: "1725860100", updatedAt: "1725860600", txHash: "0x0" },
      { idHash: "0x9ddff4fda21b48fda19a5d406df8ead0169054544d7326ec81596869c5c47e41", registeredBy: "0xfc1A156Cd9eEadd74F0Cbab57dA08b46779efae7", btype: "Individual", status: "Verified", registeredAt: "1725860200", updatedAt: "1725860700", txHash: "0x0" },
      { idHash: "0xcf566bef005aeb24167fd63d61275661164b47a0952d2ae3e0ba08ff6327a1ca", registeredBy: "0xfc1A156Cd9eEadd74F0Cbab57dA08b46779efae7", btype: "Individual", status: "Verified", registeredAt: "1725860300", updatedAt: "1725860800", txHash: "0x0" },
      { idHash: "0xdb6361c6b9e9ce57966f96f805a6b92e0f75a6b0decc342e4b92da5e748fe81d", registeredBy: "0xfc1A156Cd9eEadd74F0Cbab57dA08b46779efae7", btype: "Individual", status: "Verified", registeredAt: "1725860400", updatedAt: "1725860900", txHash: "0x0" },
      { idHash: "0xfc445fa1c8ffde2b5fc4afcc643049ca18da13689effe260408d82366c0a3b61", registeredBy: "0xfc1A156Cd9eEadd74F0Cbab57dA08b46779efae7", btype: "Individual", status: "Rejected", registeredAt: "1725860500", updatedAt: "1725861000", txHash: "0x0" },
    ],
  },
  programss: {
    items: [
      { programId: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab", dtype: "LumpSum", amountPerBeneficiary: "100000000000000000000", createdAt: "1725850000" },
    ],
  },
  approvalss: {
    items: [
      { id: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab-0x11dadb1cc33f8fa1d162361197ad56faa0528dcd49f5bbcfbc877166df5d0744", programId: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab", idHash: "0x11dadb1cc33f8fa1d162361197ad56faa0528dcd49f5bbcfbc877166df5d0744", approvedAt: "1725860500", txHash: "0x0" },
      { id: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab-0x43ae79592721a744efb4c7cbb5e0488835b53dc475b6829e0615e643e529ac1f", programId: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab", idHash: "0x43ae79592721a744efb4c7cbb5e0488835b53dc475b6829e0615e643e529ac1f", approvedAt: "1725860600", txHash: "0x0" },
      { id: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab-0x9ddff4fda21b48fda19a5d406df8ead0169054544d7326ec81596869c5c47e41", programId: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab", idHash: "0x9ddff4fda21b48fda19a5d406df8ead0169054544d7326ec81596869c5c47e41", approvedAt: "1725860700", txHash: "0x0" },
      { id: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab-0xcf566bef005aeb24167fd63d61275661164b47a0952d2ae3e0ba08ff6327a1ca", programId: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab", idHash: "0xcf566bef005aeb24167fd63d61275661164b47a0952d2ae3e0ba08ff6327a1ca", approvedAt: "1725860800", txHash: "0x0" },
      { id: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab-0xdb6361c6b9e9ce57966f96f805a6b92e0f75a6b0decc342e4b92da5e748fe81d", programId: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab", idHash: "0xdb6361c6b9e9ce57966f96f805a6b92e0f75a6b0decc342e4b92da5e748fe81d", approvedAt: "1725860900", txHash: "0x0" },
    ],
  },
  disbursementss: {
    items: [
      { id: "disb-0x11dadb1cc33f8fa1d162361197ad56faa0528dcd49f5bbcfbc877166df5d0744", programId: "0xb34b13363632b775bf627be8a9d2f1cd420163080d4f36fdcef12771c1d350ab", idHash: "0x11dadb1cc33f8fa1d162361197ad56faa0528dcd49f5bbcfbc877166df5d0744", amount: "100000000000000000000", timestamp: "1725947160", txHash: "0x0" },
    ],
  },
  disputess: { items: [] },
};

export type IndexerSource = "live" | "fallback";

export type FetchResult = {
  data: AuditTrailData;
  source: IndexerSource;
};

export async function fetchAuditTrail(): Promise<FetchResult> {
  try {
    const data = await ponderClient.request<AuditTrailData>(AUDIT_TRAIL_QUERY);
    return { data, source: "live" };
  } catch (err) {
    console.warn("Ponder indexer offline/unreachable, fallback ke snapshot data on-chain:", err);
    return { data: FALLBACK_AUDIT_DATA, source: "fallback" };
  }
}
