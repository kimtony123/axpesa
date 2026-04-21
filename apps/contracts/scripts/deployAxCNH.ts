import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy new AxCNH Token and Vault
 * - Token: Mintable by deployer
 * - Vault: Simplified, receives tokens from withdraw
 */
async function main() {
  console.log("🚀 Deploying AxCNH Token and Vault...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📧 Deployer:", deployer.address);

  // Deploy AxCNH Token
  console.log("\n📝 Deploying AxCNH Token...");
  const AxCNH = await ethers.getContractFactory("AxCNH");
  const axcnh = await AxCNH.deploy(deployer.address);
  await axcnh.waitForDeployment();
  const axcnhAddress = await axcnh.getAddress();
  console.log("✅ AxCNH Token:", axcnhAddress);

  // Deploy AxPesaVault
  console.log("\n📝 Deploying AxPesaVault...");
  const AxPesaVault = await ethers.getContractFactory("AxPesaVault");
  const vault = await AxPesaVault.deploy(
    axcnhAddress,      // token
    deployer.address,  // owner
    "AxCNH"           // tokenName
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ AxPesaVault:", vaultAddress);

  // Mint 10,000,000 AxCNH to vault (for BUY withdrawals)
  console.log("\n📝 Minting 10,000,000 AxCNH to vault...");
  const vaultMintAmount = ethers.parseEther("10000000");
  await axcnh.mint(vaultAddress, vaultMintAmount);
  console.log("✅ Minted 10,000,000 AxCNH to vault");

  // Mint 1,000,000 AxCNH to deployer (for FAUCET)
  console.log("\n📝 Minting 1,000,000 AxCNH to deployer...");
  const deployerMintAmount = ethers.parseEther("1000000");
  await axcnh.mint(deployer.address, deployerMintAmount);
  console.log("✅ Minted 1,000,000 AxCNH to", deployer.address);

  // Check balances
  const deployerBalance = await axcnh.balanceOf(deployer.address);
  const vaultBalance = await axcnh.balanceOf(vaultAddress);
  console.log("\n📊 Balances:");
  console.log("   Deployer:", ethers.formatEther(deployerBalance), "AxCNH");
  console.log("   Vault:", ethers.formatEther(vaultBalance), "AxCNH");

  // Update .env
  const envPath = path.join(__dirname, "../../backend/.env");
  let envContent = fs.readFileSync(envPath, "utf8");

  const updates = [
    `AXCNH_TOKEN_ADDRESS=${axcnhAddress}`,
    `AXCNH_VAULT_ADDRESS=${vaultAddress}`
  ];

  for (const update of updates) {
    const [key, value] = update.split("=");
    if (envContent.includes(key)) {
      envContent = envContent.replace(new RegExp(`${key}=.*`, "g"), update);
    } else {
      envContent += `\n${update}`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Addresses updated in backend .env");

  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("   AxCNH Token:", axcnhAddress);
  console.log("   AxCNH Vault:", vaultAddress);
  console.log("   Deployer Balance:", ethers.formatEther(deployerBalance), "AxCNH");
  console.log("=".repeat(60));
  console.log("\n⚠️  Next: Fund vault with CFX for gas!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
