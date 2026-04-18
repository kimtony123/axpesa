import { network } from "hardhat";

module.exports = async () => {
  const chainId = (await network.config.chainId) || 71;
  console.log(`Deploying to network: ${network.name} (Chain ID: ${chainId})`);
};
