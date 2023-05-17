const { ethers } = require("hardhat");

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

const ForwarderAddress = "0x07b78dcd037813c0aF03952F91756639E430DA9E";
const TokenAddress = "0x52aba04AdC19A7295B8983ab9053935351038B29";
const addressB = "0x715637106802084DE28811d2432e19eb4C68550d";

async function main() {
  const accounts = await ethers.provider.listAccounts();
  const addressA = accounts[0];
  console.log(addressA);
  const balance = await ethers.provider.getBalance(accounts[0]);
  console.log(balance);
  const Forwarder = await ethers.getContractFactory("MinimalForwarder");
  const forwarder = Forwarder.attach(ForwarderAddress);
  const Token = await ethers.getContractFactory("KashToken");
  const token = Token.attach(TokenAddress);
  const value = await forwarder.getNonce(addressA);
  console.log("Forwarder nonce value is", value.toString());
  const totalAmountToTransfer = ethers.BigNumber.from(1).mul(
    ethers.BigNumber.from(10).pow(10)
  );
  // 100000000000000000000000
  console.log(totalAmountToTransfer);

  // transfer
  const messageValues = {
    from: addressA, //Using user address
    to: token.address, // to token contract address
    value: 0,
    gas: 1e6,
    nonce: value.toString(), // actual nonce for user
    data: token.interface.encodeFunctionData("transfer", [
      addressB,
      totalAmountToTransfer,
    ]), // encoding function call for "transfer(address _to, uint256 amount)"
  };
  const typedData = getTypedData({
    domainValues: {
      name: "MinimalForwarder",
      version: "0.0.1",
      chainId: 80001,
      verifyingContract: forwarder.address,
    },
    primaryType: "ForwardRequest",
    messageValues,
  });
  const signedMessage = await ethers.provider.send("eth_signTypedData_v4", [
    addressA,
    typedData,
  ]);
  console.log("signed", signedMessage);
  console.log("messageValues", messageValues);
  // const res = await forwarder.verifyMetaTx(messageValues, signedMessage);
  const res = await forwarder.execute(messageValues, signedMessage);
  console.log(res);
}

main();
