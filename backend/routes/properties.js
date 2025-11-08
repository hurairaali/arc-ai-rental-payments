const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

/**
 * GET /api/properties/:role/:userId
 * Get all properties for a user
 */
router.get('/:role/:userId', async (req, res) => {
  try {
    const { role, userId } = req.params;
    const query = role === 'owner' ? { ownerId: userId } : { tenantId: userId };

    const properties = await Property.find(query).lean();

    res.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error('Get Properties Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/properties/create
 * Create a new property
 */
router.post('/create', async (req, res) => {
  try {
    const {
      name,
      tokenId,
      ownerId,
      tenantId,
      monthlyRent,
      address,
      description,
      imageUrl,
      contractAddress,
    } = req.body;

    if (!name || !tokenId || !ownerId || !monthlyRent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const property = new Property({
      name,
      tokenId,
      ownerId,
      tenantId,
      monthlyRent,
      address: address || '',
      description: description || '',
      imageUrl: imageUrl || '',
      contractAddress: contractAddress || process.env.PROPERTY_TOKEN_ADDRESS,
    });

    await property.save();

    res.json({
      success: true,
      property,
      message: 'Property created successfully',
    });
  } catch (error) {
    console.error('Create Property Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/properties/seed
 * Seed initial demo properties
 */
router.get('/seed/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;

    // Check if properties already exist
    const existing = await Property.find({ ownerId });
    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'Properties already seeded',
        properties: existing,
      });
    }

    // Create demo properties with small amounts (user only has 10 USDC!)
    const properties = await Property.insertMany([
      {
        name: 'Sunset Villa',
        tokenId: '#001',
        ownerId,
        tenantId: 'tenant123',
        monthlyRent: '3', // Small amount to fit 10 USDC budget
        address: 'Malibu, CA',
        description: 'Luxury beachfront property',
        status: 'rented',
        contractAddress: process.env.PROPERTY_TOKEN_ADDRESS,
      },
      {
        name: 'Ocean Apartment',
        tokenId: '#002',
        ownerId,
        tenantId: 'tenant123',
        monthlyRent: '3', // Small amount to fit 10 USDC budget
        address: 'Miami, FL',
        description: 'Modern downtown apartment',
        status: 'rented',
        contractAddress: process.env.PROPERTY_TOKEN_ADDRESS,
      },
      {
        name: 'Downtown Loft',
        tokenId: '#003',
        ownerId,
        tenantId: 'tenant123',
        monthlyRent: '3', // Small amount to fit 10 USDC budget
        address: 'New York, NY',
        description: 'Industrial-style loft',
        status: 'rented',
        contractAddress: process.env.PROPERTY_TOKEN_ADDRESS,
      },
    ]);

    res.json({
      success: true,
      properties,
      message: 'Demo properties seeded successfully',
    });
  } catch (error) {
    console.error('Seed Properties Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
