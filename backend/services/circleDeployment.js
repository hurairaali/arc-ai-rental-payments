const axios = require('axios');
const { ethers } = require('ethers');

/**
 * Circle Deployment Service
 * Handles contract deployment using Circle Wallet API
 */
class CircleDeploymentService {
  constructor() {
    this.apiKey = process.env.CIRCLE_API_KEY;
    this.baseURL = process.env.CIRCLE_API_URL || 'https://api.circle.com/v1/w3s';
    this.walletId = process.env.CIRCLE_DEPLOYER_WALLET_ID;
    this.walletSetId = process.env.CIRCLE_WALLET_SET_ID;
    
    if (!this.apiKey) {
      throw new Error('CIRCLE_API_KEY is required');
    }
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Deploy a contract using Circle's Transaction API
   * 
   * @param {string} contractBytecode - Compiled contract bytecode
   * @param {Array} constructorArgs - Constructor arguments (encoded)
   * @param {string} blockchain - Blockchain ID (default: 'ARC')
   * @returns {Promise<Object>} Transaction result
   */
  async deployContract(contractBytecode, constructorArgs = [], blockchain = 'ARC') {
    if (!this.walletId) {
      throw new Error('CIRCLE_DEPLOYER_WALLET_ID is required');
    }

    try {
      // Encode constructor arguments if provided
      let data = contractBytecode;
      if (constructorArgs.length > 0) {
        const abiCoder = new ethers.AbiCoder();
        const encodedArgs = abiCoder.encode(
          constructorArgs.map(() => 'bytes'),
          constructorArgs
        );
        data = contractBytecode + encodedArgs.slice(2); // Remove '0x' prefix
      }

      // Create deployment transaction
      const response = await axios.post(
        `${this.baseURL}/developer/transactions`,
        {
          walletId: this.walletId,
          destinationAddress: null, // Contract creation
          amount: {
            amount: '0',
            currency: 'USDC'
          },
          fee: {
            type: 'level',
            config: {
              feeLevel: 'MEDIUM'
            }
          },
          data: data,
          blockchain: blockchain
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error deploying contract:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get transaction status
   * 
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction status
   */
  async getTransactionStatus(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/developer/transactions/${transactionId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting transaction status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Wait for transaction to be confirmed
   * 
   * @param {string} transactionId - Transaction ID
   * @param {number} maxWaitTime - Maximum wait time in milliseconds (default: 5 minutes)
   * @returns {Promise<Object>} Confirmed transaction
   */
  async waitForTransaction(transactionId, maxWaitTime = 300000) {
    const startTime = Date.now();
    const pollInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getTransactionStatus(transactionId);
      
      if (status.data?.status === 'COMPLETE') {
        return status.data;
      }
      
      if (status.data?.status === 'FAILED') {
        throw new Error(`Transaction failed: ${status.data.errorMessage || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Transaction timeout - transaction may still be pending');
  }
}

module.exports = new CircleDeploymentService();

