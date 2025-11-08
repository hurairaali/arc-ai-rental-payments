const Invoice = require('../models/Invoice');
const Property = require('../models/Property');
const aiAgent = require('./aiAgent');

/**
 * Autonomous AI Agent
 * Runs independently to monitor and manage payments
 */
class AutonomousAIAgent {
  constructor() {
    this.checkInterval = 60000; // Check every minute
    this.isRunning = false;
  }

  /**
   * Start autonomous monitoring
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 Autonomous AI Agent started');
    
    this.intervalId = setInterval(() => {
      this.runAutonomousCycle();
    }, this.checkInterval);
    
    // Run immediately on start
    this.runAutonomousCycle();
  }

  /**
   * Stop autonomous monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log('🤖 Autonomous AI Agent stopped');
    }
  }

  /**
   * Run one cycle of autonomous checks
   */
  async runAutonomousCycle() {
    try {
      console.log('🤖 AI Agent: Running autonomous payment check...');
      
      // 1. Check for overdue payments
      await this.checkOverduePayments();
      
      // 2. Analyze upcoming payments
      await this.analyzeUpcomingPayments();
      
      // 3. Send proactive reminders
      await this.sendProactiveReminders();
      
    } catch (error) {
      console.error('❌ Autonomous AI cycle error:', error);
    }
  }

  /**
   * Check for overdue payments and take action
   */
  async checkOverduePayments() {
    const overdueInvoices = await Invoice.find({
      status: 'pending',
      dueDate: { $lt: new Date() }
    }).lean();

    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.floor((Date.now() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
      
      // AI Decision: Should we apply late fee?
      const decision = await this.makeAIDecision({
        type: 'late_payment',
        daysOverdue,
        amount: invoice.amount,
        tenantId: invoice.tenantId,
        propertyName: invoice.propertyName
      });

      if (decision.action === 'apply_late_fee') {
        console.log(`⚠️ AI Decision: Apply late fee to ${invoice.propertyName} (${daysOverdue} days overdue)`);
        
        // Update invoice with AI decision
        await Invoice.findByIdAndUpdate(invoice._id, {
          $set: {
            lateFee: decision.lateFeeAmount,
            aiDecision: {
              action: decision.action,
              reason: decision.reason,
              timestamp: new Date(),
              confidence: decision.confidence
            }
          }
        });
      }
    }
  }

  /**
   * Analyze upcoming payments
   */
  async analyzeUpcomingPayments() {
    const upcomingInvoices = await Invoice.find({
      status: 'pending',
      dueDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    }).lean();

    for (const invoice of upcomingInvoices) {
      const daysUntilDue = Math.ceil((new Date(invoice.dueDate) - Date.now()) / (1000 * 60 * 60 * 24));
      
      console.log(`📅 AI Analysis: ${invoice.propertyName} due in ${daysUntilDue} days`);
    }
  }

  /**
   * Send proactive reminders
   */
  async sendProactiveReminders() {
    const invoicesDueSoon = await Invoice.find({
      status: 'pending',
      dueDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Next 3 days
      }
    }).lean();

    for (const invoice of invoicesDueSoon) {
      const daysUntilDue = Math.ceil((new Date(invoice.dueDate) - Date.now()) / (1000 * 60 * 60 * 24));
      
      console.log(`🔔 AI Reminder: ${invoice.propertyName} payment due in ${daysUntilDue} days - sending notification`);
    }
  }

  /**
   * Make AI-powered decision
   */
  async makeAIDecision(context) {
    const prompt = `As an autonomous AI agent managing rental payments, analyze this situation and make a decision:

Context:
- Type: ${context.type}
- Days Overdue: ${context.daysOverdue}
- Amount: $${context.amount}
- Tenant: ${context.tenantId}
- Property: ${context.propertyName}

Based on this, decide:
1. What action should be taken? (apply_late_fee, send_reminder, escalate, wait)
2. If late fee, how much? (reasonable % based on days overdue)
3. Reasoning for decision
4. Confidence level (0-100)

Respond in JSON format with: action, lateFeeAmount, reason, confidence`;

    try {
      const response = await aiAgent.callAIAPI(prompt, {
        systemMessage: 'You are an autonomous AI agent managing real estate rental payments. Make fair, reasonable decisions.',
        temperature: 0.3,
        responseFormat: 'json'
      });

      const decision = typeof response === 'string' ? JSON.parse(response) : response;
      return decision;
    } catch (error) {
      console.error('❌ AI decision error:', error);
      
      // Fallback logic
      if (context.daysOverdue > 7) {
        return {
          action: 'apply_late_fee',
          lateFeeAmount: context.amount * 0.05, // 5% late fee
          reason: 'More than 7 days overdue - standard late fee policy',
          confidence: 90
        };
      }
      
      return {
        action: 'send_reminder',
        lateFeeAmount: 0,
        reason: 'Less than 7 days overdue - friendly reminder',
        confidence: 95
      };
    }
  }

  /**
   * Get AI agent status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheck: new Date().toISOString()
    };
  }
}

module.exports = new AutonomousAIAgent();

