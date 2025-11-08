const { initiateDeveloperControlledWalletsClient } = require("@circle-fin/developer-controlled-wallets");
require('dotenv').config();

/**
 * Test script to verify API key works
 */
async function testApiKey() {
  const apiKey = process.env.CIRCLE_API_KEY;
  
  if (!apiKey) {
    console.error("❌ CIRCLE_API_KEY not found in .env");
    process.exit(1);
  }
  
  console.log("🔑 Testing API Key...\n");
  console.log(`API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}\n`);
  
  // Try to create a client and list wallet sets (this will test the API key)
  try {
    // Note: We need a dummy entity secret for the client, but we're just testing the API key
    const dummySecret = '0000000000000000000000000000000000000000000000000000000000000000';
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: apiKey,
      entitySecret: dummySecret,
    });
    
    // Try to list wallet sets - this will fail if API key is wrong, but with different error
    await client.listWalletSets();
    console.log("✅ API Key is valid!");
  } catch (error) {
    if (error.response?.status === 401) {
      console.error("❌ API Key is INVALID or has wrong permissions");
      console.error("   Error:", error.message);
      console.error("\nPlease check:");
      console.error("   1. API key is correct in Circle Console");
      console.error("   2. API key is active");
      console.error("   3. API key has Developer-Controlled Wallets permissions");
    } else {
      console.log("⚠️  API Key might be valid (got different error):", error.message);
      console.log("   This could mean the API key works but Entity Secret is needed");
    }
  }
}

testApiKey()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



