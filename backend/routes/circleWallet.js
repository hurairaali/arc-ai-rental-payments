const express = require('express');
const router = express.Router();
const circleWallet = require('../services/circleWallet');

/**
 * GET /api/circle/wallet-sets
 * Get all wallet sets
 */
router.get('/wallet-sets', async (req, res) => {
  try {
    const walletSets = await circleWallet.getWalletSets();
    res.json({ success: true, walletSets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/circle/wallet-sets
 * Create a new wallet set
 */
router.post('/wallet-sets', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const walletSet = await circleWallet.createWalletSet(name);
    res.json({ success: true, walletSet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/circle/wallets/:walletId
 * Get wallet information
 */
router.get('/wallets/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const wallet = await circleWallet.getWallet(walletId);
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/circle/wallets
 * Create a new wallet
 */
router.post('/wallets', async (req, res) => {
  try {
    const { walletSetId, blockchains, accountType } = req.body;
    if (!walletSetId) {
      return res.status(400).json({ success: false, error: 'walletSetId is required' });
    }
    const wallet = await circleWallet.createWallet(
      walletSetId,
      blockchains || ['ARC'],
      accountType || 'EOA'
    );
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/circle/wallets/:walletId/address
 * Get wallet address for Arc blockchain
 */
router.get('/wallets/:walletId/address', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { blockchain } = req.query;
    const address = await circleWallet.getWalletAddress(walletId, blockchain || 'ARC');
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/circle/wallets/:walletId/balance
 * Get wallet balance
 */
router.get('/wallets/:walletId/balance', async (req, res) => {
  try {
    const { walletId } = req.params;
    const balance = await circleWallet.getWalletBalance(walletId);
    res.json({ success: true, balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/circle/transactions
 * Create a transaction (send tokens)
 */
router.post('/transactions', async (req, res) => {
  try {
    const { walletId, destinationAddress, amount, tokenId, blockchain } = req.body;
    
    if (!walletId || !destinationAddress || !amount || !tokenId) {
      return res.status(400).json({ 
        success: false, 
        error: 'walletId, destinationAddress, amount, and tokenId are required' 
      });
    }

    const transaction = await circleWallet.createTransaction(
      walletId,
      destinationAddress,
      amount,
      tokenId,
      blockchain || 'ARC'
    );
    
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

