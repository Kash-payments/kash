const { ethers } = require("hardhat");
const fs = require("fs").promises;

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

const ForwarderAddress = "0x2c88Fba9214e6A95CF92d10aFdDAD8592E08BD5B";
const TokenAddress = "0x7364260Ada2373BA81d0aD24C8C6F8583065f2f1";

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

  // transfer
  const gasLimit = 250000; // Transaction gas limit
  const subscriptionId = "1006";
  const source = fs.readFile("./Stripe-request.js", "utf8").toString();
  const args = ["pi_3N8nG4K73vMS5LDK0X665wor"];

  const messageValues = {
    from: addressA,
    to: token.address,
    value: 0,
    gas: 1e6,
    nonce: value.toString(),
    data: token.interface.encodeFunctionData("purchaseToken", [
      addressA,
      source,
      "0x",
      args,
      subscriptionId,
      gasLimit,
    ]),
  };
  console.log(source)
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
  // console.log("signed", signedMessage);
  // console.log("messageValues", messageValues);
  // const res = await forwarder.verify(messageValues, signedMessage);
  const res = await forwarder.execute(messageValues, signedMessage);
  console.log(res);
}

main();
