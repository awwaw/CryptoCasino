import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("==================================================");
  console.log("Start deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("Not enough ETH to deploy");
  }

  const SlotMachine = await ethers.getContractFactory("SlotMachine");

  const initialDeposit = ethers.parseEther("0.005"); 

  console.log("Deploying SlotMachine contract...");
  console.log("Adding initial deposit:", ethers.formatEther(initialDeposit), "ETH");

  const casino = await SlotMachine.deploy({ value: initialDeposit });

  console.log("Waiting for deployment transaction:", casino.deploymentTransaction()?.hash);
  
  await casino.waitForDeployment();

  const address = await casino.getAddress();
  
  console.log("==================================================");
  console.log("Contract deployed to:", address);
  console.log("==================================================");

  console.log("Waiting for etherscan to see new contract");
  await new Promise((resolve) => setTimeout(resolve, 60000));
  console.log("Now verifying");
  try {
    await run("verify:verify", {
        address: address,
        constructorArguments: [],
    });
    console.log("Verified successfully");
  } catch(e) {
    console.log("Failed to verify");
  }

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
