import { readFileSync } from "node:fs";

type Application = {
  idHash: `0x${string}`;
  programId: `0x${string}`;
  metadataURI: string;
};

const applications: Application[] = JSON.parse(
  readFileSync(new URL("../../data/dummy-applications.json", import.meta.url), "utf-8")
);

export function findApplication(idHash: string) {
  return applications.find((a) => a.idHash.toLowerCase() === idHash.toLowerCase());
}
