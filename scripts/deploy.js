// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const initialSupply = 100000;
async function main() {
  const accounts = await ethers.provider.listAccounts();
  const mainAddress = accounts[0];
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const lockedAmount = hre.ethers.utils.parseEther("0.001");

  const KashToken = await hre.ethers.getContractFactory("KashToken");
  const KashTokenForwarder = await ethers.getContractFactory(
    "MinimalForwarder"
  );

  const kashTokenForwarder = await KashTokenForwarder.deploy();
  await kashTokenForwarder.deployed();

  const kashToken = await KashToken.deploy(
    initialSupply,
    kashTokenForwarder.address,
    mainAddress
  );
  await kashToken.deployed();

  // const Lock = await hre.ethers.getContractFactory("KashToken");
  // const lock = await Lock.deploy(initialSupply);

  // await lock.deployed();

  // console.log(
  //   `Lock with ${ethers.utils.formatEther(
  //     lockedAmount
  //   )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`
  // );
  console.log(`Forwarder deployed to ${kashTokenForwarder.address}`);
  console.log(`Token deployed to ${kashToken.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
