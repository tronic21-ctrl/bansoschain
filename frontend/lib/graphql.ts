import { GraphQLClient, gql } from "graphql-request";

const PONDER_URL = (process.env.NEXT_PUBLIC_PONDER_GRAPHQL_URL ?? "http://localhost:42069") + "/";
export const ponderClient = new GraphQLClient(PONDER_URL);

export const AUDIT_TRAIL_QUERY = gql`
  query {
    beneficiariess {
      items { idHash registeredBy btype status registeredAt updatedAt }
    }
    programss {
      items { programId dtype amountPerBeneficiary createdAt }
    }
    approvalss {
      items { id programId idHash approvedAt }
    }
    disbursementss {
      items { id programId idHash amount timestamp }
    }
    disputess {
      items { id programId idHash pelapor alasanURI timestamp }
    }
  }
`;

type Beneficiary = { idHash: string; registeredBy: string; btype: string; status: string; registeredAt: string; updatedAt: string };
type Program = { programId: string; dtype: string; amountPerBeneficiary: string; createdAt: string };
type Approval = { id: string; programId: string; idHash: string; approvedAt: string };
type Disbursement = { id: string; programId: string; idHash: string; amount: string; timestamp: string };
type Dispute = { id: string; programId: string; idHash: string; pelapor: string; alasanURI: string; timestamp: string };

export type AuditTrailData = {
  beneficiariess: { items: Beneficiary[] };
  programss: { items: Program[] };
  approvalss: { items: Approval[] };
  disbursementss: { items: Disbursement[] };
  disputess: { items: Dispute[] };
};

export async function fetchAuditTrail(): Promise<AuditTrailData> {
  return ponderClient.request<AuditTrailData>(AUDIT_TRAIL_QUERY);
}
