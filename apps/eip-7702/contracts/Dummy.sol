// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Dummy {
    uint256 public value;
    function setValue(uint256 _value) external {
        value = _value;
    }
    // Allow the contract to receive ETH (e.g. from DEX swaps or other transfers).
    fallback() external payable {}
    receive() external payable {}
} 