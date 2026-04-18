// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title USDTO
 * @dev Test token pegged to USD on Conflux eSpace
 *      1 USDTO = 1 USD
 */
contract USDTO is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public minters;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "USDTO: not a minter");
        _;
    }

    constructor(address initialOwner) ERC20("AxPesa USD", "USDTO") Ownable(initialOwner) {
        _transferOwnership(initialOwner);
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }
}
