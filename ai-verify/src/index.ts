import "dotenv/config";
import { POLL_INTERVAL_MS, DEFAULT_PROGRAM_ID } from "./config";
import { getPendingBeneficiaries } from "./services/watcher";
import { getBeneficiary, setBeneficiaryStatus, approveDisbursement } from "./services/onchain";
import { judgeProof } from "./domain/judge";
import { BeneficiaryStatus } from "./domain/abi";

let isRunning = false;

async function processOne(idHash: `0x${string}`) {
  const onchain = await getBeneficiary(idHash);

  // Guard utama: cek status ASLI langsung dari kontrak, bukan dari Ponder.
  // Ponder bisa lag beberapa detik di belakang chain tip — kalau kita percaya
  // status dari indexer buat keputusan ini, race condition-nya bisa bikin
  // perbaruiStatus()/setujuiPencairan() kepanggil berkali-kali buat idHash yang sama.
  if (onchain.status !== BeneficiaryStatus.Pending) {
    console.log(`[skip] ${idHash} — status on-chain udah bukan Pending (${onchain.status}), kemungkinan indexer lagi lag di belakang`);
    return;
  }

  if (!onchain.metadataURI) {
    console.warn(`[skip] ${idHash} — metadataURI kosong di on-chain, gak ada bukti buat dinilai`);
    return;
  }

  console.log(`[proses] ${idHash} — wallet ${onchain.wallet}, program ${DEFAULT_PROGRAM_ID}`);

  const verdict = await judgeProof(onchain.metadataURI);
  console.log(`[verdict] ${idHash} eligible=${verdict.eligible} confidence=${verdict.confidence}`);
  if (verdict.flagged_concerns.length > 0) {
    console.log(`[flagged] ${idHash}:`, verdict.flagged_concerns);
  }

  await setBeneficiaryStatus(idHash, verdict.eligible);
  if (verdict.eligible) {
    await approveDisbursement(DEFAULT_PROGRAM_ID, idHash);
  }
}

async function loop() {
  if (isRunning) return;
  isRunning = true;
  try {
    const pending = await getPendingBeneficiaries();
    for (const idHash of pending) {
      try {
        await processOne(idHash);
      } catch (err) {
        console.error(`[error] ${idHash}:`, err);
      }
    }
  } catch (err) {
    console.error("[loop error]", err);
  } finally {
    isRunning = false;
  }
}

console.log(`AI Verify Service jalan, poll tiap ${POLL_INTERVAL_MS}ms`);
loop();
setInterval(loop, POLL_INTERVAL_MS);
