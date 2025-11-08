const circleWallet = require('../services/circleWallet');

async function main() {
  console.log("📦 Creating Wallet Set...\n");
  
  try {
    const response = await circleWallet.createWalletSet('Arc Real Estate Wallet Set');
    
    console.log("✅ Wallet Set created successfully!");
    console.log("\n📋 Wallet Set Details:");
    console.log(`   ID: ${response.walletSet?.id}`);
    console.log(`   Name: Arc Real Estate Wallet Set`);
    console.log(`   Custody Type: ${response.walletSet?.custodyType}`);
    console.log(`   Created: ${response.walletSet?.createDate}`);
    
    console.log("\n💾 Add to backend/.env:");
    console.log(`   CIRCLE_WALLET_SET_ID=${response.walletSet?.id}`);
    console.log("\n💾 Add to contracts/.env:");
    console.log(`   CIRCLE_WALLET_SET_ID=${response.walletSet?.id}`);
    
  } catch (error) {
    console.error("❌ Error creating Wallet Set:");
    console.error(error.message);
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



