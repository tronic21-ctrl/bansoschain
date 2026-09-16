import { onchainTable } from "ponder";

export const beneficiaries = onchainTable("beneficiaries", (t) => ({
  idHash: t.hex().primaryKey(),
  registeredBy: t.hex().notNull(),
  btype: t.text().notNull(),
  status: t.text().notNull(),
  registeredAt: t.bigint().notNull(),
  updatedAt: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const programs = onchainTable("programs", (t) => ({
  programId: t.hex().primaryKey(),
  dtype: t.text().notNull(),
  amountPerBeneficiary: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
}));

export const approvals = onchainTable("approvals", (t) => ({
  id: t.text().primaryKey(),
  programId: t.hex().notNull(),
  idHash: t.hex().notNull(),
  approvedAt: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const disbursements = onchainTable("disbursements", (t) => ({
  id: t.text().primaryKey(),
  programId: t.hex().notNull(),
  idHash: t.hex().notNull(),
  amount: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const disputes = onchainTable("disputes", (t) => ({
  id: t.text().primaryKey(),
  programId: t.hex().notNull(),
  idHash: t.hex().notNull(),
  pelapor: t.hex().notNull(),
  alasanURI: t.text().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));
