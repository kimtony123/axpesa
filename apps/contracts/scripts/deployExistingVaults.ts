import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script to deploy ONLY the vaults for existing tokens (USDTO, BTC, ETH)
 * Run this AFTER the initial deployment if you just need additional vaults
 */
async function main() {
  console.log("🚀 Deploying Additional Vaults for Existing Tokens...\n");

  const [deployer] = await ethers.getSigners();

  const admin1 = process.env.ADMIN_SIGNER_1 || deployer.address;
  const admin2 = process.env.ADMIN_SIGNER_2 || deployer.address;
  const admin3 = process.env.ADMIN_SIGNER_3 || deployer.address;
  const signers = [admin1, admin2, admin3];

  console.log("📧 Deployer:", deployer.address);
  console.log("🔐 Signers:", signers);

  const AxPesaVault = await ethers.getContractFactory("AxPesaVault");
  const deployedVaults: any = {};

  const existingTokens = [
    {
      name: "USDTO",
      address: "0x4d1beB67e8f0102d5c983c26FDf0b7C6FFF37a0c"
    },
    {
      name: "BTC",
      address: "0x54593e02c39aeff52b166bd036797d2b1478de8d"
    },
    {
      name: "ETH",
      address: "0xcd71270f82f319e0498ff98af8269c3f0d547c65"
    }
  ];

  for (const token of existingTokens) {
    console.log(`\n📝 Deploying ${token.name} Vault...`);
    
    const vault = await AxPesaVault.deploy(
      token.address,
      signers,
      deployer.address,
      token.name
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    
    console.log(`✅ ${token.name} Vault:`, vaultAddress);
    
    deployedVaults[token.name] = {
      address: vaultAddress,
      token: token.address,
      owner: deployer.address,
      signers: signers
    };
  }

  // Update .env
  const envPath = path.join(__dirname, "../../.env");
  let envContent = fs.readFileSync(envPath, "utf8");

  const updates = [
    `USDTO_VAULT_ADDRESS=${deployedVaults.USDTO.address}`,
    `BTC_VAULT_ADDRESS=${deployedVaults.BTC.address}`,
    `ETH_VAULT_ADDRESS=${deployedVaults.ETH.address}`
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
  console.log("\n✅ Vault addresses updated in .env");

  console.log("\n" + "=".repeat(60));
  console.log("📋 VAULT SUMMARY");
  console.log("=".repeat(60));
  console.log("   USDTO Vault:", deployedVaults.USDTO.address);
  console.log("   BTC Vault:", deployedVaults.BTC.address);
  console.log("   ETH Vault:", deployedVaults.ETH.address);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
