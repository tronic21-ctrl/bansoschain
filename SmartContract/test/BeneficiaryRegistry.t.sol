// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BeneficiaryRegistry} from "../src/BeneficiaryRegistry.sol";

contract BeneficiaryRegistryTest is Test {
    BeneficiaryRegistry registry;

    address owner = address(this);
    address verifier = address(0x1);
    address randomUser = address(0x2);
    address penerimaWallet = address(0x3);

    bytes32 idHash1 = keccak256("dummy-nik-1");

    function setUp() public {
        registry = new BeneficiaryRegistry();
        registry.tambahVerifier(verifier);
    }

    // ===== Jalur sukses =====

    function test_UsulkanPenerima_Berhasil() public {
        vm.prank(verifier);
        registry.usulkanPenerima(
            idHash1,
            penerimaWallet,
            BeneficiaryRegistry.BeneficiaryType.Individual,
            "ipfs://dummy-metadata"
        );

        (, address wallet, , , , , address registeredBy) = registry.beneficiaries(idHash1);
        assertEq(wallet, penerimaWallet);
        assertEq(registeredBy, verifier); // pastikan proposedBy otomatis dari msg.sender
    }

    function test_IsEligible_SetelahVerified() public {
        vm.startPrank(verifier);
        registry.usulkanPenerima(idHash1, penerimaWallet, BeneficiaryRegistry.BeneficiaryType.Individual, "");
        registry.perbaruiStatus(idHash1, BeneficiaryRegistry.BeneficiaryStatus.Verified);
        vm.stopPrank();

        assertTrue(registry.isEligible(idHash1));
    }

    // ===== Jalur revert — WAJIB ada, ini pelajaran Sesi 2-4 =====

    function test_RevertJika_BukanVerifier() public {
        vm.prank(randomUser);
        vm.expectRevert(BeneficiaryRegistry.BukanVerifier.selector);
        registry.usulkanPenerima(idHash1, penerimaWallet, BeneficiaryRegistry.BeneficiaryType.Individual, "");
    }

    function test_RevertJika_PenerimaSudahTerdaftar() public {
        vm.startPrank(verifier);
        registry.usulkanPenerima(idHash1, penerimaWallet, BeneficiaryRegistry.BeneficiaryType.Individual, "");

        vm.expectRevert(BeneficiaryRegistry.PenerimaSudahTerdaftar.selector);
        registry.usulkanPenerima(idHash1, penerimaWallet, BeneficiaryRegistry.BeneficiaryType.Individual, "");
        vm.stopPrank();
    }

    function test_RevertJika_PenerimaTidakDitemukan() public {
        vm.prank(verifier);
        vm.expectRevert(BeneficiaryRegistry.PenerimaTidakDitemukan.selector);
        registry.perbaruiStatus(idHash1, BeneficiaryRegistry.BeneficiaryStatus.Verified);
    }

    function test_WalletOf_MengembalikanAlamatBenar() public {
    vm.prank(verifier);
    registry.usulkanPenerima(idHash1, penerimaWallet, BeneficiaryRegistry.BeneficiaryType.Individual, "");

    assertEq(registry.walletOf(idHash1), penerimaWallet);
    }

    function test_RevertJika_BukanVerifier_SaatPerbaruiStatus() public {
    vm.prank(randomUser);
    vm.expectRevert(BeneficiaryRegistry.BukanVerifier.selector);
    registry.perbaruiStatus(idHash1, BeneficiaryRegistry.BeneficiaryStatus.Verified);
    }
}