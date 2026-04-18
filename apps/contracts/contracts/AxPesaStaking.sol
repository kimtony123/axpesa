// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AxPesaStaking
 * @dev Staking contract for AxCNH with compound interest
 * 
 * PLANS:
 * - Flexible: 5% APY, no lock
 * - 30-Day: 8% APY, 30-day lock
 * - 90-Day: 12% APY, 90-day lock
 * 
 * FEES:
 * - Minimum stake: 5 AxCNH
 * - Early unstake penalty: 10% (locked plans only)
 * - Platform fee: 10% of all transaction fees goes to reward pool
 */
contract AxPesaStaking is Ownable {
    using SafeERC20 for IERC20;

    // Token to stake
    IERC20 public stakingToken;
    uint256 public constant MIN_STAKE = 5e18; // 5 AxCNH

    // APY percentages (in basis points, 100 = 1%)
    uint256 public constant FLEXIBLE_APY = 500;     // 5%
    uint256 public constant THIRTY_DAY_APY = 800;  // 8%
    uint256 public constant NINETY_DAY_APY = 1200; // 12%
    
    // Lock periods (in seconds)
    uint256 public constant THIRTY_DAYS = 30 days;
    uint256 public constant NINETY_DAYS = 90 days;
    
    // Early unstake penalty: 10%
    uint256 public constant EARLY_UNSTAKE_PENALTY = 1000; // 1000 bps = 10%

    // Compound frequency: once per day
    uint256 public constant COMPOUND_SECONDS = 1 days;

    // Plan enum
    enum Plan { Flexible, ThirtyDays, NinetyDays }

    // Staking position
    struct Position {
        address user;
        Plan plan;
        uint256 principal;
        uint256 lastCompoundTime;
        uint256 startTime;
        bool isActive;
    }

    // Storage
    Position[] public positions;
    mapping(address => uint256[]) public userPositionIds;
    
    // Stats
    uint256 public totalStakedAmount;
    uint256 public totalRewardsDistributed;
    uint256 public rewardPoolBalance;
    
    // Pending unstakes for locked plans
    mapping(uint256 => uint256) public pendingUnstakes; // positionId -> unlockTime
    mapping(address => uint256[]) public userPendingUnstakes;

    // Events
    event Staked(address indexed user, uint256 indexed positionId, uint256 amount, uint8 plan);
    event Unstaked(address indexed user, uint256 indexed positionId, uint256 amount, uint256 penalty);
    event Compound(address indexed user, uint256 indexed positionId, uint256 reward);
    event RewardPoolFunded(address indexed funder, uint256 amount);
    event RewardsWithdrawn(address indexed owner, uint256 amount);

    /**
     * @dev Constructor
     * @param _stakingToken Address of the AxCNH token
     * @param _owner Owner address
     */
    constructor(address _stakingToken, address _owner) Ownable(_owner) {
        require(_stakingToken != address(0), "AxPesaStaking: zero token");
        stakingToken = IERC20(_stakingToken);
    }

    /**
     * @dev Stake tokens
     * @param amount Amount to stake
     * @param plan Staking plan (0=Flexible, 1=30Days, 2=90Days)
     */
    function stake(uint256 amount, Plan plan) external {
        require(amount >= MIN_STAKE, "AxPesaStaking: below minimum");
        require(plan <= Plan.NinetyDays, "AxPesaStaking: invalid plan");
        
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 positionId = positions.length;
        
        positions.push(Position({
            user: msg.sender,
            plan: plan,
            principal: amount,
            lastCompoundTime: block.timestamp,
            startTime: block.timestamp,
            isActive: true
        }));
        
        userPositionIds[msg.sender].push(positionId);
        totalStakedAmount += amount;
        
        emit Staked(msg.sender, positionId, amount, uint8(plan));
    }

    /**
     * @dev Compound rewards for a position
     * @param positionId Position ID
     */
    function compound(uint256 positionId) external {
        require(positionId < positions.length, "AxPesaStaking: invalid position");
        Position storage position = positions[positionId];
        require(position.user == msg.sender, "AxPesaStaking: not owner");
        require(position.isActive, "AxPesaStaking: not active");
        
        uint256 timeSinceLastCompound = block.timestamp - position.lastCompoundTime;
        require(timeSinceLastCompound >= COMPOUND_SECONDS, "AxPesaStaking: too soon");
        
        uint256 reward = _calculateReward(position);
        
        // Compound: add reward to principal
        position.principal += reward;
        position.lastCompoundTime = block.timestamp;
        
        totalRewardsDistributed += reward;
        
        emit Compound(msg.sender, positionId, reward);
    }

    /**
     * @dev Request unstake (starts unlock countdown for locked plans)
     * @param positionId Position ID
     */
    function requestUnstake(uint256 positionId) external {
        require(positionId < positions.length, "AxPesaStaking: invalid position");
        Position storage position = positions[positionId];
        require(position.user == msg.sender, "AxPesaStaking: not owner");
        require(position.isActive, "AxPesaStaking: not active");
        
        if (position.plan == Plan.ThirtyDays) {
            require(
                block.timestamp >= position.startTime + THIRTY_DAYS,
                "AxPesaStaking: 30-day lock active"
            );
        } else if (position.plan == Plan.NinetyDays) {
            require(
                block.timestamp >= position.startTime + NINETY_DAYS,
                "AxPesaStaking: 90-day lock active"
            );
        }
        
        // For locked plans, require a request to trigger the unlock
        uint256 unlockTime = block.timestamp;
        if (position.plan != Plan.Flexible) {
            unlockTime = block.timestamp + 7 days; // 7 days to claim after request
        }
        
        pendingUnstakes[positionId] = unlockTime;
        userPendingUnstakes[msg.sender].push(positionId);
    }

    /**
     * @dev Complete unstake after lock period or immediate for flexible
     * @param positionId Position ID
     */
    function unstake(uint256 positionId) external {
        require(positionId < positions.length, "AxPesaStaking: invalid position");
        Position storage position = positions[positionId];
        require(position.user == msg.sender, "AxPesaStaking: not owner");
        require(position.isActive, "AxPesaStaking: not active");
        
        uint256 unlockTime = pendingUnstakes[positionId];
        bool isEarly = false;
        
        if (position.plan == Plan.ThirtyDays) {
            if (block.timestamp < position.startTime + THIRTY_DAYS) {
                isEarly = true;
            }
            require(unlockTime > 0, "AxPesaStaking: request unstake first");
        } else if (position.plan == Plan.NinetyDays) {
            if (block.timestamp < position.startTime + NINETY_DAYS) {
                isEarly = true;
            }
            require(unlockTime > 0, "AxPesaStaking: request unstake first");
        } else {
            // Flexible - no request needed
            require(position.plan == Plan.Flexible, "AxPesaStaking: invalid plan");
        }
        
        // Check unlock time
        require(block.timestamp >= unlockTime, "AxPesaStaking: not yet unlocked");
        
        // Calculate final amount (compound first)
        _compoundPosition(position);
        
        uint256 amount = position.principal;
        uint256 penalty = 0;
        
        // Apply early unstake penalty
        if (isEarly) {
            penalty = (amount * EARLY_UNSTAKE_PENALTY) / 10000;
            amount = amount - penalty;
        }
        
        // Mark position inactive
        position.isActive = false;
        pendingUnstakes[positionId] = 0;
        totalStakedAmount -= position.principal;
        
        // Transfer tokens
        stakingToken.safeTransfer(msg.sender, amount);
        
        // Penalty goes to reward pool
        if (penalty > 0) {
            rewardPoolBalance += penalty;
        }
        
        emit Unstaked(msg.sender, positionId, amount, penalty);
    }

    /**
     * @dev Fund the reward pool (called by platform with fees)
     * @param amount Amount to add to reward pool
     */
    function fundRewardPool(uint256 amount) external {
        require(amount > 0, "AxPesaStaking: zero amount");
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        rewardPoolBalance += amount;
        emit RewardPoolFunded(msg.sender, amount);
    }

    /**
     * @dev Withdraw excess rewards from pool (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawExcessRewards(uint256 amount) external onlyOwner {
        require(amount <= rewardPoolBalance, "AxPesaStaking: insufficient balance");
        rewardPoolBalance -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit RewardsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Get pending reward for a position
     * @param positionId Position ID
     */
    function getPendingReward(uint256 positionId) external view returns (uint256) {
        require(positionId < positions.length, "AxPesaStaking: invalid position");
        Position memory position = positions[positionId];
        return _calculateReward(position);
    }

    /**
     * @dev Get all positions for a user
     * @param user User address
     */
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositionIds[user];
    }

    /**
     * @dev Get position details
     * @param positionId Position ID
     */
    function getPosition(uint256 positionId) external view returns (
        address user,
        uint8 plan,
        uint256 principal,
        uint256 pendingReward
    ) {
        require(positionId < positions.length, "AxPesaStaking: invalid position");
        Position memory position = positions[positionId];
        
        return (
            position.user,
            uint8(position.plan),
            position.principal,
            _calculateReward(position)
        );
    }

    /**
     * @dev Get position timestamps
     * @param positionId Position ID
     */
    function getPositionTimes(uint256 positionId) external view returns (
        uint256 lastCompoundTime,
        uint256 startTime,
        bool isActive,
        bool canUnstake
    ) {
        require(positionId < positions.length, "AxPesaStaking: invalid position");
        Position memory position = positions[positionId];
        return (
            position.lastCompoundTime,
            position.startTime,
            position.isActive,
            _canUnstake(position)
        );
    }

    /**
     * @dev Calculate reward for a position
     */
    function _calculateReward(Position memory position) internal view returns (uint256) {
        if (!position.isActive) return 0;
        
        uint256 timeStaked = block.timestamp - position.lastCompoundTime;
        if (timeStaked < COMPOUND_SECONDS) return 0;
        
        uint256 apy = _getAPY(position.plan);
        
        // Calculate reward based on time elapsed (compound daily)
        uint256 secondsPerYear = 365 days;
        uint256 reward = (position.principal * apy * timeStaked) / (secondsPerYear * 10000);
        
        return reward;
    }

    /**
     * @dev Compound a single position (internal)
     */
    function _compoundPosition(Position storage position) internal {
        uint256 reward = _calculateReward(position);
        if (reward > 0) {
            position.principal += reward;
            position.lastCompoundTime = block.timestamp;
            totalRewardsDistributed += reward;
        }
    }

    /**
     * @dev Get APY for a plan
     */
    function _getAPY(Plan plan) internal pure returns (uint256) {
        if (plan == Plan.Flexible) return FLEXIBLE_APY;
        if (plan == Plan.ThirtyDays) return THIRTY_DAY_APY;
        return NINETY_DAY_APY;
    }

    /**
     * @dev Check if position can be unstaked
     */
    function _canUnstake(Position memory position) internal view returns (bool) {
        if (!position.isActive) return false;
        
        if (position.plan == Plan.ThirtyDays) {
            return block.timestamp >= position.startTime + THIRTY_DAYS;
        }
        if (position.plan == Plan.NinetyDays) {
            return block.timestamp >= position.startTime + NINETY_DAYS;
        }
        return true; // Flexible can unstake anytime
    }

    /**
     * @dev Get staking stats
     */
    function getStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalRewards,
        uint256 _rewardPool,
        uint256 _positionCount
    ) {
        return (
            totalStakedAmount,
            totalRewardsDistributed,
            rewardPoolBalance,
            positions.length
        );
    }
}
