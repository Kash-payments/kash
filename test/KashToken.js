const { expect } = require("chai");
const { ethers } = require("hardhat");

const initialSupply = 100000;
const tokenName = "KashToken";
const tokenSymbol = "KSH";
const chainLinkOracle = "0xeA6721aC65BCeD841B8ec3fc5fEdeA6141a0aDE4"

const eip712DomainTypeDefinition = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const metaTxTypeDefinition = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "gas", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "data", type: "bytes" },
];

function getTypedData(typedDataInput) {
  return {
    types: {
      EIP712Domain: eip712DomainTypeDefinition,
      [typedDataInput.primaryType]: metaTxTypeDefinition,
    },
    primaryType: typedDataInput.primaryType,
    domain: typedDataInput.domainValues,
    message: typedDataInput.messageValues,
  };
}

describe("Kash token test", () => {
  let kashToken;
  let kashTokenForwarder;
  let deployer;
  let receiverAccount;
  let relayerAccount;
  before(async () => {
    const availableSigners = await ethers.getSigners();
    deployer = availableSigners[0];
    // user account
    userAccount = availableSigners[1];
    // account that will receive the tokens
    receiverAccount = availableSigners[2];
    // account that will act as gas relayer
    relayerAccount = availableSigners[3];

    const KashToken = await ethers.getContractFactory("KashToken");
    const KashTokenForwarder = await ethers.getContractFactory(
      "MinimalForwarder"
    );

    kashTokenForwarder = await KashTokenForwarder.deploy();
    await kashTokenForwarder.deployed();

    this.kashToken = await KashToken.deploy(
      initialSupply,
      chainLinkOracle
    );
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

  it("register user", async () => {
    await this.kashToken.setUserData("123", "arturo", "arturo@test", 100, receiverAccount.address);
    const user = await this.kashToken.userData("123")
    expect(user[2]).to.be.equal('123')
  })
  // it("purchase token", async () => {
  //   const forwarderContractTmpInstance = await kashTokenForwarder.connect(
  //     relayerAccount
  //   );
  //   const { chainId } = await relayerAccount.provider.getNetwork();
  //   const userAccountA = deployer;
  //   const deployerCurrentNonce = await kashTokenForwarder.getNonce(
  //     deployer.address
  //   );
  //   const gasLimit = 250000; // Transaction gas limit
  //   const subscriptionId = "1006";
  //   const source = await fs.readFile("./Stripe-request.js", "utf8");
  //   const args = ["pi_3N8nG4K73vMS5LDK0X665wor"];

  //   const messageValues = {
  //     from: userAccountA.address, //Using user address
  //     to: this.kashToken.address, // to token contract address
  //     value: 0,
  //     gas: 1e6,
  //     nonce: deployerCurrentNonce.toString(), // actual nonce for user
  //     data: this.kashToken.interface.encodeFunctionData("purchaseToken", [
  //       userAccountA.address,
  //       source,
  //       encryptedSecrets ?? "0x",
  //       args ?? [], // Chainlink Functions request args
  //       subscriptionId, // Subscription ID
  //       gasLimit, // Gas limit for the transaction
  //     ]), // encoding function call for "transfer(address _to, uint256 amount)"
  //   };

  //   // Gettting typed Data so our Meta-Tx structura can be signed
  //   const typedData = getTypedData({
  //     domainValues: {
  //       name: "MinimalForwarder",
  //       version: "0.0.1",
  //       chainId: chainId,
  //       verifyingContract: kashTokenForwarder.address,
  //     },
  //     primaryType: "ForwardRequest",
  //     messageValues,
  //   });
  //   const signedMessage = await ethers.provider.send("eth_signTypedData_v4", [
  //     userAccountA.address,
  //     typedData,
  //   ]);
  //   await forwarderContractTmpInstance.execute(messageValues, signedMessage);

  // })

});
