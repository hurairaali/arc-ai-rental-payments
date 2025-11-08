const express = require('express');
const router = express.Router();
const aiAgentService = require('../services/aiAgent');
const aiService = require('../services/aiService');
const autonomousAI = require('../services/aiAutonomous');

/**
 * POST /api/ai/chat
 * Chat with AI assistant (uses Google Gemini)
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, userId, role } = req.body;

    if (!message || !userId || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, userId, role',
      });
    }

    const result = await aiService.processMessage(message, userId, role);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/check-payments
 * AI agent checks all properties and determines if payments should be processed
 */
router.post('/check-payments', async (req, res) => {
  try {
    const { propertyIds } = req.body;
    const results = await aiAgentService.checkAndProcessPayments(propertyIds);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai/analyze-payment
 * AI analyzes a specific payment situation
 */
router.post('/analyze-payment', async (req, res) => {
  try {
    const { propertyId, tenantAddress, paymentAmount } = req.body;
    const analysis = await aiAgentService.analyzePayment(
      propertyId,
      tenantAddress,
      paymentAmount
    );
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ai/status
 * Get autonomous AI agent status
 */
router.get('/status', async (req, res) => {
  try {
    const status = autonomousAI.getStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

