import type { AuditTrailData } from "./graphql";

export type DisplayStatus =
  | "menunggu_verifikasi"
  | "ditolak"
  | "disetujui_masa_sanggah"
  | "siap_cair"
  | "dicairkan";

export type DisputeRecord = {
  pelapor: string;
  alasanURI: string;
  timestamp: number;
  txHash: string;
};

export type AuditRow = {
  idHash: `0x${string}`;
  programId: `0x${string}` | null;
  registeredBy: string;
  status: DisplayStatus;
  amountPerBeneficiary: string | null;
  registeredTxHash: string;
  approvedAt: number | null;
  approvedTxHash: string | null;
  disbursedAt: number | null;
  disbursedTxHash: string | null;
  disputes: DisputeRecord[];
};

const GRACE_PERIOD_SECONDS = 24 * 60 * 60;

export function buildAuditRows(data: AuditTrailData): AuditRow[] {
  const programById = new Map(data.programss.items.map((p) => [p.programId, p]));
  const approvalByIdHash = new Map(data.approvalss.items.map((a) => [a.idHash, a]));
  const disbursementByIdHash = new Map(data.disbursementss.items.map((d) => [d.idHash, d]));

  const disputesByIdHash = new Map<string, DisputeRecord[]>();
  for (const d of data.disputess.items) {
    const list = disputesByIdHash.get(d.idHash) ?? [];
    list.push({ pelapor: d.pelapor, alasanURI: d.alasanURI, timestamp: Number(d.timestamp), txHash: d.txHash });
    disputesByIdHash.set(d.idHash, list);
  }

  const now = Math.floor(Date.now() / 1000);

  return data.beneficiariess.items.map((b) => {
    const approval = approvalByIdHash.get(b.idHash);
    const disbursement = disbursementByIdHash.get(b.idHash);
    const program = approval ? programById.get(approval.programId) : undefined;

    let status: DisplayStatus = "menunggu_verifikasi";
    if (b.status === "Rejected") {
      status = "ditolak";
    } else if (disbursement) {
      status = "dicairkan";
    } else if (approval) {
      status = now - Number(approval.approvedAt) >= GRACE_PERIOD_SECONDS ? "siap_cair" : "disetujui_masa_sanggah";
    }

    return {
      idHash: b.idHash as `0x${string}`,
      programId: (approval?.programId ?? null) as `0x${string}` | null,
      registeredBy: b.registeredBy,
      status,
      amountPerBeneficiary: program?.amountPerBeneficiary ?? null,
      registeredTxHash: b.txHash,
      approvedAt: approval ? Number(approval.approvedAt) : null,
      approvedTxHash: approval?.txHash ?? null,
      disbursedAt: disbursement ? Number(disbursement.timestamp) : null,
      disbursedTxHash: disbursement?.txHash ?? null,
      disputes: disputesByIdHash.get(b.idHash) ?? [],
    };
  });
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  menunggu_verifikasi: "Menunggu Verifikasi",
  ditolak: "Ditolak",
  disetujui_masa_sanggah: "Disetujui — Masa Sanggah",
  siap_cair: "Siap Dicairkan",
  dicairkan: "Dicairkan",
};

export const STATUS_COLOR: Record<DisplayStatus, string> = {
  menunggu_verifikasi: "text-foreground/50",
  ditolak: "text-accent-rejected",
  disetujui_masa_sanggah: "text-foreground/70",
  siap_cair: "text-accent-verified",
  dicairkan: "text-accent-verified",
};
