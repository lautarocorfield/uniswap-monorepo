const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenB Contract", function () {
  let TokenB;
  let tokenB;
  let owner;
  let recipient;
  let addr1;
  let addr2;
  let addrs;

  const initialSupply = ethers.parseUnits("1000000000000000000", 18);
  const tokenName = "tokenB";
  const tokenSymbol = "TOKB";

  beforeEach(async function () {
    // Get the ContractFactory and Signers here
    TokenB = await ethers.getContractFactory("TokenB");
    [owner, recipient, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy a new TokenB contract before each test
    tokenB = await TokenB.deploy(recipient.address, owner.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await tokenB.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the recipient", async function () {
      const recipientBalance = await tokenB.balanceOf(recipient.address);
      expect(recipientBalance).to.equal(initialSupply);
    });

    it("Should set the correct token name and symbol", async function () {
      expect(await tokenB.name()).to.equal(tokenName);
      expect(await tokenB.symbol()).to.equal(tokenSymbol);
    });

    it("Should have 18 decimals", async function () {
      expect(await tokenB.decimals()).to.equal(18);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from recipient to addr1
      const transferAmount = ethers.parseUnits("50", 18);
      await tokenB.connect(recipient).transfer(addr1.address, transferAmount);

      const addr1Balance = await tokenB.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      const recipientNewBalance = await tokenB.balanceOf(recipient.address);
      expect(recipientNewBalance).to.equal(initialSupply - transferAmount);
    });

    it("Should update balances after transfers", async function () {
      const initialRecipientBalance = await tokenB.balanceOf(recipient.address);
      const transferAmount = ethers.parseUnits("100", 18);

      // Transfer from recipient to addr1
      await tokenB.connect(recipient).transfer(addr1.address, transferAmount);
      
      // Transfer from addr1 to addr2
      await tokenB.connect(addr1).transfer(addr2.address, transferAmount);

      const finalRecipientBalance = await tokenB.balanceOf(recipient.address);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance - transferAmount);

      const addr1Balance = await tokenB.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(0);

      const addr2Balance = await tokenB.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it("Should emit Transfer events", async function () {
      const transferAmount = ethers.parseUnits("50", 18);
      
      await expect(tokenB.connect(recipient).transfer(addr1.address, transferAmount))
        .to.emit(tokenB, "Transfer")
        .withArgs(recipient.address, addr1.address, transferAmount);
    });
  });

  describe("Minting", function () {
    const mintAmount = ethers.parseUnits("500", 18);

    it("Should allow owner to mint tokens", async function () {
      await expect(tokenB.connect(owner).mint(addr1.address, mintAmount))
        .to.emit(tokenB, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, mintAmount);

      expect(await tokenB.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should increase total supply after minting", async function () {
      const initialSupply = await tokenB.totalSupply();
      await tokenB.connect(owner).mint(addr1.address, mintAmount);
      expect(await tokenB.totalSupply()).to.equal(initialSupply + mintAmount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      await expect(
        tokenB.connect(addr1).mint(addr1.address, mintAmount)
      ).to.be.revertedWithCustomError(tokenB, "OwnableUnauthorizedAccount");
    });

    it("Should mint to the correct address", async function () {
      await tokenB.connect(owner).mint(addr2.address, mintAmount);
      expect(await tokenB.balanceOf(addr2.address)).to.equal(mintAmount);
      expect(await tokenB.balanceOf(addr1.address)).to.equal(0);
    });
  });

  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      await tokenB.connect(owner).transferOwnership(addr1.address);
      expect(await tokenB.owner()).to.equal(addr1.address);
    });

    it("Should prevent non-owners from transferring ownership", async function () {
      await expect(
        tokenB.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWithCustomError(tokenB, "OwnableUnauthorizedAccount");
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(tokenB.connect(owner).transferOwnership(addr1.address))
        .to.emit(tokenB, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
    });

    it("New owner should be able to mint", async function () {
      await tokenB.connect(owner).transferOwnership(addr1.address);
      const mintAmount = ethers.parseUnits("100", 18);
      
      await expect(tokenB.connect(addr1).mint(addr2.address, mintAmount))
        .to.emit(tokenB, "Transfer")
        .withArgs(ethers.ZeroAddress, addr2.address, mintAmount);
    });

    it("Old owner should not be able to mint after transfer", async function () {
      await tokenB.connect(owner).transferOwnership(addr1.address);
      const mintAmount = ethers.parseUnits("100", 18);
      
      await expect(
        tokenB.connect(owner).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(tokenB, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle minting zero tokens", async function () {
      const initialSupply = await tokenB.totalSupply();
      await tokenB.connect(owner).mint(addr1.address, 0);
      expect(await tokenB.totalSupply()).to.equal(initialSupply);
      expect(await tokenB.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should handle transferring zero tokens", async function () {
      await expect(tokenB.connect(recipient).transfer(addr1.address, 0))
        .to.emit(tokenB, "Transfer")
        .withArgs(recipient.address, addr1.address, 0);
    });
  });
});