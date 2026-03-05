const { ethers } = require("ethers");

async function main() {
  // Connect to your local Hardhat node
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

  // Replace this with your contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Check if there is code at this address
  const code = await provider.getCode(contractAddress);
  console.log("Code at address:", code);

  if (code === "0x") {
    console.log("No contract deployed at this address!");
  } else {
    console.log("Contract is deployed here ✅");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
