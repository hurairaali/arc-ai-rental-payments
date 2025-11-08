const mongoose = require('mongoose');
const Property = require('../models/Property');
const Invoice = require('../models/Invoice');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arc-real-estate';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Property.deleteMany({});
    await Invoice.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create sample properties
    const properties = [
      {
        name: 'Ocean View Apartment',
        tokenId: 'PROP-001',
        monthlyRent: '3',
        ownerId: 'owner123',
        tenantId: 'tenant123',
        status: 'rented',
        location: 'Miami, FL',
        description: 'Beautiful ocean view apartment',
      },
      {
        name: 'Downtown Loft',
        tokenId: 'PROP-002',
        monthlyRent: '2.5',
        ownerId: 'owner123',
        tenantId: 'tenant123',
        status: 'rented',
        location: 'New York, NY',
        description: 'Modern loft in downtown',
      },
      {
        name: 'Sunset Villa',
        tokenId: 'PROP-003',
        monthlyRent: '4',
        ownerId: 'owner123',
        status: 'available',
        location: 'Los Angeles, CA',
        description: 'Luxury villa with sunset views',
      },
    ];

    const createdProperties = await Property.insertMany(properties);
    console.log(`✅ Created ${createdProperties.length} properties`);

    // Create sample invoices
    const invoices = [
      {
        propertyId: createdProperties[0]._id,
        propertyName: 'Ocean View Apartment',
        ownerId: 'owner123',
        tenantId: 'tenant123',
        amount: '3',
        dueDate: new Date('2024-12-01'),
        status: 'paid',
        paidDate: new Date('2024-11-28'),
        txHash: '0xabc123def456...',
      },
      {
        propertyId: createdProperties[1]._id,
        propertyName: 'Downtown Loft',
        ownerId: 'owner123',
        tenantId: 'tenant123',
        amount: '2.5',
        dueDate: new Date('2024-12-01'),
        status: 'paid',
        paidDate: new Date('2024-11-29'),
        txHash: '0xdef456abc789...',
      },
      {
        propertyId: createdProperties[0]._id,
        propertyName: 'Ocean View Apartment',
        ownerId: 'owner123',
        tenantId: 'tenant123',
        amount: '3',
        dueDate: new Date('2025-01-01'),
        status: 'pending',
      },
      {
        propertyId: createdProperties[1]._id,
        propertyName: 'Downtown Loft',
        ownerId: 'owner123',
        tenantId: 'tenant123',
        amount: '2.5',
        dueDate: new Date('2025-01-01'),
        status: 'pending',
      },
    ];

    const createdInvoices = await Invoice.insertMany(invoices);
    console.log(`✅ Created ${createdInvoices.length} invoices`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Properties: ${createdProperties.length}`);
    console.log(`   Invoices: ${createdInvoices.length}`);
    console.log(`   Paid: ${invoices.filter(i => i.status === 'paid').length}`);
    console.log(`   Pending: ${invoices.filter(i => i.status === 'pending').length}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();

