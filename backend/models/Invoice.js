const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  propertyName: {
    type: String,
    required: true,
  },
  ownerId: {
    type: String,
    required: true,
  },
  tenantId: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
  },
  recurring: {
    type: Boolean,
    default: false,
  },
  frequency: {
    type: String,
    enum: ['monthly', 'weekly', 'daily'],
    default: 'monthly',
  },
  txHash: {
    type: String,
    default: null,
  },
  paidDate: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Index for faster queries
invoiceSchema.index({ ownerId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);


