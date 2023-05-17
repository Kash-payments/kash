const {
  DefenderRelayProvider,
  DefenderRelaySigner,
} = require("defender-relay-client/lib/ethers");
const { ethers } = require("hardhat");
const { writeFileSync } = require("fs");

async function main() {
  const accounts = await ethers.provider.listAccounts();
  const mainAddress = accounts[0];
  require("dotenv").config();
  const credentials = {
    apiKey: process.env.RELAYER_API_KEY,
    apiSecret: process.env.RELAYER_API_SECRET,
  };
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });

  const Forwarder = await ethers.getContractFactory("MinimalForwarder");
  const forwarder = await Forwarder.connect(relaySigner)
    .deploy()
    .then((f) => f.deployed());

  const Registry = await ethers.getContractFactory("KashToken");
  const registry = await Registry.connect(relaySigner)
    .deploy(100000, forwarder.address, mainAddress)
    .then((f) => f.deployed());

  writeFileSync(
    "deploy.json",
    JSON.stringify(
      {
        MinimalForwarder: forwarder.address,
        Registry: registry.address,
      },
      null,
      2
    )
  );

  console.log(
    `MinimalForwarder: ${forwarder.address}\n
     Registry: ${registry.address}`
  );
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
