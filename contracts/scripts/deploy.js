const hre = require("hardhat");

async function main() {
  console.log("Deploying Real Estate Rental Payment System contracts...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy PropertyToken
  console.log("\nDeploying PropertyToken...");
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy();
  await propertyToken.waitForDeployment();
  const propertyTokenAddress = await propertyToken.getAddress();
  console.log("PropertyToken deployed to:", propertyTokenAddress);

  // Deploy PaymentManager
  // Note: You'll need to provide the USDC contract address on Arc testnet
  const USDC_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  if (USDC_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("\n⚠️  WARNING: USDC_CONTRACT_ADDRESS not set in .env file!");
    console.error("Please set USDC_CONTRACT_ADDRESS in your .env file before deploying PaymentManager.");
    return;
  }

  console.log("\nDeploying PaymentManager...");
  const PaymentManager = await hre.ethers.getContractFactory("PaymentManager");
  const paymentManager = await PaymentManager.deploy(propertyTokenAddress, USDC_ADDRESS);
  await paymentManager.waitForDeployment();
  const paymentManagerAddress = await paymentManager.getAddress();
  console.log("PaymentManager deployed to:", paymentManagerAddress);

  console.log("\n✅ Deployment complete!");
  console.log("\nContract addresses:");
  console.log("PropertyToken:", propertyTokenAddress);
  console.log("PaymentManager:", paymentManagerAddress);
  console.log("\nSave these addresses to your .env file:");
  console.log(`PROPERTY_TOKEN_ADDRESS=${propertyTokenAddress}`);
  console.log(`PAYMENT_MANAGER_ADDRESS=${paymentManagerAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });






