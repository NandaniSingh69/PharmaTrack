const { ethers } = require("hardhat");

async function main() {
  // Deploy the TrackPharma contract
  const TrackPharma = await ethers.getContractFactory("TrackPharma");
  const pharma = await TrackPharma.deploy("YourTeamName", "yourteam@example.com");
  await pharma.deployed();

  // Print the contract address
  console.log("TrackPharma deployed to:", pharma.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
