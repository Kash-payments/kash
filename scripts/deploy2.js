// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const initialSupply = 100000;
const oracleAddress = "0xeA6721aC65BCeD841B8ec3fc5fEdeA6141a0aDE4";
async function main() {

  const KashToken = await hre.ethers.getContractFactory("KashToken");
  const kashToken = await KashToken.deploy(
    initialSupply,
    oracleAddress
  );
  await kashToken.deployed();

  console.log(`Token deployed to ${kashToken.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
