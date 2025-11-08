const { ethers } = require('ethers');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// AI Provider Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini'; // 'gemini', 'aiml-api' or 'openai'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAqUDjV4vjM9vyI_iEYpFnw4IKx2p-ZNME';
const AIML_API_URL = process.env.AIML_API_URL || 'https://api.lablab.ai/v1';
const AIML_API_KEY = process.env.AIML_API_KEY || process.env.OPENAI_API_KEY; // Fallback to OpenAI key if available

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * AI Agent Service
 * Handles AI-powered decision making for payment automation
 */
class AIAgentService {
  constructor() {
    // Initialize Arc testnet provider
    this.provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
    this.paymentManagerAddress = process.env.PAYMENT_MANAGER_ADDRESS;
    this.propertyTokenAddress = process.env.PROPERTY_TOKEN_ADDRESS;
  }

  /**
   * Check payment status and decide if payment should be processed
   */
  async checkAndProcessPayments(propertyIds) {
    const results = [];

    for (const propertyId of propertyIds) {
      try {
        // Check if payment is due
        const isDue = await this.isPaymentDue(propertyId);
        
        if (!isDue) {
          results.push({
            propertyId,
            action: 'skip',
            reason: 'Payment not due yet',
          });
          continue;
        }

        // Get payment details
        const paymentDetails = await this.getPaymentDetails(propertyId);
        
        // Use AI to analyze and decide
        const decision = await this.analyzePaymentDecision(paymentDetails);

        results.push({
          propertyId,
          action: decision.action,
          reason: decision.reason,
          confidence: decision.confidence,
        });
      } catch (error) {
        results.push({
          propertyId,
          action: 'error',
          reason: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Analyze payment situation using AI
   */
  async analyzePayment(propertyId, tenantAddress, paymentAmount) {
    const context = {
      propertyId,
      tenantAddress,
      paymentAmount: paymentAmount.toString(),
      timestamp: new Date().toISOString(),
    };

    const prompt = `Analyze this rental payment situation:

Property ID: ${context.propertyId}
Tenant: ${context.tenantAddress}
Amount: ${context.paymentAmount} USDC
Time: ${context.timestamp}

Provide analysis on:
1. Payment feasibility
2. Risk assessment
3. Recommended action
4. Confidence level (0-100)

Respond in JSON format.`;

    try {
      const response = await this.callAIAPI(prompt, {
        systemMessage: 'You are an AI agent managing real estate rental payments on blockchain. Provide clear, actionable analysis.',
        temperature: 0.3,
        responseFormat: 'json'
      });

      const analysis = typeof response === 'string' ? JSON.parse(response) : response;
      return analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        action: 'manual_review',
        reason: 'AI analysis unavailable',
        confidence: 0,
      };
    }
  }

  /**
   * Analyze payment decision
   */
  async analyzePaymentDecision(paymentDetails) {
    const prompt = `Should this rental payment be processed automatically?

Payment Details:
- Property ID: ${paymentDetails.propertyId}
- Tenant: ${paymentDetails.tenant}
- Amount: ${paymentDetails.amount} USDC
- Due Date: ${paymentDetails.dueDate}
- Current Date: ${new Date().toISOString()}
- Tenant Balance: ${paymentDetails.tenantBalance} USDC
- Payment History: ${JSON.stringify(paymentDetails.history)}

Respond with JSON:
{
  "action": "process" | "skip" | "manual_review",
  "reason": "explanation",
  "confidence": 0-100
}`;

    try {
      const response = await this.callAIAPI(prompt, {
        systemMessage: 'You are an AI payment agent. Decide if payments should be processed automatically. Be conservative - only process if confident.',
        temperature: 0.2,
        responseFormat: 'json'
      });

      return typeof response === 'string' ? JSON.parse(response) : response;
    } catch (error) {
      console.error('AI decision error:', error);
      return {
        action: 'manual_review',
        reason: 'AI decision unavailable',
        confidence: 0,
      };
    }
  }

  /**
   * Check if payment is due (from smart contract)
   */
  async isPaymentDue(propertyId) {
    // TODO: Implement contract call to check if payment is due
    // const contract = new ethers.Contract(...);
    // return await contract.isPaymentDue(propertyId);
    return false;
  }

  /**
   * Get payment details from blockchain
   */
  async getPaymentDetails(propertyId) {
    // TODO: Implement contract calls to get payment details
    return {
      propertyId,
      tenant: '0x0000000000000000000000000000000000000000',
      amount: '0',
      dueDate: new Date().toISOString(),
      tenantBalance: '0',
      history: [],
    };
  }

  /**
   * Call AI/ML API (Google Gemini, Lablab.ai or OpenAI)
   */
  async callAIAPI(prompt, options = {}) {
    const {
      systemMessage = 'You are a helpful AI assistant.',
      temperature = 0.7,
      responseFormat = 'text'
    } = options;

    // Try Google Gemini first (primary provider for this hackathon)
    if (AI_PROVIDER === 'gemini') {
      try {
        console.log('🤖 Using Google Gemini AI...');
        
        // Use Gemini 2.5 Flash model
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: 2048,
          }
        });

        // Combine system message and prompt for Gemini
        const fullPrompt = `${systemMessage}\n\n${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const content = response.text();
        
        console.log('✅ Gemini AI Success - Response length:', content.length);
        return content;
      } catch (geminiError) {
        console.error('❌ Gemini AI Error:', geminiError.message);
        // Fall through to backup providers
      }
    }

    // Fallback: Try OpenAI SDK (works with both OpenAI and compatible APIs)
    try {
      const OpenAI = require('openai');
      
      const apiKey = AIML_API_KEY;
      
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature,
        ...(responseFormat === 'json' && { response_format: { type: 'json_object' } })
      });

      const content = completion.choices[0].message.content;
      console.log('✅ AI API Success - Response length:', content.length);
      return content;
    } catch (openaiError) {
      console.error('❌ OpenAI SDK Error:', openaiError.message);
      
      // Last resort: Try direct HTTP request to Lablab.ai
      if (AI_PROVIDER === 'aiml-api') {
        try {
          console.log('🔄 Trying direct HTTP request to Lablab.ai...');
          const response = await axios.post(
            `${AIML_API_URL}/chat/completions`,
            {
              model: 'gpt-4',
              messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt }
              ],
              temperature,
              ...(responseFormat === 'json' && { response_format: { type: 'json_object' } })
            },
            {
              headers: {
                'Authorization': `Bearer ${AIML_API_KEY}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Arc-RealEstate-AI/1.0'
              },
              timeout: 30000
            }
          );

          return response.data.choices[0].message.content;
        } catch (httpError) {
          console.error('❌ Direct HTTP Error:', httpError.response?.status, httpError.message);
          throw new Error(`AI API failed: ${httpError.response?.status || httpError.message}`);
        }
      }
      
      throw openaiError;
    }
  }
}

module.exports = new AIAgentService();

