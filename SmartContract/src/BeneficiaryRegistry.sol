// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title BeneficiaryRegistry
/// @notice Daftar penerima bansos terverifikasi — mendukung individu maupun kelompok/lembaga
contract BeneficiaryRegistry is Ownable {
    enum BeneficiaryType { Individual, Group }
    enum BeneficiaryStatus { Pending, Verified, Rejected, Suspended }

    struct Beneficiary {
        bytes32 idHash;          // hash NIK/nomor legal kelompok — bukan data mentah
        address wallet;          // penerima dana; untuk Group, wallet perwakilan
        BeneficiaryType btype;
        BeneficiaryStatus status;
        string metadataURI;      // pointer nama/wilayah/kategori (proofURI, MVP: string biasa)
        uint256 registeredAt;
        address registeredBy;    // otomatis msg.sender — ini "proposedBy" (lihat Framework v1.10/v1.11)
    }

    mapping(bytes32 => Beneficiary) public beneficiaries;
    mapping(address => bool) public isVerifier;

    error BukanVerifier();
    error PenerimaSudahTerdaftar();
    error PenerimaTidakDitemukan();

    event VerifierDitambahkan(address indexed verifier);
    event PenerimaDiusulkan(bytes32 indexed idHash, address indexed registeredBy, BeneficiaryType btype);
    event StatusDiperbarui(bytes32 indexed idHash, BeneficiaryStatus status);

    constructor() Ownable(msg.sender) {}

    modifier onlyVerifier() {
        if (!isVerifier[msg.sender]) revert BukanVerifier();
        _;
    }

    /// @notice Owner menambahkan wallet verifikator (simulasi Dinas Sosial)
    function tambahVerifier(address verifier) external onlyOwner {
        isVerifier[verifier] = true;
        emit VerifierDitambahkan(verifier);
    }

    /// @notice Verifikator mengusulkan penerima baru — registeredBy otomatis dari msg.sender
    function usulkanPenerima(
        bytes32 idHash,
        address wallet,
        BeneficiaryType btype,
        string calldata metadataURI
    ) external onlyVerifier {
        if (beneficiaries[idHash].registeredAt != 0) revert PenerimaSudahTerdaftar();

        beneficiaries[idHash] = Beneficiary({
            idHash: idHash,
            wallet: wallet,
            btype: btype,
            status: BeneficiaryStatus.Pending,
            metadataURI: metadataURI,
            registeredAt: block.timestamp,
            registeredBy: msg.sender
        });

        emit PenerimaDiusulkan(idHash, msg.sender, btype);
    }

    /// @notice Dipanggil AI verify service (lewat wallet relayer) setelah baca bukti kelayakan
    function perbaruiStatus(bytes32 idHash, BeneficiaryStatus status) external onlyVerifier {
        if (beneficiaries[idHash].registeredAt == 0) revert PenerimaTidakDitemukan();
        beneficiaries[idHash].status = status;
        emit StatusDiperbarui(idHash, status);
    }

    /// @notice View function publik — dipanggil DisbursementPool sebelum cair
    function isEligible(bytes32 idHash) external view returns (bool) {
        return beneficiaries[idHash].status == BeneficiaryStatus.Verified;
    }

    function walletOf(bytes32 idHash) external view returns (address) {
        return beneficiaries[idHash].wallet;
    }
}