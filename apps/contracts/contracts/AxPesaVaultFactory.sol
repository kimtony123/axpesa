// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AxPesaVault.sol";

/**
 * @title AxPesaVaultFactory
 * @dev Factory contract to deploy separate vaults for each token
 * 
 * Each token needs its own vault:
 * - AxCNH_Vault → for AxCNH tokens
 * - USDTO_Vault → for USDTO tokens
 * - BTC_Vault → for BTC tokens
 * - ETH_Vault → for ETH tokens
 */
contract AxPesaVaultFactory {
    event VaultDeployed(
        address indexed vault,
        string indexed tokenName,
        address indexed token,
        address owner,
        uint256 timestamp
    );

    /**
     * @dev Deploy a new vault for a specific token
     * @param token Address of the ERC20 token
     * @param signers Array of 3 admin signer addresses
     * @param owner Owner address (deployer/hot wallet)
     * @param tokenName Human-readable token name
     * @return Address of the newly deployed vault
     */
    function deployVault(
        address token,
        address[3] memory signers,
        address owner,
        string memory tokenName
    ) external returns (address) {
        AxPesaVault vault = new AxPesaVault(
            token,
            signers,
            owner,
            tokenName
        );
        
        emit VaultDeployed(
            address(vault),
            tokenName,
            token,
            owner,
            block.timestamp
        );
        
        return address(vault);
    }
}
