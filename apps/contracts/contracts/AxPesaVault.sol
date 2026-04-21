// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AxPesaVault
 * @dev Simplified Vault for handling token withdrawals
 * 
 * ARCHITECTURE:
 * - Owner (deployer): Can call withdraw() to send tokens to users
 * - Users: Receive tokens via withdraw() when they buy
 * 
 * SIMPLIFIED MODEL:
 * - All tokens in vault are available for withdrawal
 * - No liquidity pool, no locking
 * - Direct transfers from vault to users
 */
contract AxPesaVault is Ownable {
    using SafeERC20 for IERC20;

    // Token this vault holds
    IERC20 public token;
    string public tokenName;
    
    // Events
    event Withdrawn(address indexed user, uint256 amount);
    event TokenWithdrawn(address indexed to, uint256 amount);

    /**
     * @dev Constructor
     * @param _token Address of the ERC20 token this vault holds
     * @param _owner Owner address (deployer - can call withdraw)
     * @param _tokenName Human-readable name for the token
     */
    constructor(
        address _token,
        address _owner,
        string memory _tokenName
    ) Ownable(_owner) {
        require(_token != address(0), "AxPesaVault: zero token address");
        require(_owner != address(0), "AxPesaVault: zero owner address");
        
        token = IERC20(_token);
        tokenName = _tokenName;
    }

    // Allow contract to receive CFX for gas fees
    receive() external payable {}

    // =========================================================================
    // WITHDRAW FUNCTIONS
    // =========================================================================

    /**
     * @dev Withdraw tokens to user (BUY flow)
     * @dev ONLY owner (deployer) can call this after payment is confirmed
     * @param user Address to send tokens to
     * @param amount Amount of tokens to withdraw
     */
    function withdraw(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "AxPesaVault: zero user address");
        require(amount > 0, "AxPesaVault: zero amount");
        require(token.balanceOf(address(this)) >= amount, "AxPesaVault: insufficient balance");
        
        // Transfer from vault to user
        token.safeTransfer(user, amount);
        
        emit Withdrawn(user, amount);
    }

    /**
     * @dev Batch withdraw (for efficiency)
     */
    function batchWithdraw(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(users.length == amounts.length, "AxPesaVault: length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(token.balanceOf(address(this)) >= totalAmount, "AxPesaVault: insufficient balance");
        
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "AxPesaVault: zero address");
            token.safeTransfer(users[i], amounts[i]);
            emit Withdrawn(users[i], amounts[i]);
        }
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    /**
     * @dev Get vault token balance
     */
    function getVaultBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @dev Check if address is owner
     */
    function isOwner(address _address) external view returns (bool) {
        return _address == owner();
    }

    // =========================================================================
    // EMERGENCY FUNCTIONS
    // =========================================================================

    /**
     * @dev Recover accidentally sent tokens (not the vault token)
     */
    function recoverToken(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(token), "AxPesaVault: cannot recover vault token");
        IERC20(tokenAddress).safeTransfer(owner(), amount);
    }

    /**
     * @dev Withdraw all remaining tokens to owner (emergency)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "AxPesaVault: nothing to withdraw");
        
        token.safeTransfer(owner(), balance);
        emit TokenWithdrawn(owner(), balance);
    }

    /**
     * @dev Withdraw CFX balance to owner (for gas fees)
     */
    function withdrawCFX() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
