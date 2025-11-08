// Backend URL - uses environment variable in production
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Log backend URL (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 Backend URL:', BACKEND_URL);
}

export const CONTRACTS = {
  PROPERTY_TOKEN: process.env.REACT_APP_PROPERTY_TOKEN_ADDRESS || '0xAe83572944D669C74BEDFD9FCfdA95131CDB7e62',
  PAYMENT_MANAGER: process.env.REACT_APP_PAYMENT_MANAGER_ADDRESS || '0x1532aFA772Ca3F09225370ef5BeAb05172243e3B',
  USDC: process.env.REACT_APP_USDC_ADDRESS || '0x3600000000000000000000000000000000000000',
};

export const ARC_NETWORK = {
  RPC_URL: process.env.REACT_APP_ARC_RPC_URL || 'https://rpc.testnet.arc.network',
  CHAIN_ID: Number(process.env.REACT_APP_ARC_CHAIN_ID) || 5042002,
  EXPLORER: process.env.REACT_APP_ARC_EXPLORER || 'https://testnet.arcscan.io',
  NAME: 'Arc Testnet',
  CURRENCY: 'USDC',
};


