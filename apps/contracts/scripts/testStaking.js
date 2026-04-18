const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  // Create test users from deployer
  const user1 = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  const user2 = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  
  console.log("Testing with accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);

  const deployments = require('../deployments.json');
  const stakingAddress = deployments.AxPesaStaking?.address;
  const tokenAddress = deployments.AxCNH?.address || deployments.AxCNH;

  if (!stakingAddress || !tokenAddress) {
    console.error("Missing contract addresses in deployments.json");
    process.exit(1);
  }

  const staking = await hre.ethers.getContractAt("AxPesaStaking", stakingAddress);
  const token = await hre.ethers.getContractAt("AxCNH", tokenAddress);

  console.log("\n=== Contract Info ===");
  console.log("Staking:", stakingAddress);
  console.log("Token:", tokenAddress);
  console.log("MIN_STAKE:", hre.ethers.formatEther(await staking.MIN_STAKE()), "AxCNH");

  console.log("\n=== Test 1: Mint Tokens for Testing ===");
  const mintAmount = hre.ethers.parseEther("10000");
  const mintTx = await token.connect(deployer).mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Minted 10000 AxCNH to deployer");

  console.log("\n=== Test 2: Fund Test Users with CFX for Gas ===");
  const fundCFX = hre.ethers.parseEther("1"); // 1 CFX for gas
  await deployer.sendTransaction({ to: user1.address, value: fundCFX });
  await deployer.sendTransaction({ to: user2.address, value: fundCFX });
  console.log("Funded user1 and user2 with 1 CFX each");

  console.log("\n=== Test 3: Check Token Balances ===");
  const deployerTokenBal = await token.balanceOf(deployer.address);
  console.log("Deployer token balance:", hre.ethers.formatEther(deployerTokenBal));

  // Transfer tokens to user1 for testing
  console.log("\n=== Test 4: Transfer Tokens to Test Users ===");
  const transferAmount = hre.ethers.parseEther("1000");
  
  const tx1 = await token.transfer(user1.address, transferAmount);
  await tx1.wait();
  console.log("Transferred 1000 AxCNH to user1");
  
  const tx2 = await token.transfer(user2.address, transferAmount);
  await tx2.wait();
  console.log("Transferred 1000 AxCNH to user2");

  console.log("\n=== Test 5: Stake Tokens (Flexible Plan) ===");
  const stakeAmount = hre.ethers.parseEther("10");
  
  // Approve staking contract to spend tokens
  const approveTx = await token.connect(user1).approve(stakingAddress, stakeAmount);
  await approveTx.wait();
  console.log("Approved staking contract to spend 10 AxCNH");

  // Stake
  const stakeTx = await staking.connect(user1).stake(stakeAmount, 0); // 0 = Flexible
  const stakeReceipt = await stakeTx.wait();
  console.log("Staked 10 AxCNH (Flexible plan) - TX:", stakeReceipt.hash);

  // Get position
  const positions = await staking.getUserPositions(user1.address);
  console.log("User1 positions:", positions.map(p => p.toString()));

  console.log("\n=== Test 6: Check Stats After Stake ===");
  const stats = await staking.getStats();
  console.log("Total staked:", hre.ethers.formatEther(stats[0]));
  console.log("Total rewards distributed:", hre.ethers.formatEther(stats[1]));
  console.log("Reward pool balance:", hre.ethers.formatEther(stats[2]));

  console.log("\n=== Test 7: Stake with 30-Day Plan ===");
  const user2Bal = await token.balanceOf(user2.address);
  console.log("User2 balance:", hre.ethers.formatEther(user2Bal));
  
  const stakeAmount2 = hre.ethers.parseEther("20");
  console.log("Approving staking contract for user2...");
  const approveTx2 = await token.connect(user2).approve(stakingAddress, stakeAmount2);
  await approveTx2.wait();
  console.log("Approved!");
  
  console.log("Staking 20 AxCNH for user2 (30-day plan)...");
  const stakeTx2 = await staking.connect(user2).stake(stakeAmount2, 1); // 1 = 30 days
  await stakeTx2.wait();
  console.log("Staked 20 AxCNH (30-day plan) - TX:", stakeTx2.hash);

  console.log("\n=== Test 8: Fund Reward Pool ===");
  const fundAmount = hre.ethers.parseEther("100");
  await token.connect(deployer).transfer(stakingAddress, fundAmount);
  console.log("Funded reward pool with 100 AxCNH");

  const newStats = await staking.getStats();
  console.log("New reward pool balance:", hre.ethers.formatEther(newStats[2]));

  console.log("\n=== All Tests Passed ===");
  console.log("\nContract deployed at:", stakingAddress);
  console.log("View on ConfluxScan: https://testnet.confluxscan.io/address/" + stakingAddress);
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exitCode = 1;
});
