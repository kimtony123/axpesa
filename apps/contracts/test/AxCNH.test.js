const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AxCNH Token", function () {
  let axcnh;
  let owner;
  let minter;
  let user;
  let minterAccount;
  let userAccount;

  beforeEach(async function () {
    const [ownerAccount, minterAccountInner, userAccountInner] = await ethers.getSigners();
    
    owner = await ownerAccount.getAddress();
    minter = await minterAccountInner.getAddress();
    user = await userAccountInner.getAddress();
    minterAccount = minterAccountInner;
    userAccount = userAccountInner;

    const AxCNH = await ethers.getContractFactory("AxCNH");
    axcnh = await AxCNH.deploy(owner);
    await axcnh.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const name = await axcnh.name();
      const symbol = await axcnh.symbol();
      expect(name).to.equal("AxPesa CNH");
      expect(symbol).to.equal("AxCNH");
    });

    it("Should set deployer as owner", async function () {
      const contractOwner = await axcnh.owner();
      expect(contractOwner.toLowerCase()).to.equal(owner.toLowerCase());
    });

    it("Should start with zero total supply", async function () {
      const totalSupply = await axcnh.totalSupply();
      expect(totalSupply).to.equal(0n);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint", async function () {
      const amount = 1000n * 10n ** 18n;
      await axcnh.mint(user, amount);
      
      const balance = await axcnh.balanceOf(user);
      expect(balance).to.equal(amount);
    });

    it("Should allow minter to mint after being added", async function () {
      await axcnh.addMinter(minter);
      const amount = 1000n * 10n ** 18n;
      await axcnh.connect(minterAccount).mint(user, amount);
      
      const balance = await axcnh.balanceOf(user);
      expect(balance).to.equal(amount);
    });

    it("Should not allow non-minter to mint", async function () {
      const amount = 1000n * 10n ** 18n;
      await expect(
        axcnh.connect(minterAccount).mint(user, amount)
      ).to.be.reverted;
    });
  });
});
