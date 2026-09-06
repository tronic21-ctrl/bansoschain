// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BeneficiaryRegistry} from "./BeneficiaryRegistry.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title DisbursementPool
/// @notice Menampung dana & mencairkan ke penerima terverifikasi, dengan masa sanggah + cap nominal
contract DisbursementPool is Ownable2Step {
    enum DisbursementType { LumpSum, Periodic }

    struct Program {
        DisbursementType dtype;
        uint256 amountPerBeneficiary;
        uint256 periodInterval;   // 0 untuk LumpSum
        uint256 totalCap;
        uint256 totalDisbursed;
        uint256 maxPerTransaction;
        address token;
        bool active;
    }

    BeneficiaryRegistry public immutable registry;
    using SafeERC20 for IERC20;
    uint256 public constant GRACE_PERIOD = 24 hours;

    mapping(bytes32 => Program) public programs;               // programId => Program
    mapping(bytes32 => mapping(bytes32 => uint256)) public lastClaimedAt;   // programId => idHash => timestamp
    mapping(bytes32 => mapping(bytes32 => uint256)) public approvedAt;      // programId => idHash => timestamp verdict AI

    error ProgramTidakAktif();
    error BukanEligible();
    error BelumWaktunya();
    error SudahDiklaim();
    error CapTerlampaui();
    error MasihMasaSanggah();
    error LewatBatasNominal();
    error BelumDisetujui();

    event ProgramDibuat(bytes32 indexed programId, DisbursementType dtype, uint256 amountPerBeneficiary);
    event PencairanDisetujui(bytes32 indexed programId, bytes32 indexed idHash, uint256 approvedAt);
    event DanaDicairkan(bytes32 indexed programId, bytes32 indexed idHash, uint256 amount, uint256 timestamp);
    event SanggahanDiajukan(bytes32 indexed programId, bytes32 indexed idHash, address indexed pelapor, string alasanURI);

    constructor(address registryAddress) Ownable(msg.sender) {
        registry = BeneficiaryRegistry(registryAddress);
    }

    function buatProgram(
        bytes32 programId,
        DisbursementType dtype,
        uint256 amountPerBeneficiary,
        uint256 periodInterval,
        uint256 totalCap,
        uint256 maxPerTransaction,
        address token
    ) external onlyOwner {
        if (dtype == DisbursementType.Periodic) {
            require(periodInterval > 0, "periodInterval harus > 0 untuk Periodic");
        }
        programs[programId] = Program({
            dtype: dtype,
            amountPerBeneficiary: amountPerBeneficiary,
            periodInterval: periodInterval,
            totalCap: totalCap,
            totalDisbursed: 0,
            maxPerTransaction: maxPerTransaction,
            token: token,
            active: true
        });
        emit ProgramDibuat(programId, dtype, amountPerBeneficiary);
    }

    /// @notice Kill switch darurat per-program — dipanggil kalau ada kesalahan konfigurasi fatal
    function nonaktifkanProgram(bytes32 programId) external onlyOwner {
        programs[programId].active = false;
    }

    /// @notice Dipanggil AI verify service (via wallet relayer) setelah verdict ELIGIBLE — MULAI masa sanggah
    function setujuiPencairan(bytes32 programId, bytes32 idHash) external onlyOwner {
        Program storage prog = programs[programId];
        if (!prog.active) revert ProgramTidakAktif();
        if (!registry.isEligible(idHash)) revert BukanEligible();

        approvedAt[programId][idHash] = block.timestamp;
        emit PencairanDisetujui(programId, idHash, block.timestamp);
    }

    /// @notice Dipanggil setelah GRACE_PERIOD lewat — di sinilah dana beneran berpindah
    function cairkan(bytes32 programId, bytes32 idHash) external {
        Program storage prog = programs[programId];

        // CHECKS
        if (!prog.active) revert ProgramTidakAktif();
        if (!registry.isEligible(idHash)) revert BukanEligible();
        if (approvedAt[programId][idHash] == 0) revert BelumDisetujui();
        if (block.timestamp < approvedAt[programId][idHash] + GRACE_PERIOD) revert MasihMasaSanggah();

        if (prog.dtype == DisbursementType.Periodic) {
            if (block.timestamp < lastClaimedAt[programId][idHash] + prog.periodInterval) revert BelumWaktunya();
        } else {
            if (lastClaimedAt[programId][idHash] != 0) revert SudahDiklaim();
        }

        if (prog.amountPerBeneficiary > prog.maxPerTransaction) revert LewatBatasNominal();
        if (prog.totalDisbursed + prog.amountPerBeneficiary > prog.totalCap) revert CapTerlampaui();

        // EFFECTS
        lastClaimedAt[programId][idHash] = block.timestamp;
        prog.totalDisbursed += prog.amountPerBeneficiary;

        // INTERACTIONS
        address penerima = registry.walletOf(idHash);
        IERC20(prog.token).safeTransfer(penerima, prog.amountPerBeneficiary);

        emit DanaDicairkan(programId, idHash, prog.amountPerBeneficiary, block.timestamp);
    }

    /// @notice Siapa saja bisa lapor kecurigaan selama masa sanggah — cuma emit event, tidak block pencairan otomatis
    function ajukanSanggahan(bytes32 programId, bytes32 idHash, string calldata alasanURI) external {
        if (approvedAt[programId][idHash] == 0) revert BelumDisetujui();
        emit SanggahanDiajukan(programId, idHash, msg.sender, alasanURI);
    }
}