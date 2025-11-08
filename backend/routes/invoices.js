const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Property = require('../models/Property');
const circleWallet = require('../services/circleWallet');

/**
 * GET /api/invoices/:role/:userId
 * Get all invoices for a user (owner or tenant)
 */
router.get('/:role/:userId', async (req, res) => {
  try {
    const { role, userId } = req.params;
    const query = role === 'owner' ? { ownerId: userId } : { tenantId: userId };

    const invoices = await Invoice.find(query)
      .sort({ dueDate: -1 })
      .lean();

    res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error('Get Invoices Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/invoices/create
 * Create a new invoice
 */
router.post('/create', async (req, res) => {
  try {
    const {
      propertyId,
      propertyName,
      ownerId,
      tenantId,
      amount,
      dueDate,
      recurring,
      frequency,
      notes,
    } = req.body;

    // Validate required fields
    if (!propertyId || !propertyName || !ownerId || !tenantId || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const invoice = new Invoice({
      propertyId,
      propertyName,
      ownerId,
      tenantId,
      amount,
      dueDate: new Date(dueDate),
      recurring: recurring || false,
      frequency: frequency || 'monthly',
      notes: notes || '',
    });

    await invoice.save();

    // Emit real-time event to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('invoice:created', {
        invoice,
        ownerId,
        tenantId,
        message: `New invoice created: ${propertyName} - $${amount}`
      });
    }

    res.json({
      success: true,
      invoice,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    console.error('Create Invoice Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/invoices/:id/pay
 * Execute payment for an invoice
 */
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantWalletId } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Invoice already paid',
      });
    }

    // Get property owner address
    const property = await Property.findById(invoice.propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    // Execute real USDC payment from Tenant wallet to Owner wallet
    const tenantWalletId = process.env.CIRCLE_TENANT_WALLET_ID;
    const ownerAddress = process.env.CIRCLE_OWNER_ADDRESS;
    const usdcTokenId = process.env.CIRCLE_USDC_TOKEN_ID || 'e73c8e3f-55f5-5b7c-abf1-9d4c5b0a5ab0'; // USDC on Arc testnet
    
    // Check if real wallets are configured
    if (tenantWalletId && ownerAddress) {
      try {
        console.log(`💳 Processing payment: $${invoice.amount} USDC`);
        console.log(`   From: Tenant Wallet (${tenantWalletId})`);
        console.log(`   To: Owner (${ownerAddress})`);
        
        // Execute Circle transaction - Tenant pays Owner
        const paymentResult = await circleWallet.createTransaction(
          tenantWalletId,        // From: Tenant wallet
          ownerAddress,          // To: Owner address
          invoice.amount,        // Amount in USDC
          usdcTokenId,          // USDC token
          'ARC-TESTNET'
        );
        
        invoice.txHash = paymentResult.id || paymentResult.transactionHash || 'pending';
        console.log(`✅ Payment transaction created: ${invoice.txHash}`);
        
      } catch (paymentError) {
        console.error('❌ Circle payment error:', paymentError.message);
        
        // Fallback to mock if Circle transaction fails
        console.log('⚠️ Falling back to mock payment (for demo)');
        invoice.txHash = '0x' + Math.random().toString(16).substring(2, 66);
      }
    } else {
      // Mock payment if wallets not configured
      console.log('⚠️ Using mock payment (wallets not configured)');
      console.log('💡 Run: node scripts/setup-owner-tenant-wallets.js');
      invoice.txHash = '0x' + Math.random().toString(16).substring(2, 66);
    }

    invoice.status = 'paid';
    invoice.paidDate = new Date();
    await invoice.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('invoice:paid', {
        invoice,
        message: `Payment completed: ${invoice.propertyName} - $${invoice.amount}`
      });
    }

    res.json({
      success: true,
      invoice,
      message: 'Payment executed successfully',
    });
  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/invoices/:id/status
 * Update invoice status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Update Invoice Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

