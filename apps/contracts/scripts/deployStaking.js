const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const deployments = require('../deployments.json');
  const axcnhAddress = deployments.AxCNH?.address;
  
  if (!axcnhAddress) {
    throw new Error("AxCNH not deployed. Deploy it first.");
  }
  console.log("AxCNH token address:", axcnhAddress);

  const AxPesaStaking = await hre.ethers.getContractFactory("AxPesaStaking");
  const staking = await hre.ethers.deployContract("AxPesaStaking", [axcnhAddress, deployer.address]);
  await staking.waitForDeployment();
  
  const stakingAddress = await staking.getAddress();
  console.log("AxPesaStaking deployed to:", stakingAddress);
  
  const fs = require('fs');
  const deploymentData = {
    AxPesaStaking: {
      address: stakingAddress,
      owner: deployer.address,
      stakingToken: axcnhAddress,
      timestamp: new Date().toISOString()
    }
  };
  
  const updatedDeployments = {
    ...deployments,
    ...deploymentData
  };
  
  fs.writeFileSync(
    './deployments.json',
    JSON.stringify(updatedDeployments, null, 2)
  );
  
  console.log("Deployment saved to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
