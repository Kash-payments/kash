const { expect } = require("chai");
const { ethers } = require("hardhat");

const initialSupply = 100000;
const tokenName = "KashToken";
const tokenSymbol = "KSH";

const eip712DomainTypeDefinition = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const metaTxTypeDefinition = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
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
      "KashTokenForwarder"
    );

    kashTokenForwarder = await KashTokenForwarder.deploy();
    await kashTokenForwarder.deployed();

    this.kashToken = await KashToken.deploy(
      initialSupply,
      kashTokenForwarder.address
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

  it("Transfer tokens from account A to B without account A paying for gas fees", async () => {
    // using relayer as the transaction sender when executing contract functions
    const forwarderContractTmpInstance = await kashTokenForwarder.connect(
      relayerAccount
    );
    console.log("deployer", deployer.address);
    console.log("reciverAccount", receiverAccount.address);
    console.log("releyerAccount", relayerAccount.address);

    const { chainId } = await relayerAccount.provider.getNetwork();
    const userAccountA = deployer;
    const userAccountB = receiverAccount;

    // Getting "user" and relayer ETH balance before transaction
    const userAccountAEthersBeforeTx = await userAccountA.getBalance();
    const relayerAccountEthersBeforeTx = await relayerAccount.getBalance();

    // Getting relayer token balance
    const relayerTokensBeforeTx = await this.kashToken.balanceOf(
      relayerAccount.address
    );

    // Getting actual user nonce
    const deployerCurrentNonce = await kashTokenForwarder.getNonce(
      deployer.address
    );

    const totalAmountToTransfer = ethers.BigNumber.from(1).mul(
      ethers.BigNumber.from(10).pow(10)
    );
    // Meta transaction values
    const messageValues = {
      from: "0x51e7341e70436b92F711C8A43Af882010eDeae48", //Using user address
      to: "0x4a947a1Ba03D9dbaEc8BE9E9f109Cb4AdDC6a330", // to token contract address
      nonce: "0", // actual nonce for user
      data: this.kashToken.interface.encodeFunctionData("transfer", [
        "0x162198beA1Cf8a9d04651dE8465Cb30Cd57d2468",
        totalAmountToTransfer,
      ]), // encoding function call for "transfer(address _to, uint256 amount)"
    };
    const hardcoded = this.kashToken.interface.encodeFunctionData("transfer", [
      "0x162198beA1Cf8a9d04651dE8465Cb30Cd57d2468",
      totalAmountToTransfer,
    ]);
    console.log("hardcoded", hardcoded);

    // Gettting typed Data so our Meta-Tx structura can be signed
    const typedData = getTypedData({
      domainValues: {
        name: "KashTokenForwarder",
        version: "0.0.1",
        chainId: chainId,
        verifyingContract: "0x715637106802084DE28811d2432e19eb4C68550d",
      },
      primaryType: "MetaTx",
      messageValues,
    });

    // Getting signature for Meta-Tx struct using user keys
    const signedMessage = await ethers.provider.send("eth_signTypedData_v4", [
      userAccountA.address,
      typedData,
    ]);
    const deployerBalance = await this.kashToken.balanceOf(deployer.address);
    console.log(typedData);

    console.log("hola", JSON.stringify(messageValues));
    console.log("test", signedMessage);

    // executing transaction
    await forwarderContractTmpInstance.executeFunction(
      messageValues,
      signedMessage
    );

    // Getting user and relayer ETH balance before transaction
    const userAccountAEthersAfterTx = await userAccountA.getBalance();
    const relayerAccountEthersAfterTx = await relayerAccount.getBalance();

    // Getting user token balance after transaction
    const relayerTokensAfterTx = await this.kashToken.balanceOf(
      relayerAccount.address
    );

    // Getting receiver token balance
    const userAccountBtokens = await this.kashToken.balanceOf(
      userAccountB.address
    );

    // Making sure the receiver got the transferred balance
    expect(userAccountBtokens.eq(totalAmountToTransfer)).to.be.true;

    // Making sure the "user" ETH balance is the same as it was before sending the transaction (it did not have to pay for the transaction fee)
    expect(userAccountAEthersBeforeTx.eq(userAccountAEthersAfterTx)).to.be.true;
    // Making sure the relayer ETH balance decreased because it paid for the transaction fee
    expect(relayerAccountEthersAfterTx.lt(relayerAccountEthersBeforeTx)).to.be
      .true;
    // Making sure the relayer token balance did not change
    expect(relayerTokensAfterTx.eq(relayerTokensBeforeTx));
    expect(relayerTokensAfterTx.eq(0)).to.be.equal(true);
    expect(relayerTokensBeforeTx.eq(0)).to.be.equal(true);
  });
});
