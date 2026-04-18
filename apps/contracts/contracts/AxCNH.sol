// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AxCNH
 * @dev Test token pegged to Chinese Yuan (CNH) on Conflux eSpace
 *      1 AxCNH = 1 CNH (offshore RMB)
 *      
 * Owner can mint new tokens as needed for the vault
 */
contract AxCNH is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public minters;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "AxCNH: not authorized");
        _;
    }

    constructor(address initialOwner) ERC20("AxPesa CNH", "AxCNH") Ownable(initialOwner) {
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Mint new tokens
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    /**
     * @dev Add a minter (can also mint)
     */
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @dev Remove a minter
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @dev Check if address is a minter
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }
}
