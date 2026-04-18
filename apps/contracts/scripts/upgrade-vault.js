const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Upgrading AxPesaVault with seedLiquidity function...\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📧 Deployer (Hot Wallet):", deployer.address);

  const admin1 = process.env.ADMIN_SIGNER_1 || deployer.address;
  const admin2 = process.env.ADMIN_SIGNER_2 || deployer.address;
  const admin3 = process.env.ADMIN_SIGNER_3 || deployer.address;
  const signers = [admin1, admin2, admin3];

  // Existing AxCNH token address
  const AXCNH_ADDRESS = "0xD41Ca697EEF60fE35f9e92441A180915D6465516";
  
  console.log("\n📝 Existing AxCNH Token:", AXCNH_ADDRESS);

  console.log("\n🔐 Multi-sig Signers (2-of-3):");
  console.log("   Signer 1:", admin1);
  console.log("   Signer 2:", admin2);
  console.log("   Signer 3:", admin3);

  console.log("\n" + "=".repeat(70));
  console.log("📝 Deploying New AxCNH Vault with seedLiquidity");
  console.log("=".repeat(70));

  const AxPesaVault = await ethers.getContractFactory("AxPesaVault");
  const vaultAxcnh = await AxPesaVault.deploy(
    AXCNH_ADDRESS,
    signers,
    deployer.address,
    "AxCNH"
  );
  await vaultAxcnh.waitForDeployment();
  const vaultAxcnhAddress = await vaultAxcnh.getAddress();
  console.log("✅ New AxCNH Vault deployed to:", vaultAxcnhAddress);

  console.log("\n" + "=".repeat(70));
  console.log("💾 STEP 2: Saving Deployment Info");
  console.log("=".repeat(70));

  // Read existing deployments
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  let deploymentInfo = {};
  
  if (fs.existsSync(deploymentsPath)) {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  }

  // Update vault address
  deploymentInfo.vaults = deploymentInfo.vaults || {};
  deploymentInfo.vaults.AxCNH = {
    ...deploymentInfo.vaults.AxCNH,
    address: vaultAxcnhAddress,
    owner: deployer.address,
    hasSeedLiquidity: true
  };

  deploymentInfo.upgradedAt = new Date().toISOString();
  deploymentInfo.newVault = vaultAxcnhAddress;

  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info updated");

  // Update .env files
  const rootEnvPath = path.join(__dirname, "../../.env");
  const backendEnvPath = path.join(__dirname, "../../apps/backend/.env");
  
  const newEnvLine = `AXCNH_VAULT_ADDRESS=${vaultAxcnhAddress}`;
  
  [rootEnvPath, backendEnvPath].forEach(envPath => {
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf8");
      if (envContent.includes("AXCNH_VAULT_ADDRESS=")) {
        envContent = envContent.replace(/AXCNH_VAULT_ADDRESS=.*/g, newEnvLine);
      }
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Updated ${envPath}`);
    }
  });

  console.log("\n" + "=".repeat(70));
  console.log("📋 UPGRADE SUMMARY");
  console.log("=".repeat(70));
  console.log("\n🆕 NEW CONTRACT:");
  console.log("   AxCNH Vault:", vaultAxcnhAddress);
  console.log("\n📋 NOTE:");
  console.log("   Tokens are still in the OLD vault.");
  console.log("   Transfer tokens to new vault to enable withdrawals.");
  console.log("=");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
