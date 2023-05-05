const { expect } = require("chai");
const { ethers } = require("hardhat");

const initialSupply = 100000;
const tokenName = "KashToken";
const tokenSymbol = "KSH";

describe("Kash token test", () => {
  before(async () => {
    const availableSigners = await ethers.getSigner();
    this.deployer = availableSigners[0];

    const KashToken = await ethers.getContractFactory("KashToken");
    this.kashToken = await KashToken.deploy(initialSupply);
    await this.kashToken.deployed();
  });

  it("should be named KashToken", async () => {
    const fetchedTokenName = await this.kashToken.name();
    expect(fetchedTokenName).to.be.equal(tokenName);
  });
  it("should have symbol KSH", async () => {
    const fetchedTokenName = await this.kashToken.symbol();
    expect(fetchedTokenName).to.be.equal(tokenSymbol);
  });
  it("should have totalsupply passed in during deploying", async () => {
    const [fetchedTotalSupply, decimals] = await Promise.all([
      this.kashToken.totalSupply(),
      this.kashToken.decimals(),
    ]);
    const expectedTotalSupply = ethers.BigNumber.from(initialSupply).mul(
      ethers.BigNumber.from(10).pow(decimals)
    );
    expect(fetchedTotalSupply.eq(expectedTotalSupply)).to.be.true;
  });
});
