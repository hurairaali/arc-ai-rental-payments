const hre = require("hardhat");

/**
 * Deploy PaymentManager separately after you have USDC address
 * Usage: npx hardhat run scripts/deploy-payment-manager.js --network arcTestnet
 */
async function main() {
  console.log("Deploying PaymentManager...\n");

  // Get USDC address from environment
  const USDC_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
  const PROPERTY_TOKEN_ADDRESS = process.env.PROPERTY_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  if (!USDC_ADDRESS || USDC_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ ERROR: USDC_CONTRACT_ADDRESS not set in .env file!");
    console.error("\nTo deploy PaymentManager:");
    console.error("1. Get USDC contract address from hackathon docs/workshops");
    console.error("2. Add to contracts/.env: USDC_CONTRACT_ADDRESS=0x...");
    console.error("3. Run: npm run deploy:payment-manager");
    process.exit(1);
  }

  if (!PROPERTY_TOKEN_ADDRESS || PROPERTY_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ ERROR: PROPERTY_TOKEN_ADDRESS not set!");
    console.error("Please set PROPERTY_TOKEN_ADDRESS in .env file.");
    process.exit(1);
  }

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("\nUsing:");
  console.log("- PropertyToken:", PROPERTY_TOKEN_ADDRESS);
  console.log("- USDC:", USDC_ADDRESS);
  console.log("");

  // Deploy PaymentManager
  console.log("Deploying PaymentManager...");
  const PaymentManager = await hre.ethers.getContractFactory("PaymentManager");
  const paymentManager = await PaymentManager.deploy(PROPERTY_TOKEN_ADDRESS, USDC_ADDRESS);
  await paymentManager.waitForDeployment();
  const paymentManagerAddress = await paymentManager.getAddress();

  console.log("\n✅ PaymentManager deployed successfully!");
  console.log("\nContract Address:", paymentManagerAddress);
  console.log("\n📋 Save to backend/.env:");
  console.log(`PAYMENT_MANAGER_ADDRESS=${paymentManagerAddress}`);
  console.log("\n📋 Save to frontend/.env:");
  console.log(`REACT_APP_PAYMENT_MANAGER_ADDRESS=${paymentManagerAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });






