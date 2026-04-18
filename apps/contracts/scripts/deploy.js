const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying AxPesa Contracts to Conflux eSpace Testnet...\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📧 Deployer (Hot Wallet):", deployer.address);

  const admin1 = process.env.ADMIN_SIGNER_1 || deployer.address;
  const admin2 = process.env.ADMIN_SIGNER_2 || deployer.address;
  const admin3 = process.env.ADMIN_SIGNER_3 || deployer.address;
  const signers = [admin1, admin2, admin3];

  console.log("\n🔐 Multi-sig Signers (2-of-3):");
  console.log("   Signer 1:", admin1);
  console.log("   Signer 2:", admin2);
  console.log("   Signer 3:", admin3);

  const deployedContracts = {};

  console.log("\n" + "=".repeat(70));
  console.log("📝 STEP 1: Deploying AxCNH Token");
  console.log("=".repeat(70));

  const AxCNH = await ethers.getContractFactory("AxCNH");
  const axcnh = await AxCNH.deploy(deployer.address);
  await axcnh.waitForDeployment();
  const axcnhAddress = await axcnh.getAddress();
  console.log("✅ AxCNH Token deployed to:", axcnhAddress);

  console.log("\n📝 STEP 2: Deploying AxCNH Vault");
  const AxPesaVault = await ethers.getContractFactory("AxPesaVault");
  const vaultAxcnh = await AxPesaVault.deploy(
    axcnhAddress,
    signers,
    deployer.address,
    "AxCNH"
  );
  await vaultAxcnh.waitForDeployment();
  const vaultAxcnhAddress = await vaultAxcnh.getAddress();
  console.log("✅ AxCNH Vault deployed to:", vaultAxcnhAddress);

  await axcnh.addMinter(vaultAxcnhAddress);
  console.log("✅ Added vault as minter for AxCNH");

  const axcnhMintAmount = ethers.parseUnits("1000000", 18);
  await axcnh.mint(vaultAxcnhAddress, axcnhMintAmount);
  console.log(`✅ Minted ${ethers.formatUnits(axcnhMintAmount, 18)} AxCNH to vault`);

  // Seed liquidity pool for faucet functionality
  const seedAmount = ethers.parseUnits("100000", 18);
  await vaultAxcnh.seedLiquidity(seedAmount);
  console.log(`✅ Seeded ${ethers.formatUnits(seedAmount, 18)} AxCNH to liquidity pool`);

  deployedContracts.AxCNH = {
    address: axcnhAddress,
    symbol: "AxCNH",
    decimals: 18,
    minter: deployer.address,
    vaultMinter: vaultAxcnhAddress
  };

  deployedContracts.vaults = {
    AxCNH: {
      address: vaultAxcnhAddress,
      owner: deployer.address,
      signers: signers,
      requiredSignatures: 2,
      token: axcnhAddress,
      tokenName: "AxCNH",
      liquidityPercent: 10,
      lockedPercent: 90
    }
  };

  console.log("\n" + "=".repeat(70));
  console.log("📝 STEP 3: Deploying Vaults for Existing Tokens");
  console.log("=".repeat(70));

  const existingTokens = [
    { name: "USDTO", address: "0x4d1beB67e8f0102d5c983c26FDf0b7C6FFF37a0c", symbol: "USDTO" },
    { name: "BTC", address: "0x54593e02c39aeff52b166bd036797d2b1478de8d", symbol: "BTC" },
    { name: "ETH", address: "0xcd71270f82f319e0498ff98af8269c3f0d547c65", symbol: "ETH" }
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
    
    console.log(`✅ ${token.name} Vault deployed to:`, vaultAddress);
    
    deployedContracts.vaults[token.name] = {
      address: vaultAddress,
      owner: deployer.address,
      signers: signers,
      requiredSignatures: 2,
      token: token.address,
      tokenName: token.name,
      liquidityPercent: 10,
      lockedPercent: 90
    };
  }

  console.log("\n" + "=".repeat(70));
  console.log("💾 STEP 4: Saving Deployment Info");
  console.log("=".repeat(70));

  const deploymentInfo = {
    network: "confluxESpaceTestnet",
    chainId: 71,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    ...deployedContracts,
    usage: {
      "SELL (User deposits)": "user calls vault.deposit(amount) → 90% locked, 10% to liquidity",
      "BUY (User withdraws)": "owner calls vault.withdraw(userAddress, amount) after Flutterwave confirms",
      "Emergency": "2-of-3 signers required for upgradeVault() or emergency withdrawal"
    }
  };

  const deploymentsPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to:", deploymentsPath);

  const envPath = path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf8");

  const updates = [
    `AXCNH_CONTRACT_ADDRESS=${axcnhAddress}`,
    `AXCNH_VAULT_ADDRESS=${vaultAxcnhAddress}`,
    `USDTO_VAULT_ADDRESS=${deployedContracts.vaults.USDTO.address}`,
    `BTC_VAULT_ADDRESS=${deployedContracts.vaults.BTC.address}`,
    `ETH_VAULT_ADDRESS=${deployedContracts.vaults.ETH.address}`
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
  console.log("✅ Contract addresses updated in .env");

  console.log("\n" + "=".repeat(70));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(70));
  console.log("\n🪙 NEW CONTRACTS:");
  console.log("   AxCNH Token:", axcnhAddress);
  console.log("   AxCNH Vault:", vaultAxcnhAddress);
  
  console.log("\n📜 EXISTING TOKEN VAULTS:");
  console.log("   USDTO Vault:", deployedContracts.vaults.USDTO.address);
  console.log("   BTC Vault:", deployedContracts.vaults.BTC.address);
  console.log("   ETH Vault:", deployedContracts.vaults.ETH.address);
  
  console.log("\n🔐 SECURITY:");
  console.log("   Owner (withdraw):", deployer.address);
  console.log("   Signers: 2-of-3 required for emergencies");
  
  console.log("\n💰 LIQUIDITY MODEL:");
  console.log("   10% available for instant withdrawals");
  console.log("   90% locked in vault");
  console.log("=".repeat(70));
  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
