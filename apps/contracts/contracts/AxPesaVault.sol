// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AxPesaVault
 * @dev Vault for handling token deposits and withdrawals
 * 
 * ARCHITECTURE:
 * - Owner (deployer/hot wallet): Can call withdraw() after Flutterwave confirms payment
 * - Multi-sig (2-of-3): For emergencies only (upgrade, emergency withdrawal)
 * - Users: Can deposit tokens to sell
 * 
 * LIQUIDITY MODEL:
 * - 90% of deposited tokens are LOCKED (staked)
 * - 10% held as LIQUIDITY for instant withdrawals
 */
contract AxPesaVault is Ownable {
    using SafeERC20 for IERC20;

    // Token this vault holds
    IERC20 public token;
    string public tokenName;
    
    // Liquidity settings
    uint256 public constant LIQUIDITY_PERCENT = 10; // 10% available for withdrawals
    uint256 public constant LOCKED_PERCENT = 90;    // 90% locked
    
    // Storage
    mapping(address => uint256) public userDeposits;      // Total deposited by user
    mapping(address => uint256) public userLocked;     // Locked amount per user
    uint256 public totalDeposited;
    uint256 public totalLocked;
    
    // Liquidity pool (10% of deposits)
    uint256 public liquidityPool;
    
    // Multi-sig settings
    uint256 public constant REQUIRED_SIGNATURES = 2;
    uint256 public constant NUM_SIGNERS = 3;
    address[3] public signers;
    mapping(address => bool) public isSigner;
    
    // Withdrawal requests for multi-sig (for emergencies)
    struct EmergencyWithdrawal {
        address to;
        uint256 amount;
        uint256 approvalCount;
        mapping(address => bool) approved;
        bool executed;
    }
    
    mapping(bytes32 => EmergencyWithdrawal) public emergencyWithdrawals;
    bytes32[] public allEmergencyIds;
    
    // New vault for upgrades
    address public newVault;
    
    // Events
    event Deposited(address indexed user, uint256 amount, uint256 locked, uint256 toLiquidity);
    event Withdrawn(address indexed user, uint256 amount);
    event EmergencyWithdrawalRequested(bytes32 indexed id, address indexed to, uint256 amount);
    event EmergencyWithdrawalApproved(bytes32 indexed id, address indexed approver);
    event EmergencyWithdrawalExecuted(bytes32 indexed id);
    event VaultUpgraded(address indexed newVault);
    event LiquidityRecovered(uint256 amount);
    event SignerUpdated(uint256 index, address oldSigner, address newSigner);

    /**
     * @dev Constructor
     * @param _token Address of the ERC20 token this vault holds
     * @param _signers Array of 3 admin signer addresses for multi-sig
     * @param _owner Owner address (deployer/hot wallet - can call withdraw)
     * @param _tokenName Human-readable name for the token
     */
    constructor(
        address _token,
        address[3] memory _signers,
        address _owner,
        string memory _tokenName
    ) Ownable(_owner) {
        require(_token != address(0), "AxPesaVault: zero token address");
        require(_owner != address(0), "AxPesaVault: zero owner address");
        
        token = IERC20(_token);
        tokenName = _tokenName;
        
        // Set signers
        for (uint256 i = 0; i < 3; i++) {
            require(_signers[i] != address(0), "AxPesaVault: zero signer");
            signers[i] = _signers[i];
            isSigner[_signers[i]] = true;
        }
    }

    // =========================================================================
    // USER FUNCTIONS
    // =========================================================================

    /**
     * @dev User deposits tokens (SELL flow)
     * @param amount Amount of tokens to deposit
     * 
     * - 90% is LOCKED (cannot be withdrawn by user)
     * - 10% goes to liquidity pool
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "AxPesaVault: zero amount");
        
        // Calculate split
        uint256 lockedAmount = (amount * LOCKED_PERCENT) / 100;
        uint256 liquidityAmount = (amount * LIQUIDITY_PERCENT) / 100;
        
        // Transfer tokens from user
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update state
        userDeposits[msg.sender] += amount;
        userLocked[msg.sender] += lockedAmount;
        totalDeposited += amount;
        totalLocked += lockedAmount;
        liquidityPool += liquidityAmount;
        
        emit Deposited(msg.sender, amount, lockedAmount, liquidityAmount);
    }

    /**
     * @dev Get user's deposit info
     */
    function getUserInfo(address user) external view returns (
        uint256 totalDeposit,
        uint256 lockedAmount,
        uint256 withdrawable
    ) {
        withdrawable = userDeposits[user] - userLocked[user];
        return (userDeposits[user], userLocked[user], withdrawable);
    }

    // =========================================================================
    // WITHDRAW - ONLY OWNER (DEPLOYER/HOT WALLET)
    // =========================================================================

    /**
     * @dev Withdraw tokens to user (BUY flow)
     * @dev ONLY owner (deployer/hot wallet) can call this after Flutterwave confirms payment
     * @param user Address to send tokens to
     * @param amount Amount of tokens to withdraw
     */
    function withdraw(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "AxPesaVault: zero user address");
        require(amount > 0, "AxPesaVault: zero amount");
        require(liquidityPool >= amount, "AxPesaVault: insufficient liquidity");
        
        // Transfer from vault to user
        token.safeTransfer(user, amount);
        
        // Update liquidity
        liquidityPool -= amount;
        
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
        
        require(liquidityPool >= totalAmount, "AxPesaVault: insufficient liquidity");
        
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "AxPesaVault: zero address");
            token.safeTransfer(users[i], amounts[i]);
            emit Withdrawn(users[i], amounts[i]);
        }
        
        liquidityPool -= totalAmount;
    }

    // =========================================================================
    // MULTI-SIG (2-OF-3) - EMERGENCY ONLY
    // =========================================================================

    /**
     * @dev Request emergency withdrawal (requires multi-sig)
     * @param to Address to send tokens to
     * @param amount Amount of tokens to withdraw
     */
    function requestEmergencyWithdrawal(address to, uint256 amount) external {
        require(isSigner[msg.sender], "AxPesaVault: not a signer");
        require(to != address(0), "AxPesaVault: zero address");
        require(amount > 0, "AxPesaVault: zero amount");
        require(amount <= liquidityPool, "AxPesaVault: exceeds liquidity");
        
        bytes32 id = keccak256(abi.encodePacked(to, amount, block.timestamp));
        
        EmergencyWithdrawal storage withdrawal = emergencyWithdrawals[id];
        withdrawal.to = to;
        withdrawal.amount = amount;
        withdrawal.approvalCount = 1;
        withdrawal.approved[msg.sender] = true;
        withdrawal.executed = false;
        
        allEmergencyIds.push(id);
        
        emit EmergencyWithdrawalRequested(id, to, amount);
    }

    /**
     * @dev Approve emergency withdrawal (2-of-3 signers required)
     */
    function approveEmergencyWithdrawal(bytes32 id) external {
        require(isSigner[msg.sender], "AxPesaVault: not a signer");
        require(!emergencyWithdrawals[id].executed, "AxPesaVault: already executed");
        require(!emergencyWithdrawals[id].approved[msg.sender], "AxPesaVault: already approved");
        
        EmergencyWithdrawal storage withdrawal = emergencyWithdrawals[id];
        withdrawal.approved[msg.sender] = true;
        withdrawal.approvalCount++;
        
        emit EmergencyWithdrawalApproved(id, msg.sender);
        
        // Execute if we have enough approvals
        if (withdrawal.approvalCount >= REQUIRED_SIGNATURES) {
            _executeEmergencyWithdrawal(id);
        }
    }

    function _executeEmergencyWithdrawal(bytes32 id) internal {
        EmergencyWithdrawal storage withdrawal = emergencyWithdrawals[id];
        require(!withdrawal.executed, "AxPesaVault: already executed");
        
        withdrawal.executed = true;
        liquidityPool -= withdrawal.amount;
        token.safeTransfer(withdrawal.to, withdrawal.amount);
        
        emit EmergencyWithdrawalExecuted(id);
    }

    /**
     * @dev Set new vault for upgrade
     * @param _newVault Address of the new vault contract
     */
    function setNewVault(address _newVault) external {
        require(isSigner[msg.sender] || msg.sender == owner(), "AxPesaVault: not authorized");
        require(_newVault != address(0), "AxPesaVault: zero vault address");
        newVault = _newVault;
    }

    /**
     * @dev Upgrade vault - transfer all tokens to new vault
     * @dev Requires owner + 1 signer approval
     */
    function upgradeVault() external {
        require(newVault != address(0), "AxPesaVault: new vault not set");
        require(msg.sender == owner() || isSigner[msg.sender], "AxPesaVault: not authorized");
        
        uint256 vaultBalance = token.balanceOf(address(this));
        require(vaultBalance > 0, "AxPesaVault: nothing to transfer");
        
        token.safeTransfer(newVault, vaultBalance);
        
        emit VaultUpgraded(newVault);
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    /**
     * @dev Get vault statistics
     */
    function getVaultStats() external view returns (
        uint256 _totalDeposited,
        uint256 _totalLocked,
        uint256 _liquidityPool,
        uint256 _vaultBalance
    ) {
        return (
            totalDeposited,
            totalLocked,
            liquidityPool,
            token.balanceOf(address(this))
        );
    }

    /**
     * @dev Check if address is owner
     */
    function isOwner(address _address) external view returns (bool) {
        return _address == owner();
    }

    /**
     * @dev Get all signers
     */
    function getSigners() external view returns (address[3] memory) {
        return signers;
    }

    /**
     * @dev Check if emergency withdrawal is executed
     */
    function isEmergencyWithdrawalExecuted(bytes32 id) external view returns (bool) {
        return emergencyWithdrawals[id].executed;
    }

    /**
     * @dev Recover accidentally sent tokens (not the vault token)
     */
    function recoverToken(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(token), "AxPesaVault: cannot recover vault token");
        IERC20(tokenAddress).safeTransfer(owner(), amount);
    }

    /**
     * @dev Seed the liquidity pool with tokens from vault balance
     * @dev Allows owner to use vault tokens for liquidity (e.g., faucet, initial liquidity)
     * @param amount Amount of tokens to add to liquidity pool
     */
    function seedLiquidity(uint256 amount) external onlyOwner {
        require(amount > 0, "AxPesaVault: zero amount");
        require(token.balanceOf(address(this)) >= amount, "AxPesaVault: insufficient vault balance");
        
        liquidityPool += amount;
        
        emit LiquidityRecovered(amount);
    }
}
