import { ponder } from "ponder:registry";
import { beneficiaries, programs, approvals, disbursements, disputes } from "ponder:schema";

ponder.on("BeneficiaryRegistry:PenerimaDiusulkan", async ({ event, context }) => {
  await context.db.insert(beneficiaries).values({
    idHash: event.args.idHash,
    registeredBy: event.args.registeredBy,
    btype: event.args.btype === 0 ? "Individual" : "Group",
    status: "Pending",
    registeredAt: event.block.timestamp,
    updatedAt: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});

ponder.on("BeneficiaryRegistry:StatusDiperbarui", async ({ event, context }) => {
  const statusMap = ["Pending", "Verified", "Rejected", "Suspended"];
  await context.db
    .update(beneficiaries, { idHash: event.args.idHash })
    .set({
      status: statusMap[event.args.status],
      updatedAt: event.block.timestamp,
    });
});

ponder.on("DisbursementPool:ProgramDibuat", async ({ event, context }) => {
  await context.db.insert(programs).values({
    programId: event.args.programId,
    dtype: event.args.dtype === 0 ? "LumpSum" : "Periodic",
    amountPerBeneficiary: event.args.amountPerBeneficiary,
    createdAt: event.block.timestamp,
  });
});

ponder.on("DisbursementPool:PencairanDisetujui", async ({ event, context }) => {
  try {
    await context.db.insert(approvals).values({
      id: `${event.args.programId}-${event.args.idHash}`,
      programId: event.args.programId,
      idHash: event.args.idHash,
      approvedAt: event.args.approvedAt,
      txHash: event.transaction.hash,
    });
  } catch (err: any) {
    // approval berulang buat pasangan programId+idHash yang sama —
    // sisa dari bug lama ai-verify (udah difix), bukan error baru.
    // Event kedua dst di-skip, bukan bikin indexer crash.
    const msg = String(err.message || "").toLowerCase();
    if (!msg.includes("unique constraint") && !msg.includes("duplicate key") && err.code !== "23505") {
      throw err;
    }
  }
});

ponder.on("DisbursementPool:DanaDicairkan", async ({ event, context }) => {
  await context.db.insert(disbursements).values({
    id: `${event.log.id}`,
    programId: event.args.programId,
    idHash: event.args.idHash,
    amount: event.args.amount,
    timestamp: event.args.timestamp,
    txHash: event.transaction.hash,
  });
});

ponder.on("DisbursementPool:SanggahanDiajukan", async ({ event, context }) => {
  await context.db.insert(disputes).values({
    id: `${event.log.id}`,
    programId: event.args.programId,
    idHash: event.args.idHash,
    pelapor: event.args.pelapor,
    alasanURI: event.args.alasanURI,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});
