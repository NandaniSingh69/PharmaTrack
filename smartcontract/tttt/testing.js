import { ethers } from "ethers";

async function main() {
  // Connect to your Ethereum provider (MetaMask or Hardhat local)
  // For Hardhat local, you can use:
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const code = await provider.getCode(contractAddress);
  console.log("Code at contract address:", code);

  if (code === "0x") {
    console.log("No contract deployed at this address or wrong network");
  } else {
    console.log("Contract is deployed at this address.");
  }
}

main().catch(console.error);
