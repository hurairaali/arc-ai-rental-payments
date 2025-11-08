const express = require('express');
const router = express.Router();
const circleWallet = require('../services/circleWallet');

/**
 * GET /api/wallet/balance/:role
 * Get wallet balance for owner or tenant
 */
router.get('/balance/:role?', async (req, res) => {
  try {
    const role = req.params.role || 'owner'; // Default to owner
    
    // Use separate wallets for owner and tenant
    const walletId = role === 'tenant' 
      ? process.env.CIRCLE_TENANT_WALLET_ID 
      : process.env.CIRCLE_OWNER_WALLET_ID;
    
    const address = role === 'tenant'
      ? process.env.CIRCLE_TENANT_ADDRESS
      : process.env.CIRCLE_OWNER_ADDRESS;
    
    if (!walletId) {
      // Fallback to deployer wallet if not configured
      const fallbackWalletId = process.env.CIRCLE_DEPLOYER_WALLET_ID;
      const fallbackAddress = process.env.CIRCLE_DEPLOYER_ADDRESS;
      
      if (!fallbackWalletId) {
        return res.status(400).json({
          success: false,
          error: 'Wallet not configured. Run: npm run setup-wallets',
          help: 'Execute: node scripts/setup-owner-tenant-wallets.js'
        });
      }

      // Get balance from fallback wallet
      const balance = await circleWallet.getWalletTokenBalance(fallbackWalletId, 'ARC-TESTNET');
      const usdcBalance = balance.tokenBalances?.find(
        token => token.token?.symbol?.includes('USDC')
      );
      const balanceAmount = usdcBalance ? parseFloat(usdcBalance.amount || '0') : 0;

      return res.json({
        success: true,
        balance: balanceAmount.toFixed(2),
        address: fallbackAddress,
        role: role,
        note: '⚠️ Using fallback wallet. Run setup-owner-tenant-wallets.js for separate wallets',
        walletId: fallbackWalletId,
        fullBalance: balance,
      });
    }

    // Get wallet balance from Circle
    const balance = await circleWallet.getWalletTokenBalance(walletId, 'ARC-TESTNET');
    
    // Find USDC balance
    const usdcBalance = balance.tokenBalances?.find(
      token => token.token?.symbol === 'USDC' || 
               token.token?.symbol === 'USDC-TESTNET' ||
               token.token?.symbol?.includes('USDC')
    );

    const balanceAmount = usdcBalance ? parseFloat(usdcBalance.amount || '0') : 0;

    res.json({
      success: true,
      balance: balanceAmount.toFixed(2),
      address: address,
      role: role,
      walletId: walletId,
      note: role === 'tenant' ? '👤 Tenant Circle Wallet' : '👨‍💼 Owner Circle Wallet',
      fullBalance: balance,
    });
  } catch (error) {
    console.error('Get Wallet Balance Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wallet/transactions/:role
 * Get wallet transaction history for owner or tenant
 */
router.get('/transactions/:role?', async (req, res) => {
  try {
    const role = req.params.role || 'owner';
    
    const walletId = role === 'tenant' 
      ? (process.env.CIRCLE_TENANT_WALLET_ID || process.env.CIRCLE_DEPLOYER_WALLET_ID)
      : (process.env.CIRCLE_OWNER_WALLET_ID || process.env.CIRCLE_DEPLOYER_WALLET_ID);
    
    if (!walletId) {
      return res.status(400).json({
        success: false,
        error: 'Wallet ID not configured',
      });
    }

    // Get transactions from Circle
    const transactions = await circleWallet.listTransactions(walletId, 'ARC-TESTNET');

    res.json({
      success: true,
      role: role,
      walletId: walletId,
      transactions: transactions || [],
    });
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wallet/info
 * Get wallet setup status
 */
router.get('/info', async (req, res) => {
  try {
    const hasOwnerWallet = !!process.env.CIRCLE_OWNER_WALLET_ID;
    const hasTenantWallet = !!process.env.CIRCLE_TENANT_WALLET_ID;
    const hasFallback = !!process.env.CIRCLE_DEPLOYER_WALLET_ID;

    res.json({
      success: true,
      owner: {
        configured: hasOwnerWallet,
        walletId: process.env.CIRCLE_OWNER_WALLET_ID || null,
        address: process.env.CIRCLE_OWNER_ADDRESS || null,
      },
      tenant: {
        configured: hasTenantWallet,
        walletId: process.env.CIRCLE_TENANT_WALLET_ID || null,
        address: process.env.CIRCLE_TENANT_ADDRESS || null,
      },
      fallback: {
        available: hasFallback,
        walletId: process.env.CIRCLE_DEPLOYER_WALLET_ID || null,
        address: process.env.CIRCLE_DEPLOYER_ADDRESS || null,
      },
      recommendation: !hasOwnerWallet || !hasTenantWallet 
        ? 'Run: node scripts/setup-owner-tenant-wallets.js' 
        : 'All wallets configured ✅'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
