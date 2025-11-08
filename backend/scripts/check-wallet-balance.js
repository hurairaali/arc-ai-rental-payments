require('dotenv').config();
const circleWallet = require('../services/circleWallet');

/**
 * Script to check wallet balance
 */

async function checkBalance() {
  console.log("💰 Checking Wallet Balance\n");
  
  const walletId = process.env.CIRCLE_DEPLOYER_WALLET_ID;
  const walletAddress = process.env.CIRCLE_DEPLOYER_ADDRESS;
  
  if (!walletId) {
    console.error("❌ CIRCLE_DEPLOYER_WALLET_ID not found in .env");
    process.exit(1);
  }
  
  console.log(`Wallet ID: ${walletId}`);
  if (walletAddress) {
    console.log(`Wallet Address: ${walletAddress}`);
  }
  console.log("");
  
  try {
    const balance = await circleWallet.getWalletBalance(walletId);
    
    console.log("📊 Wallet Balance:");
    console.log("=".repeat(60));
    
    if (balance.tokenBalances && balance.tokenBalances.length > 0) {
      balance.tokenBalances.forEach(token => {
        const symbol = token.token?.symbol || 'Unknown';
        const amount = token.amount || '0';
        const name = token.token?.name || 'Unknown Token';
        console.log(`  ${symbol} (${name}): ${amount}`);
      });
    } else {
      console.log("  No tokens found (wallet might be empty)");
    }
    
    console.log("=".repeat(60));
    console.log("");
    
    // Check if USDC balance exists (check for both USDC and USDC-TESTNET)
    const usdcBalance = balance.tokenBalances?.find(
      token => token.token?.symbol === 'USDC' || token.token?.symbol === 'USDC-TESTNET' || token.token?.symbol?.includes('USDC')
    );
    
    if (!usdcBalance || usdcBalance.amount === '0') {
      console.log("⚠️  WARNING: No USDC found in wallet!");
      console.log("");
      console.log("📋 To fund your wallet:");
      console.log(`   1. Go to Arc Testnet Faucet`);
      console.log(`   2. Send testnet USDC to: ${walletAddress || 'your wallet address'}`);
      console.log(`   3. Wait for transaction to complete`);
      console.log(`   4. Run this script again to check balance`);
    } else {
      const symbol = usdcBalance.token?.symbol || 'USDC';
      console.log(`✅ ${symbol} Balance: ${usdcBalance.amount} ${symbol}`);
      console.log("   ✅ Wallet is funded and ready for contract deployment!");
    }
    
  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
    if (error.response) {
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkBalance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

