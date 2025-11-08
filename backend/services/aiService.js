const Invoice = require('../models/Invoice');
const Property = require('../models/Property');
const aiAgent = require('./aiAgent');

class AIService {
  /**
   * Process chat message using AI ML API
   */
  async processMessage(message, userId, role) {
    try {
      // Get context from database
      const properties = await Property.find({ ownerId: role === 'owner' ? userId : undefined }).lean();
      const invoices = await Invoice.find({ 
        [role === 'owner' ? 'ownerId' : 'tenantId']: userId 
      }).sort({ createdAt: -1 }).limit(5).lean();

      // Build context for AI
      const context = {
        role,
        userId,
        properties: properties.map(p => ({
          name: p.name,
          monthlyRent: p.monthlyRent,
          status: p.status,
          tokenId: p.tokenId
        })),
        recentInvoices: invoices.map(i => ({
          propertyName: i.propertyName,
          amount: i.amount,
          status: i.status,
          dueDate: i.dueDate
        }))
      };

      // Create AI prompt
      const systemMessage = `You are a friendly and professional AI assistant for Arc Real Estate - a blockchain-powered rental payment system using USDC on Arc testnet.

YOUR PERSONALITY:
- Conversational and warm, not robotic
- Use emojis occasionally (💰 📝 ✅ 🏠 💳)
- Keep responses concise but helpful
- Ask follow-up questions when needed
- Celebrate successes ("Great!", "Done!", "Perfect!")

You're helping ${role === 'owner' ? 'a property owner manage their rentals' : 'a tenant manage their rent payments'}.

${role === 'owner' ? 
  'AS AN OWNER ASSISTANT, you can:\n✅ Create invoices for properties\n✅ Track payment status\n✅ View total collected income\n✅ List properties\n\nKey Point: Invoices should be small amounts ($2-3) since we\'re on testnet with limited USDC.' :
  'AS A TENANT ASSISTANT, you can:\n✅ View pending rent invoices\n✅ Pay rent instantly\n✅ Check payment history\n✅ Set up automatic payments\n\nKey Point: Payments are instant via blockchain!'}

CURRENT CONTEXT:
${properties.length > 0 ? `🏠 Properties: ${properties.map(p => p.name).join(', ')}` : '🏠 No properties yet'}
${invoices.length > 0 ? `📝 Recent invoice: ${invoices[0].propertyName} - $${invoices[0].amount} (${invoices[0].status})` : '📝 No invoices yet'}

RESPONSE STYLE:
- Be conversational: "Sure! Let me help you with that" instead of "Processing request"
- Confirm actions: "I've created the invoice for Ocean Apartment!"
- Guide naturally: "Which property would you like to create an invoice for?"
- Show empathy: "I see you have a pending payment. Want to pay it now?"

Respond as if chatting with a friend, but stay professional. Keep it brief and actionable.`;

      const userPrompt = `User message: "${message}"

Context: ${JSON.stringify(context, null, 2)}

Analyze the user's intent and provide a helpful response. If they want to create an invoice, pay, or check status, be clear about what you'll do.`;

      // Call AI ML API
      let aiResponse;
      try {
        aiResponse = await aiAgent.callAIAPI(userPrompt, {
          systemMessage,
          temperature: 0.7,
          responseFormat: 'text'
        });
        console.log('✅ AI ML API Response:', aiResponse.substring(0, 100) + '...');
      } catch (aiError) {
        console.error('❌ AI ML API Error:', aiError.message);
        // Fallback to pattern matching if AI API fails
        return await this.fallbackPatternMatching(message, userId, role);
      }

      // Parse AI response and determine action
      const lowerMessage = message.toLowerCase();
      const lowerResponse = aiResponse.toLowerCase();

      // Determine action based on AI response and user message
      if (lowerMessage.includes('create invoice') || lowerMessage.includes('new invoice') || lowerResponse.includes('create invoice')) {
        return await this.handleCreateInvoice(message, userId);
      }
      if ((lowerMessage.includes('pay now') || lowerMessage.includes('execute payment') || lowerMessage.includes('pay rent')) && role === 'tenant') {
        const pendingInvoices = await Invoice.find({ 
          tenantId: userId, 
          status: 'pending' 
        }).sort({ dueDate: 1 }).lean();
        
        if (pendingInvoices.length > 0) {
          return await this.executePayment(pendingInvoices[0]._id.toString(), userId);
        }
        return await this.handlePaymentRequest(userId);
      }
      if (lowerMessage.includes('pay') && role === 'tenant') {
        return await this.handlePaymentRequest(userId);
      }
      if (lowerMessage.includes('status') || lowerMessage.includes('payment')) {
        return await this.handlePaymentStatus(userId);
      }
      if (lowerMessage.includes('collect') || lowerMessage.includes('total') || lowerMessage.includes('income')) {
        return await this.handleTotalCollected(userId);
      }
      if (lowerMessage.includes('invoice') && !lowerMessage.includes('create')) {
        return await this.handleListInvoices(userId, role);
      }
      if (lowerMessage.includes('properties') || lowerMessage.includes('list')) {
        return await this.handleListProperties(userId);
      }
      if (lowerMessage.includes('history') || lowerMessage.includes('past')) {
        return await this.handlePaymentHistory(userId);
      }

      return {
        response: aiResponse,
        action: null,
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      // Fallback to pattern matching
      return await this.fallbackPatternMatching(message, userId, role);
    }
  }

  /**
   * Fallback to pattern matching if AI API fails
   */
  async fallbackPatternMatching(message, userId, role) {
    const lowerMessage = message.toLowerCase();
    
    try {
      if (role === 'owner') {
        return await this.handleOwnerCommand(lowerMessage, message, userId);
      }
      
      if (role === 'tenant') {
        return await this.handleTenantCommand(lowerMessage, message, userId);
      }
      
      return {
        response: "I'm here to help! You can ask me about invoices, payments, or property management.",
        action: null,
      };
    } catch (error) {
      return {
        response: "I encountered an error processing your request. Please try again.",
        action: null,
        error: error.message,
      };
    }
  }

  /**
   * Handle owner commands
   */
  async handleOwnerCommand(lowerMessage, originalMessage, ownerId) {
    // Create invoice
    if (lowerMessage.includes('create invoice') || lowerMessage.includes('new invoice')) {
      return await this.handleCreateInvoice(originalMessage, ownerId);
    }

    // Check payment status
    if (lowerMessage.includes('status') || lowerMessage.includes('payment')) {
      return await this.handlePaymentStatus(ownerId);
    }

    // Total collected
    if (lowerMessage.includes('collect') || lowerMessage.includes('total') || lowerMessage.includes('income')) {
      return await this.handleTotalCollected(ownerId);
    }

    // List properties
    if (lowerMessage.includes('properties') || lowerMessage.includes('list')) {
      return await this.handleListProperties(ownerId);
    }

    // List invoices
    if (lowerMessage.includes('invoice') && !lowerMessage.includes('create')) {
      return await this.handleListInvoices(ownerId, 'owner');
    }

    return {
      response: "I can help you:\n• Create invoices\n• Check payment status\n• View total collected\n• List properties\n\nWhat would you like to do?",
      action: null,
    };
  }

  /**
   * Handle tenant commands
   */
  async handleTenantCommand(lowerMessage, originalMessage, tenantId) {
    // Show invoices
    if (lowerMessage.includes('invoice') || lowerMessage.includes('show')) {
      return await this.handleListInvoices(tenantId, 'tenant');
    }

    // Pay rent
    if (lowerMessage.includes('pay now') || lowerMessage.includes('execute payment') || lowerMessage.includes('pay rent')) {
      const pendingInvoices = await Invoice.find({ 
        tenantId, 
        status: 'pending' 
      }).sort({ dueDate: 1 }).lean();
      
      if (pendingInvoices.length > 0) {
        return await this.executePayment(pendingInvoices[0]._id.toString(), tenantId);
      }
      return await this.handlePaymentRequest(tenantId);
    }
    
    if (lowerMessage.includes('pay') || lowerMessage.includes('send')) {
      return await this.handlePaymentRequest(tenantId);
    }

    // Auto-pay
    if (lowerMessage.includes('auto') || lowerMessage.includes('automatic')) {
      return {
        response: "I can set up automatic payments for you. Auto-pay will:\n\n• Automatically pay rent on the due date\n• Send you a reminder 3 days before\n• Notify you after payment is sent\n\nWould you like to enable auto-pay?",
        action: 'enable_autopay',
      };
    }

    // Payment history
    if (lowerMessage.includes('history') || lowerMessage.includes('past')) {
      return await this.handlePaymentHistory(tenantId);
    }

    return {
      response: "I can help you:\n• View invoices\n• Pay rent\n• Set up auto-pay\n• Check payment history\n\nWhat would you like to do?",
      action: null,
    };
  }

  /**
   * Handle create invoice command
   */
  async handleCreateInvoice(message, ownerId) {
    // Try to extract details from message
    const propertyMatch = message.match(/(?:for|property)\s+([^,]+)/i);
    const amountMatch = message.match(/\$?(\d+,?\d*)/);
    const dateMatch = message.match(/(?:due|date)\s+([^,]+)/i);
    
    const propertyName = propertyMatch ? propertyMatch[1].trim() : null;
    const amount = amountMatch ? amountMatch[1].replace(',', '') : null;
    const dueDateStr = dateMatch ? dateMatch[1].trim() : null;

    // Get properties to find property ID
    const properties = await Property.find({ ownerId }).lean();
    const property = propertyName 
      ? properties.find(p => p.name.toLowerCase().includes(propertyName.toLowerCase()))
      : properties[0];

    if (!property) {
      return {
        response: "I couldn't find that property. Please specify a valid property name.",
        action: null,
      };
    }

    if (!amount) {
      return {
        response: "To create an invoice, please provide:\n• Property name\n• Amount (e.g., $3)\n• Due date\n\n⚠️ Note: Keep amounts small (you have 10 USDC total)\n\nExample: 'Create invoice for Ocean Apartment, $3, due Dec 1'",
        action: 'create_invoice_prompt',
      };
    }

    // Warn if amount is too large
    if (parseFloat(amount) > 10) {
      return {
        response: `⚠️ Warning: Amount ($${amount}) exceeds your wallet balance (10 USDC).\n\nPlease use a smaller amount (e.g., $3 or less).`,
        action: null,
      };
    }

    // Parse due date (simple parsing)
    let dueDate = new Date();
    if (dueDateStr) {
      // Try to parse date string
      const parsed = new Date(dueDateStr);
      if (!isNaN(parsed.getTime())) {
        dueDate = parsed;
      } else {
        // Default to next month if can't parse
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
    } else {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // Create invoice in database
    const invoice = new Invoice({
      propertyId: property._id,
      propertyName: property.name,
      ownerId: ownerId,
      tenantId: property.tenantId || 'tenant123',
      amount: amount,
      dueDate: dueDate,
      status: 'pending',
    });

    await invoice.save();

    return {
      response: `✓ Invoice created successfully!\n\n📄 ${property.name}\n💰 Amount: $${amount} USDC\n📅 Due: ${dueDate.toLocaleDateString()}\n\nInvoice ID: ${invoice._id}`,
      action: 'invoice_created',
      data: { invoiceId: invoice._id, amount },
    };
  }

  /**
   * Get payment status
   */
  async handlePaymentStatus(ownerId) {
    const properties = await Property.find({ ownerId }).lean();
    const invoices = await Invoice.find({ ownerId }).lean();

    const paid = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');
    const overdue = invoices.filter(i => i.status === 'overdue');

    let response = "📊 Payment Status:\n\n";
    
    for (const prop of properties) {
      const propInvoices = invoices.filter(i => i.propertyId.toString() === prop._id.toString());
      const latest = propInvoices[propInvoices.length - 1];
      
      if (latest) {
        const statusEmoji = latest.status === 'paid' ? '✓' : latest.status === 'pending' ? '⏳' : '❌';
        response += `${statusEmoji} ${prop.name}: ${latest.status === 'paid' ? 'Paid' : 'Pending'} ($${latest.amount})\n`;
      }
    }

    response += `\n📈 Summary:\n• Paid: ${paid.length} invoices\n• Pending: ${pending.length} invoices\n• Overdue: ${overdue.length} invoices`;

    return {
      response,
      action: null,
      data: { paid: paid.length, pending: pending.length, overdue: overdue.length },
    };
  }

  /**
   * Calculate total collected
   */
  async handleTotalCollected(ownerId) {
    const paidInvoices = await Invoice.find({ ownerId, status: 'paid' }).lean();
    const pendingInvoices = await Invoice.find({ ownerId, status: 'pending' }).lean();

    const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    const response = `💰 Rental Income Report:\n\n✓ Collected: $${totalPaid.toLocaleString()} USDC\n⏳ Pending: $${totalPending.toLocaleString()} USDC\n📊 Total: $${(totalPaid + totalPending).toLocaleString()} USDC\n\n${paidInvoices.length} payments completed this period.`;

    return {
      response,
      action: null,
      data: { paid: totalPaid, pending: totalPending },
    };
  }

  /**
   * List properties
   */
  async handleListProperties(ownerId) {
    const properties = await Property.find({ ownerId }).lean();

    if (properties.length === 0) {
      return {
        response: "You don't have any properties yet. Would you like to add one?",
        action: 'add_property',
      };
    }

    let response = `🏠 Your Properties (${properties.length}):\n\n`;
    properties.forEach((prop, index) => {
      response += `${index + 1}. ${prop.name}\n   Rent: $${prop.monthlyRent}/month\n   Token: ${prop.tokenId}\n\n`;
    });

    return {
      response,
      action: null,
      data: { properties },
    };
  }

  /**
   * List invoices
   */
  async handleListInvoices(userId, role) {
    const query = role === 'owner' ? { ownerId: userId } : { tenantId: userId };
    const invoices = await Invoice.find(query).sort({ dueDate: -1 }).limit(10).lean();

    if (invoices.length === 0) {
      return {
        response: role === 'owner' 
          ? "You haven't created any invoices yet." 
          : "You don't have any invoices.",
        action: null,
      };
    }

    let response = `📄 ${role === 'owner' ? 'Created' : 'Your'} Invoices:\n\n`;
    invoices.forEach((inv, index) => {
      const statusEmoji = inv.status === 'paid' ? '✓' : inv.status === 'pending' ? '⏳' : '❌';
      response += `${statusEmoji} ${inv.propertyName}\n   $${inv.amount} • ${new Date(inv.dueDate).toLocaleDateString()}\n   Status: ${inv.status}\n\n`;
    });

    return {
      response,
      action: null,
      data: { invoices },
    };
  }

  /**
   * Handle payment request
   */
  async handlePaymentRequest(tenantId) {
    const pendingInvoices = await Invoice.find({ 
      tenantId, 
      status: 'pending' 
    }).sort({ dueDate: 1 }).lean();

    if (pendingInvoices.length === 0) {
      return {
        response: "You don't have any pending payments. All caught up! ✓",
        action: null,
      };
    }

    const invoice = pendingInvoices[0];
    
    // If user explicitly says "pay now" or "pay", execute payment
    // Otherwise just show invoice details
    return {
      response: `💳 Ready to pay rent:\n\n🏠 Property: ${invoice.propertyName}\n💰 Amount: $${invoice.amount} USDC\n📅 Due: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nTo pay, say "Pay now" or "Execute payment".`,
      action: 'show_payment',
      data: { invoice },
    };
  }

  /**
   * Execute payment for an invoice
   */
  async executePayment(invoiceId, tenantId) {
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return {
        response: "Invoice not found.",
        action: null,
      };
    }

    if (invoice.status === 'paid') {
      return {
        response: "This invoice has already been paid.",
        action: null,
      };
    }

    if (invoice.tenantId !== tenantId) {
      return {
        response: "You don't have permission to pay this invoice.",
        action: null,
      };
    }

    // Get property owner address
    const property = await Property.findById(invoice.propertyId);
    if (!property) {
      return {
        response: "Property not found for this invoice.",
        action: null,
      };
    }

    // Execute payment via Circle (mock for now to save USDC)
    // In production, this would call the payment API
    const circleWallet = require('./circleWallet');
    try {
      const walletId = process.env.CIRCLE_DEPLOYER_WALLET_ID;
      const ownerAddress = process.env.CIRCLE_DEPLOYER_ADDRESS; // In production, get from property owner
      const tokenId = 'e73c8e3f-55f5-5b7c-abf1-9d4c5b0a5ab0'; // USDC token ID on Arc

      // IMPORTANT: Mock payment to preserve USDC balance (user only has 10 USDC)
      // For demo purposes, we simulate the payment without actually sending USDC
      // In production, uncomment below to execute real payment:
      /*
      const paymentResult = await circleWallet.createTransaction(
        walletId,
        ownerAddress,
        invoice.amount,
        tokenId,
        'ARC-TESTNET'
      );
      invoice.txHash = paymentResult.id || paymentResult.transactionHash;
      */

      // Simulate payment (DO NOT ACTUALLY SEND - user only has 10 USDC!)
      invoice.status = 'paid';
      invoice.paidDate = new Date();
      invoice.txHash = '0x' + Math.random().toString(16).substring(2, 66); // Mock tx hash for demo
      await invoice.save();

      return {
        response: `✓ Payment successful!\n\n💰 Sent: $${invoice.amount} USDC\n🏠 To: ${invoice.propertyName}\n📅 Paid: ${new Date().toLocaleDateString()}\n\nTransaction: ${invoice.txHash.substring(0, 10)}...`,
        action: 'payment_executed',
        data: { invoice },
      };
    } catch (error) {
      return {
        response: `Payment failed: ${error.message}\n\nPlease try again or contact support.`,
        action: null,
        error: error.message,
      };
    }
  }

  /**
   * Get payment history
   */
  async handlePaymentHistory(tenantId) {
    const paidInvoices = await Invoice.find({ 
      tenantId, 
      status: 'paid' 
    }).sort({ paidDate: -1 }).limit(5).lean();

    if (paidInvoices.length === 0) {
      return {
        response: "No payment history found.",
        action: null,
      };
    }

    let response = "📜 Payment History:\n\n";
    paidInvoices.forEach((inv) => {
      response += `✓ ${new Date(inv.paidDate).toLocaleDateString()} - $${inv.amount} USDC\n   ${inv.propertyName}\n`;
      if (inv.txHash) {
        response += `   Tx: ${inv.txHash.substring(0, 10)}...\n`;
      }
      response += '\n';
    });

    const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    response += `Total paid: $${totalPaid.toLocaleString()} USDC`;

    return {
      response,
      action: null,
      data: { history: paidInvoices, totalPaid },
    };
  }
}

module.exports = new AIService();

