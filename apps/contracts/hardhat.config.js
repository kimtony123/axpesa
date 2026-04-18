require('dotenv').config({ path: './.env' });
require("@nomicfoundation/hardhat-toolbox");

function getPrivateKey() {
  const key = process.env.DEPLOYER_PRIVATE_KEY || process.env.HOT_WALLET_PRIVATE_KEY;
  if (!key) return "0x0000000000000000000000000000000000000000000000000000000000000000";
  return key.startsWith("0x") ? key : "0x" + key;
}

const PRIVATE_KEY = getPrivateKey();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337
    },
    confluxESpaceLocal: {
      url: "http://localhost:8545",
      chainId: 2030,
      accounts: [PRIVATE_KEY]
    },
    confluxESpaceTestnet: {
      url: "http://evmtestnet.confluxrpc.com",
      chainId: 71,
      accounts: [PRIVATE_KEY],
      timeout: 180000
    },
    confluxESpace: {
      url: "https://evm.confluxrpc.com",
      chainId: 1030,
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      confluxESpaceTestnet: "verify",
      confluxESpace: "verify"
    },
    customChains: [
      {
        network: "confluxESpace",
        chainId: 1030,
        urls: {
          apiURL: "https://evmapi.confluxscan.org/api",
          browserURL: "https://evm.confluxscan.org/"
        }
      },
      {
        network: "conluxESpaceTestnet",
        chainId: 71,
        urls: {
          apiURL: "https://evmapi-testnet.confluxscan.org/api",
          browserURL: "https://evmtestnet.confluxscan.org/"
        }
      }
    ]
  }
};
