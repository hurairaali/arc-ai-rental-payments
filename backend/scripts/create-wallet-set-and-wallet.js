require('dotenv').config();
const circleWallet = require('../services/circleWallet');

/**
 * Script to create Wallet Set and Wallet for Arc blockchain
 * 
 * This will:
 * 1. Create a Wallet Set
 * 2. Create an EOA wallet on Arc blockchain
 * 3. Save Wallet Set ID and Wallet ID to .env
 */

async function main() {
  console.log("🚀 Creating Wallet Set and Wallet for Arc\n");
  
  try {
    // Step 1: Get or Create Wallet Set
    let walletSetId = process.env.CIRCLE_WALLET_SET_ID;
    
    if (!walletSetId) {
      console.log("Step 1: Creating Wallet Set...");
      const walletSetResponse = await circleWallet.createWalletSet("Arc Real Estate Wallet Set");
      walletSetId = walletSetResponse.walletSet?.id;
      
      if (!walletSetId) {
        throw new Error("Failed to get Wallet Set ID from response");
      }
      
      console.log(`✅ Wallet Set created!`);
      console.log(`   ID: ${walletSetId}\n`);
    } else {
      console.log("Step 1: Using existing Wallet Set...");
      console.log(`   ID: ${walletSetId}\n`);
    }
    
    // Step 2: Create Wallet on Arc
    console.log("Step 2: Creating Wallet on Arc blockchain...");
    console.log("   Account Type: EOA (Externally Owned Account)");
    console.log("   Blockchain: ARC-TESTNET (Arc Testnet)");
    console.log("   Count: 1\n");
    
    const walletResponse = await circleWallet.createWallet(
      walletSetId,
      ['ARC-TESTNET'],  // Arc blockchain identifier
      'EOA'             // Externally Owned Account
    );
    
    const wallets = walletResponse.wallets || [];
    if (wallets.length === 0) {
      throw new Error("No wallets created");
    }
    
    const wallet = wallets[0];
    const walletId = wallet.id;
    const walletAddress = wallet.addresses?.find(addr => addr.blockchain === 'ARC-TESTNET')?.address || wallet.address;
    
    console.log(`✅ Wallet created!`);
    console.log(`   Wallet ID: ${walletId}`);
    console.log(`   Wallet Address: ${walletAddress}`);
    console.log(`   Blockchain: ARC-TESTNET`);
    console.log(`   Account Type: EOA`);
    console.log(`   State: ${wallet.state}\n`);
    
    // Step 3: Show what to add to .env
    console.log("=".repeat(60));
    console.log("📋 ADD TO YOUR .env FILES:");
    console.log("=".repeat(60));
    console.log("\nbackend/.env:");
    console.log(`CIRCLE_WALLET_SET_ID=${walletSetId}`);
    console.log(`CIRCLE_DEPLOYER_WALLET_ID=${walletId}`);
    console.log(`CIRCLE_DEPLOYER_ADDRESS=${walletAddress}`);
    console.log("\ncontracts/.env:");
    console.log(`CIRCLE_WALLET_SET_ID=${walletSetId}`);
    console.log(`CIRCLE_DEPLOYER_WALLET_ID=${walletId}`);
    console.log(`CIRCLE_DEPLOYER_ADDRESS=${walletAddress}`);
    console.log("\n" + "=".repeat(60));
    console.log("⚠️  IMPORTANT NEXT STEP:");
    console.log("=".repeat(60));
    console.log("\nFund your wallet with testnet USDC for gas fees:");
    console.log(`   Address: ${walletAddress}`);
    console.log("\nGet testnet USDC from Arc Testnet Faucet");
    console.log("(Check hackathon documentation for faucet URL)\n");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
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

