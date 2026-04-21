import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const balance = await signer.provider.getBalance(signer.address);
  console.log("Deployer:", signer.address);
  console.log("Balance:", ethers.formatEther(balance), "CFX");
}

main();
