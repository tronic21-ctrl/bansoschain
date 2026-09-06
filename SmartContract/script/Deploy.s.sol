// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BeneficiaryRegistry} from "../src/BeneficiaryRegistry.sol";
import {DisbursementPool} from "../src/DisbursementPool.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy BeneficiaryRegistry
        BeneficiaryRegistry registry = new BeneficiaryRegistry();
        console.log("BeneficiaryRegistry deployed at:", address(registry));

        // 2. Jadikan deployer sebagai verifier (simulasi Dinas Sosial)
        //    supaya bisa langsung test usulkanPenerima dkk. setelah deploy
        registry.tambahVerifier(deployer);
        console.log("Deployer added as verifier:", deployer);

        // 3. Deploy DisbursementPool, hubungkan ke registry
        DisbursementPool pool = new DisbursementPool(address(registry));
        console.log("DisbursementPool deployed at:", address(pool));

        vm.stopBroadcast();
    }
}
