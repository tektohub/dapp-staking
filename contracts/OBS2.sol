// OBS2.sol
// SPDX-License-Identifier: MIT
//pragma solidity 0.8.9;
pragma solidity 0.8.10;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract OBS2 is ERC20 {
    constructor(uint256 initialSupply) public ERC20("Token OBS 2", "OBS2") {
        _mint(msg.sender, initialSupply);
    }
}

//OBS
//stkOBS