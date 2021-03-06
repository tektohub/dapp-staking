// SPDX-License-Identifier: MIT
//pragma solidity >=0.4.21 <0.7.0;
//pragma solidity 0.8.9;
pragma solidity 0.8.10;

contract SimpleStorage {
  uint storedData;

  function set(uint x) public {
    storedData = x;
  }

  function get() public view returns (uint) {
    return storedData;
  }
}
