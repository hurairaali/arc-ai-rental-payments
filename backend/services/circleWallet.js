const {
  initiateDeveloperControlledWalletsClient,
} = require("@circle-fin/developer-controlled-wallets");

/**
 * Circle Wallet Service
 * Handles Developer-Controlled Wallets via Circle SDK
 * 
 * Documentation: https://developers.circle.com/api-reference
 */
class CircleWalletService {
  constructor() {
    this.apiKey = process.env.CIRCLE_API_KEY;
    this.entitySecret = process.env.CIRCLE_ENTITY_SECRET;
    
    if (!this.apiKey) {
      throw new Error('CIRCLE_API_KEY is required in environment variables');
    }
    
    if (!this.entitySecret) {
      throw new Error('CIRCLE_ENTITY_SECRET is required in environment variables');
    }
    
    // Initialize Circle SDK client
    this.client = initiateDeveloperControlledWalletsClient({
      apiKey: this.apiKey,
      entitySecret: this.entitySecret,
    });
  }

  /**
   * Create a Wallet Set
   * A wallet set is a collection of wallets managed by a single cryptographic key
   * 
   * @param {string} name - Name for the wallet set
   * @returns {Promise<Object>} Wallet set information
   */
  async createWalletSet(name) {
    try {
      const response = await this.client.createWalletSet({ name });
      return response.data;
    } catch (error) {
      console.error('Error creating wallet set:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * List all wallet sets
   * @returns {Promise<Array>} Array of wallet sets
   */
  async getWalletSets() {
    try {
      const response = await this.client.listWalletSets();
      return response.data?.walletSets || [];
    } catch (error) {
      console.error('Error getting wallet sets:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a wallet in a wallet set
   * 
   * @param {string} walletSetId - ID of the wallet set
   * @param {Array<string>} blockchains - Array of blockchain IDs (e.g., ["ETH-SEPOLIA", "ARC"])
   * @param {string} accountType - "SCA" (Smart Contract Account) or "EOA" (Externally Owned Account)
   * @returns {Promise<Object>} Wallet information
   */
  async createWallet(walletSetId, blockchains = ['ARC-TESTNET'], accountType = 'EOA') {
    try {
      const response = await this.client.createWallets({
        walletSetId: walletSetId,
        blockchains: blockchains,
        accountType: accountType,
        count: 1
      });
      return response.data;
    } catch (error) {
      console.error('Error creating wallet:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get wallet information
   * 
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} Wallet details including address
   */
  async getWallet(walletId) {
    try {
      const response = await this.client.getWallet({ id: walletId });
      return response.data;
    } catch (error) {
      console.error('Error getting wallet:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get wallet address for a specific blockchain
   * 
   * @param {string} walletId - Wallet ID
   * @param {string} blockchain - Blockchain ID (e.g., "ARC")
   * @returns {Promise<string>} Wallet address
   */
  async getWalletAddress(walletId, blockchain = 'ARC-TESTNET') {
    try {
      const wallet = await this.getWallet(walletId);
      const address = wallet.addresses?.find(addr => addr.blockchain === blockchain);
      return address?.address;
    } catch (error) {
      console.error('Error getting wallet address:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get wallet balance
   * 
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} Balance information
   */
  async getWalletBalance(walletId) {
    try {
      const response = await this.client.getWalletTokenBalance({ id: walletId });
      return response.data;
    } catch (error) {
      console.error('Error getting wallet balance:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get wallet token balance for specific blockchain
   * 
   * @param {string} walletId - Wallet ID
   * @param {string} blockchain - Blockchain ID (e.g., "ARC-TESTNET")
   * @returns {Promise<Object>} Token balance information
   */
  async getWalletTokenBalance(walletId, blockchain = 'ARC-TESTNET') {
    try {
      const response = await this.client.getWalletTokenBalance({ 
        id: walletId 
      });
      return response.data;
    } catch (error) {
      console.error('Error getting wallet token balance:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * List transactions for a wallet
   * 
   * @param {string} walletId - Wallet ID
   * @param {string} blockchain - Blockchain ID
   * @returns {Promise<Array>} Array of transactions
   */
  async listTransactions(walletId, blockchain = 'ARC-TESTNET') {
    try {
      const response = await this.client.listTransactions({
        walletId: walletId,
      });
      return response.data?.transactions || [];
    } catch (error) {
      console.error('Error listing transactions:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a transaction (send tokens)
   * 
   * @param {string} walletId - Wallet ID
   * @param {string} destinationAddress - Recipient address
   * @param {string} amount - Amount to send
   * @param {string} tokenId - Token ID (e.g., USDC)
   * @param {string} blockchain - Blockchain ID
   * @returns {Promise<Object>} Transaction information
   */
  async createTransaction(walletId, destinationAddress, amount, tokenId, blockchain = 'ARC-TESTNET') {
    try {
      const response = await this.client.createTransaction({
        amounts: [amount],
        destinationAddress: destinationAddress,
        tokenId: tokenId,
        walletId: walletId,
        fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new CircleWalletService();



