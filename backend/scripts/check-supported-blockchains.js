require('dotenv').config();
const circleWallet = require('../services/circleWallet');

/**
 * Script to check what blockchains are supported
 * We'll try to create a wallet with different Arc identifiers
 */

async function checkBlockchains() {
  console.log("🔍 Checking Supported Blockchains for Arc\n");
  
  const walletSetId = process.env.CIRCLE_WALLET_SET_ID;
  
  if (!walletSetId) {
    console.error("❌ CIRCLE_WALLET_SET_ID not found in .env");
    process.exit(1);
  }
  
  // List of possible Arc identifiers to try
  const possibleIdentifiers = [
    'ARC',
    'ARC-TESTNET',
    'ARC-TEST',
    'ARC-TESTNET-CIRCLE',
    'ETH-ARC',  // Since Arc is EVM-compatible
  ];
  
  console.log(`Using Wallet Set: ${walletSetId}\n`);
  console.log("Trying different Arc blockchain identifiers...\n");
  
  for (const identifier of possibleIdentifiers) {
    try {
      console.log(`Trying: "${identifier}"...`);
      const result = await circleWallet.createWallet(
        walletSetId,
        [identifier],
        'EOA'
      );
      
      console.log(`✅ SUCCESS! Arc identifier is: "${identifier}"`);
      console.log(`   Wallet ID: ${result.wallets[0].id}`);
      console.log(`   Address: ${result.wallets[0].addresses[0].address}\n`);
      return;
      
    } catch (error) {
      if (error.response?.data?.code === 156027) {
        console.log(`   ❌ Not supported: "${identifier}"`);
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    }
  }
  
  console.log("\n❌ None of the common identifiers worked.");
  console.log("\n💡 Next steps:");
  console.log("   1. Check Circle Console for supported blockchains");
  console.log("   2. Check hackathon documentation");
  console.log("   3. Arc might not be directly supported yet");
  console.log("   4. You might need to use a different approach");
}

checkBlockchains()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



