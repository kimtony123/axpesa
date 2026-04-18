# AxPesa Smart Contracts

This directory contains the smart contracts powering the AxPesa platform on Conflux eSpace.

## Important Note on AxCNH Token

AxCNH is an **external ERC-20 stablecoin** (like USDT or USDC), not a token we created or control. We use it as the CNY stablecoin for our platform. 

For **testnet demonstration purposes**, we deployed a test version of an AxCNH-like token. In production, AxPesa would integrate with the actual AxCNH token once it's available on Conflux eSpace mainnet.

## Contracts Overview

### Test AxCNH Token (Testnet Only)

**Purpose:** Test ERC-20 stablecoin pegged to Chinese Yuan (CNY) for testnet demonstration

**Note:** This is a TEST token for demonstration. In production, we would use the actual AxCNH stablecoin (an external token like USDT).

**Key Features:**
- 1:1 peg to CNY
- Mintable by owner and authorized minters
- Burnable for flexibility
- 18 decimal precision

**Deployment:**
```
Network: Conflux eSpace Testnet
Address: 0xD41Ca697EEF60fE35f9e92441A180915D6465516
Explorer: https://evmtestnet.confluxscan.io/address/0xD41Ca697EEF60fE35f9e92441A180915D6465516
```

### AxPesaVault (Our Contract)

**Purpose:** AxPesa's vault contract for managing AxCNH deposits and withdrawals. This is our core infrastructure contract.

**Key Features:**
- **90/10 Liquidity Model**: 90% of deposits are locked, 10% held as liquidity
- **Owner Withdrawals**: Owner can withdraw for off-ramp settlements
- **Multi-sig Security**: 2-of-3 admin signatures for emergency withdrawals
- **Upgrade Path**: Can transfer to new vault contract

**Architecture:**
```
User Deposit Flow:
1. User approves vault to spend AxCNH
2. User calls deposit()
3. 90% → Locked (user cannot withdraw)
4. 10% → Liquidity pool

Owner Withdrawal Flow:
1. Payment processor confirms fiat payment
2. Owner calls withdraw(user, amount)
3. Tokens transferred from liquidity pool
4. User receives tokens
```

**Deployment:**
```
Network: Conflux eSpace Testnet
Address: 0xCFC0aA7Afab6d6a617D6CB5213bf9f206604bcF6
Explorer: https://evmtestnet.confluxscan.io/address/0xCFC0aA7Afab6d6a617D6CB5213bf9f206604bcF6
```

## Project Structure

```
contracts/
├── AxCNH.sol           # ERC-20 CNY stablecoin
├── AxPesaVault.sol     # 90/10 liquidity vault
└── ...

test/
├── AxCNH.test.js       # Token tests
├── AxPesaVault.test.js # Vault tests
└── ...

scripts/
├── deploy.ts           # Deployment scripts
└── ...

hardhat.config.ts       # Hardhat configuration
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy to Testnet

```bash
# Configure your private key in hardhat.config.ts or as env var
export PRIVATE_KEY=0x...

# Deploy
npx hardhat run scripts/deploy.ts --network confluxESpaceTestnet
```

## Testing

### Run All Tests

```bash
npm test
```

### Test Coverage

Tests cover:
- Token deployment and initialization
- Minting and access control
- Deposit mechanics (90/10 split)
- Withdrawal authorization
- Multi-sig emergency procedures
- Vault statistics

## Security Considerations

1. **Access Control**: Only owner can mint tokens and withdraw from vault
2. **Multi-sig**: Emergency withdrawals require 2-of-3 admin signatures
3. **Reentrancy**: Using SafeERC20 prevents reentrancy attacks
4. **Integer Overflow**: Solidity 0.8.28 built-in overflow checks

## License

MIT
