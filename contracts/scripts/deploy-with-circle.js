const hre = require("hardhat");
const { ethers } = require("ethers");
const {
  initiateSmartContractPlatformClient,
} = require("@circle-fin/smart-contract-platform");
require("dotenv").config();

/**
 * Deploy contracts using Circle Smart Contract Platform (SCP) API
 * Documentation: https://developers.circle.com/contracts/scp-deploy-smart-contract
 */

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;
const WALLET_ID = process.env.CIRCLE_DEPLOYER_WALLET_ID;
const BLOCKCHAIN = 'ARC-TESTNET';

if (!CIRCLE_API_KEY) {
  throw new Error("CIRCLE_API_KEY is required in contracts/.env");
}

if (!CIRCLE_ENTITY_SECRET) {
  throw new Error("CIRCLE_ENTITY_SECRET is required in contracts/.env");
}

if (!WALLET_ID) {
  throw new Error("CIRCLE_DEPLOYER_WALLET_ID is required in contracts/.env");
}

// Initialize Circle Smart Contract Platform SDK client
const circleContractSdk = initiateSmartContractPlatformClient({
  apiKey: CIRCLE_API_KEY,
  entitySecret: CIRCLE_ENTITY_SECRET,
});

async function deployContract(contractName, constructorArgs = [], description = '') {
  console.log(`\n📦 Deploying ${contractName}...`);
  
  // Compile and get bytecode and ABI
  const ContractFactory = await hre.ethers.getContractFactory(contractName);
  const contractBytecode = ContractFactory.bytecode;
  
  // Get ABI from the contract interface
  const contractInterface = ContractFactory.interface;
  // Format ABI as JSON string (Circle API requires stringified JSON)
  // Get ABI from artifacts (more reliable)
  const artifact = await hre.artifacts.readArtifact(contractName);
  const abiJSON = JSON.stringify(artifact.abi);
  
  // Ensure bytecode has 0x prefix
  const bytecode = contractBytecode.startsWith('0x') ? contractBytecode : `0x${contractBytecode}`;
  
  console.log(`   Bytecode length: ${bytecode.length} characters`);
  console.log(`   ABI length: ${abiJSON.length} characters`);
  console.log(`   Constructor args: ${constructorArgs.length}`);
  
  // Deploy using Circle's Smart Contract Platform API
  console.log(`   Creating deployment transaction...`);
  const response = await circleContractSdk.deployContract({
    name: `${contractName} Contract`,
    description: description || `Deployed ${contractName} on ${BLOCKCHAIN}`,
    walletId: WALLET_ID,
    blockchain: BLOCKCHAIN,
    fee: {
      type: 'level',
      config: {
        feeLevel: 'MEDIUM',
      },
    },
    constructorParameters: constructorArgs,
    abiJSON: abiJSON,
    bytecode: bytecode,
  });
  
  const contractId = response.data?.contractId;
  const transactionId = response.data?.transactionId;
  
  if (!contractId || !transactionId) {
    throw new Error("Failed to create deployment: " + JSON.stringify(response.data));
  }
  
  console.log(`   Contract ID: ${contractId}`);
  console.log(`   Transaction ID: ${transactionId}`);
  console.log(`   Waiting for confirmation...`);
  
  // Wait for contract to be deployed
  const contractAddress = await waitForContractDeployment(contractId);
  
  console.log(`✅ ${contractName} deployed to: ${contractAddress}`);
  return contractAddress;
}

async function waitForContractDeployment(contractId, maxWaitTime = 300000) {
  const startTime = Date.now();
  const pollInterval = 5000; // Check every 5 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await circleContractSdk.getContract({ id: contractId });
      const contract = response.data?.contract;
      
      if (!contract) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }
      
      const status = contract.status;
      
      if (status === 'COMPLETE') {
        const contractAddress = contract.contractAddress;
        if (contractAddress) {
          return contractAddress;
        }
        throw new Error("Contract deployed but address not found");
      }
      
      if (status === 'FAILED') {
        throw new Error(`Contract deployment failed: ${contract.errorMessage || 'Unknown error'}`);
      }
      
      // Show progress
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      if (error.response?.status === 404) {
        // Contract not found yet, wait a bit more
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Contract deployment timeout - deployment may still be pending');
}

async function main() {
  console.log("🚀 Deploying contracts using Circle Smart Contract Platform...");
  console.log(`   Wallet ID: ${WALLET_ID}`);
  console.log(`   Blockchain: ${BLOCKCHAIN}\n`);
  
  try {
    // Step 1: Compile contracts
    console.log("📝 Compiling contracts...");
    await hre.run("compile");
    console.log("✅ Contracts compiled\n");
    
    // Step 2: Deploy PropertyToken
    const propertyTokenAddress = await deployContract(
      "PropertyToken",
      [],
      "PropertyToken ERC721 contract for real estate tokenization"
    );
    
    // Step 3: Deploy PaymentManager
    // Need USDC address for PaymentManager constructor
    const USDC_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
    
    if (!USDC_ADDRESS || USDC_ADDRESS === "0x0000000000000000000000000000000000000000") {
      console.log("\n⚠️  WARNING: USDC_CONTRACT_ADDRESS not set!");
      console.log("   PaymentManager requires USDC address.");
      console.log("   Deploying PropertyToken only for now.\n");
      
      console.log("\n" + "=".repeat(60));
      console.log("✅ DEPLOYMENT COMPLETE!");
      console.log("=".repeat(60));
      console.log("\nContract Addresses:");
      console.log(`  PropertyToken: ${propertyTokenAddress}`);
      console.log("\n📋 Add to your .env files:");
      console.log(`  PROPERTY_TOKEN_ADDRESS=${propertyTokenAddress}`);
      console.log("\n⚠️  To deploy PaymentManager, set USDC_CONTRACT_ADDRESS in .env");
    } else {
      const paymentManagerAddress = await deployContract(
        "PaymentManager",
        [propertyTokenAddress, USDC_ADDRESS],
        "PaymentManager for automated USDC rental payments"
      );
      
      console.log("\n" + "=".repeat(60));
      console.log("✅ DEPLOYMENT COMPLETE!");
      console.log("=".repeat(60));
      console.log("\nContract Addresses:");
      console.log(`  PropertyToken: ${propertyTokenAddress}`);
      console.log(`  PaymentManager: ${paymentManagerAddress}`);
      console.log("\n📋 Add to your .env files:");
      console.log(`  PROPERTY_TOKEN_ADDRESS=${propertyTokenAddress}`);
      console.log(`  PAYMENT_MANAGER_ADDRESS=${paymentManagerAddress}`);
    }
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    if (error.response) {
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
