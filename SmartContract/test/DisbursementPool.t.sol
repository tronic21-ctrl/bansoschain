// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BeneficiaryRegistry} from "../src/BeneficiaryRegistry.sol";
import {DisbursementPool} from "../src/DisbursementPool.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract DisbursementPoolTest is Test {
    BeneficiaryRegistry registry;
    DisbursementPool pool;
    MockERC20 token;

    address verifier = address(0x1);
    address penerimaWallet = address(0x3);

    bytes32 idHash1 = keccak256("dummy-nik-1");
    bytes32 programLumpSum = keccak256("PROGRAM_LUMPSUM");
    bytes32 programPeriodic = keccak256("PROGRAM_PERIODIC");

    uint256 constant AMOUNT = 1000 ether;
    uint256 constant CAP = 10_000 ether;
    uint256 constant MAX_TX = 1000 ether;
    uint256 constant PERIOD = 30 days;

    function setUp() public {
        vm.warp(1_800_000_000); // paksa waktu realistis, hindari efek "timestamp mendekati nol" di Foundry

        registry = new BeneficiaryRegistry();
        registry.tambahVerifier(verifier);

        vm.prank(verifier);
        registry.usulkanPenerima(idHash1, penerimaWallet, BeneficiaryRegistry.BeneficiaryType.Individual, "");
        vm.prank(verifier);
        registry.perbaruiStatus(idHash1, BeneficiaryRegistry.BeneficiaryStatus.Verified);

        pool = new DisbursementPool(address(registry));
        token = new MockERC20();
        token.transfer(address(pool), CAP);

        pool.buatProgram(programLumpSum, DisbursementPool.DisbursementType.LumpSum, AMOUNT, 0, CAP, MAX_TX, address(token));
        pool.buatProgram(programPeriodic, DisbursementPool.DisbursementType.Periodic, AMOUNT, PERIOD, CAP, MAX_TX, address(token));
    }

    // ===== Jalur sukses =====

    function test_Cairkan_Berhasil_LumpSum() public {
        pool.setujuiPencairan(programLumpSum, idHash1);
        vm.warp(block.timestamp + pool.GRACE_PERIOD() + 1);

        pool.cairkan(programLumpSum, idHash1);

        assertEq(token.balanceOf(penerimaWallet), AMOUNT);

        (
            , , , ,
            uint256 totalDisbursed,
            , ,
        ) = pool.programs(programLumpSum);
        assertEq(totalDisbursed, AMOUNT);
    }

    // ===== Jalur revert — satu per custom error =====

    function test_RevertJika_ProgramTidakAktif() public {
        bytes32 programTidakAda = keccak256("TIDAK_ADA");
        vm.expectRevert(DisbursementPool.ProgramTidakAktif.selector);
        pool.setujuiPencairan(programTidakAda, idHash1);
    }

    function test_RevertJika_BukanEligible() public {
        bytes32 idHashBelumVerified = keccak256("belum-verified");
        vm.expectRevert(DisbursementPool.BukanEligible.selector);
        pool.setujuiPencairan(programLumpSum, idHashBelumVerified);
    }

    // ===== Test baru: re-check eligibility di cairkan() =====
    function test_RevertJika_BukanEligible_SaatCairkan() public {
        pool.setujuiPencairan(programLumpSum, idHash1);
        vm.prank(verifier);
        registry.perbaruiStatus(idHash1, BeneficiaryRegistry.BeneficiaryStatus.Suspended);
        vm.warp(block.timestamp + pool.GRACE_PERIOD() + 1);
        vm.expectRevert(DisbursementPool.BukanEligible.selector);
        pool.cairkan(programLumpSum, idHash1);
    }

    // ===== Test baru: validasi periodInterval > 0 untuk Periodic =====
    function test_RevertJika_PeriodIntervalNol_UntukPeriodic() public {
        bytes32 programSalah = keccak256("PROGRAM_PERIODIC_SALAH");
        vm.expectRevert(bytes("periodInterval harus > 0 untuk Periodic"));
        pool.buatProgram(
            programSalah,
            DisbursementPool.DisbursementType.Periodic,
            AMOUNT,
            0,
            CAP,
            MAX_TX,
            address(token)
        );
    }

    function test_RevertJika_BelumDisetujui() public {
        vm.expectRevert(DisbursementPool.BelumDisetujui.selector);
        pool.cairkan(programLumpSum, idHash1);
    }

    function test_RevertJika_MasihMasaSanggah() public {
        pool.setujuiPencairan(programLumpSum, idHash1);
        vm.expectRevert(DisbursementPool.MasihMasaSanggah.selector);
        pool.cairkan(programLumpSum, idHash1);
    }

    function test_RevertJika_SudahDiklaim() public {
        pool.setujuiPencairan(programLumpSum, idHash1);
        vm.warp(block.timestamp + pool.GRACE_PERIOD() + 1);
        pool.cairkan(programLumpSum, idHash1);

        vm.expectRevert(DisbursementPool.SudahDiklaim.selector);
        pool.cairkan(programLumpSum, idHash1);
    }

    function test_RevertJika_BelumWaktunya() public {
        pool.setujuiPencairan(programPeriodic, idHash1);
        vm.warp(block.timestamp + pool.GRACE_PERIOD() + 1);
        pool.cairkan(programPeriodic, idHash1); // klaim pertama sukses

        pool.setujuiPencairan(programPeriodic, idHash1); // approve lagi
        vm.warp(block.timestamp + pool.GRACE_PERIOD() + 1); // lewat masa sanggah lagi, tapi period belum lewat

        vm.expectRevert(DisbursementPool.BelumWaktunya.selector);
        pool.cairkan(programPeriodic, idHash1);
    }

    function test_RevertJika_LewatBatasNominal() public {
        bytes32 programNominalKecil = keccak256("PROGRAM_NOMINAL_KECIL");
        pool.buatProgram(programNominalKecil, DisbursementPool.DisbursementType.LumpSum, AMOUNT, 0, CAP, 500 ether, address(token));

        pool.setujuiPencairan(programNominalKecil, idHash1);
        vm.warp(block.timestamp + pool.GRACE_PERIOD() + 1);

        vm.expectRevert(DisbursementPool.LewatBatasNominal.selector);
        pool.cairkan(programNominalKecil, idHash1);
    }

    function test_RevertJika_CapTerlampaui() public {
        bytes32 programCapKecil = keccak256("PROGRAM_CAP_KECIL");
        pool.buatProgram(programCapKecil, DisbursementPool.DisbursementType.LumpSum, AMOUNT, 0, 500 ether, MAX_TX, address(token));

        pool.setujuiPencairan(programCapKecil, idHash1);
        vm.warp(block.timestamp + pool.GRACE_PERIOD() + 1);

        vm.expectRevert(DisbursementPool.CapTerlampaui.selector);
        pool.cairkan(programCapKecil, idHash1);
    }

    function test_RevertJika_ProgramTidakAktif_SaatCairkan() public {
        bytes32 programTidakAda = keccak256("TIDAK_ADA_LAGI");
        vm.expectRevert(DisbursementPool.ProgramTidakAktif.selector);
        pool.cairkan(programTidakAda, idHash1);
    }

    function test_NonaktifkanProgram_Berhasil() public {
        pool.nonaktifkanProgram(programLumpSum);
        vm.expectRevert(DisbursementPool.ProgramTidakAktif.selector);
        pool.setujuiPencairan(programLumpSum, idHash1);
    }

    function test_RevertJika_BelumDisetujui_SaatAjukanSanggahan() public {
        vm.expectRevert(DisbursementPool.BelumDisetujui.selector);
        pool.ajukanSanggahan(programLumpSum, idHash1, "bukti-uri");
    }

    function test_AjukanSanggahan_Berhasil() public {
        pool.setujuiPencairan(programLumpSum, idHash1);
        pool.ajukanSanggahan(programLumpSum, idHash1, "bukti-uri");
    }
}