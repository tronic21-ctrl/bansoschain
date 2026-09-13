import { GraphQLClient, gql } from "graphql-request";
import { PONDER_GRAPHQL_URL } from "../config";

const client = new GraphQLClient(PONDER_GRAPHQL_URL + "/");

const PENDING_QUERY = gql`
  query {
    beneficiariess(where: { status: "Pending" }) {
      items {
        idHash
      }
    }
  }
`;

export async function getPendingBeneficiaries(): Promise<`0x${string}`[]> {
  const data = await client.request<{
    beneficiariess: { items: { idHash: string }[] };
  }>(PENDING_QUERY);
  return data.beneficiariess.items.map((b) => b.idHash as `0x${string}`);
}
