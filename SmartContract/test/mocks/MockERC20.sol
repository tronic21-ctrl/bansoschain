// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Token dummy khusus testing — bukan untuk deploy production
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Dana Bansos", "mDANA") {
        _mint(msg.sender, 1_000_000 ether);
    }
}