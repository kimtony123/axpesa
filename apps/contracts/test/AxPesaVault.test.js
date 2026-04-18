const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AxPesaVault", function () {
  let vault;
  let axcnh;
  let owner;
  let admin1;
  let admin2;
  let admin3;
  let user;
  let user2;
  let ownerSigner;
  let userSigner;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    
    ownerSigner = signers[0];
    owner = await signers[0].getAddress();
    admin1 = await signers[1].getAddress();
    admin2 = await signers[2].getAddress();
    admin3 = await signers[3].getAddress();
    userSigner = signers[4];
    user = await signers[4].getAddress();
    user2 = await signers[5].getAddress();

    const signersArray = [admin1, admin2, admin3];

    const AxCNH = await ethers.getContractFactory("AxCNH");
    axcnh = await AxCNH.deploy(owner);
    await axcnh.waitForDeployment();

    const Vault = await ethers.getContractFactory("AxPesaVault");
    vault = await Vault.deploy(axcnh.target, signersArray, owner, "AxCNH");
    await vault.waitForDeployment();

    await axcnh.addMinter(vault.target);

    const mintAmount = 10000n * 10n ** 18n;
    await axcnh.mint(user, mintAmount);
  });

  describe("Deployment", function () {
    it("Should set the correct token", async function () {
      const tokenAddress = await vault.token();
      expect(tokenAddress.toLowerCase()).to.equal(axcnh.target.toLowerCase());
    });

    it("Should set correct token name", async function () {
      const name = await vault.tokenName();
      expect(name).to.equal("AxCNH");
    });

    it("Should set owner correctly", async function () {
      const isOwner = await vault.isOwner(owner);
      expect(isOwner).to.be.true;
    });

    it("Should set required signatures to 2", async function () {
      const required = await vault.REQUIRED_SIGNATURES();
      expect(required).to.equal(2n);
    });
  });

  describe("Deposit (SELL flow)", function () {
    it("Should allow user to deposit", async function () {
      const depositAmount = 100n * 10n ** 18n;
      
      await axcnh.connect(userSigner).approve(vault.target, depositAmount);
      await vault.connect(userSigner).deposit(depositAmount);
      
      const userInfo = await vault.getUserInfo(user);
      expect(userInfo[0]).to.equal(depositAmount);
      expect(userInfo[1]).to.equal(90n * 10n ** 18n);
    });

    it("Should split 90% locked, 10% liquidity", async function () {
      const depositAmount = 100n * 10n ** 18n;
      
      await axcnh.connect(userSigner).approve(vault.target, depositAmount);
      await vault.connect(userSigner).deposit(depositAmount);
      
      const userInfo = await vault.getUserInfo(user);
      expect(userInfo[1]).to.equal(90n * 10n ** 18n);
      expect(userInfo[2]).to.equal(10n * 10n ** 18n);
      
      const stats = await vault.getVaultStats();
      expect(stats[2]).to.equal(10n * 10n ** 18n);
    });

    it("Should not allow zero deposit", async function () {
      await expect(
        vault.connect(userSigner).deposit(0n)
      ).to.be.reverted;
    });
  });

  describe("Withdraw (BUY flow) - Owner Only", function () {
    beforeEach(async function () {
      const depositAmount = 100n * 10n ** 18n;
      await axcnh.connect(userSigner).approve(vault.target, depositAmount);
      await vault.connect(userSigner).deposit(depositAmount);
    });

    it("Should allow owner to withdraw", async function () {
      const withdrawAmount = 5n * 10n ** 18n;
      const userBalanceBefore = await axcnh.balanceOf(user);
      
      await vault.connect(ownerSigner).withdraw(user, withdrawAmount);
      
      const userBalanceAfter = await axcnh.balanceOf(user);
      expect(userBalanceAfter - userBalanceBefore).to.equal(withdrawAmount);
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        vault.connect(userSigner).withdraw(user, 5n * 10n ** 18n)
      ).to.be.reverted;
    });

    it("Should reduce liquidity pool on withdraw", async function () {
      const withdrawAmount = 5n * 10n ** 18n;
      
      const statsBefore = await vault.getVaultStats();
      
      await vault.connect(ownerSigner).withdraw(user, withdrawAmount);
      
      const statsAfter = await vault.getVaultStats();
      expect(statsBefore[2] - statsAfter[2]).to.equal(withdrawAmount);
    });
  });

  describe("Vault Stats", function () {
    it("Should track vault statistics correctly", async function () {
      const depositAmount = 100n * 10n ** 18n;
      
      await axcnh.connect(userSigner).approve(vault.target, depositAmount);
      await vault.connect(userSigner).deposit(depositAmount);
      
      const stats = await vault.getVaultStats();
      expect(stats[0]).to.equal(depositAmount);
      expect(stats[1]).to.equal(90n * 10n ** 18n);
      expect(stats[2]).to.equal(10n * 10n ** 18n);
    });
  });
});
