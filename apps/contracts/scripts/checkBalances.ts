import { ethers } from "hardhat";

async function main() {
  const axcnhAddress = "0xc709FF3C768EEE6217DfAa3d75FD3e1bb085D4ad";
  const vaultAddress = "0xa360c11F053E587738B259Ab4Ad94460d21c58E4";
  
  const AxCNH = await ethers.getContractAt("IERC20", axcnhAddress);
  const [deployer] = await ethers.getSigners();
  
  const deployerBalance = await AxCNH.balanceOf(deployer.address);
  const vaultBalance = await AxCNH.balanceOf(vaultAddress);
  
  console.log("=== Testnet Deployment Results ===");
  console.log("AxCNH Token:", axcnhAddress);
  console.log("Vault:", vaultAddress);
  console.log("Deployer balance:", ethers.formatEther(deployerBalance), "AxCNH");
  console.log("Vault balance:", ethers.formatEther(vaultBalance), "AxCNH");
}

main();
