const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tokenId: {
    type: String,
    required: true,
    unique: true,
  },
  ownerId: {
    type: String,
    required: true,
  },
  tenantId: {
    type: String,
    default: null,
  },
  monthlyRent: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance'],
    default: 'rented',
  },
  contractAddress: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Index for faster queries
propertySchema.index({ ownerId: 1 });
propertySchema.index({ tenantId: 1 });
propertySchema.index({ tokenId: 1 });

module.exports = mongoose.model('Property', propertySchema);


