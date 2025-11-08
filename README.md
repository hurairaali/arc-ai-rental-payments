# 🚀 Arc AI Rental Payments

> **AI-Powered Real Estate Rental Payment System on Arc Blockchain**

Built for the **AI Agents Arc USDC Hackathon** - An intelligent payment system where AI makes decisions and Arc blockchain executes them with USDC.

[![Arc Blockchain](https://img.shields.io/badge/Arc-Testnet-blue)](https://arc.xyz)
[![USDC](https://img.shields.io/badge/USDC-Native-green)](https://circle.com)
[![AI](https://img.shields.io/badge/AI-Gemini-orange)](https://ai.google.dev)

---

## 🎯 Problem Statement

Traditional rental payment systems are:
- ⏰ Time-consuming (20+ hours/month per property)
- 💸 Expensive ($500-2000/month in management fees)
- 🐌 Slow (manual payment collection)
- ❌ Error-prone (payment disputes)

## 💡 Solution

**PayArc** = AI Brain + Arc Blockchain Execution

An **autonomous AI agent** that:
- 🤖 Monitors rental payments 24/7
- 🧠 Makes intelligent decisions (late fees, reminders)
- ⚡ Executes instant USDC transfers on Arc
- 🔗 Records immutably on blockchain

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   AI Agent  │ ───▶ │ Arc Blockchain│ ───▶ │ USDC Transfer│
│  (Gemini)   │      │   (Smart      │      │ (Circle)    │
│  Decides    │      │   Contracts)  │      │ Executes    │
└─────────────┘      └──────────────┘      └─────────────┘
```

---

## 🛠️ Tech Stack

### **Blockchain**
- **Arc Testnet** - EVM-compatible blockchain with USDC as native gas
- **Solidity 0.8.20** - Smart contracts
- **Foundry/Anvil** - Development & testing

### **Smart Contracts**
- **PropertyToken** (ERC721): `0xae83572944d669c74bedfd9fcfda95131cdb7e62`
- **PaymentManager**: `0x1532afa772ca3f09225370ef5beab05172243e3b`

### **Backend**
- **Node.js + Express** - REST API
- **MongoDB** - Database
- **Socket.io** - Real-time WebSocket updates
- **Circle SDK** - Developer-Controlled Wallets

### **AI**
- **Google Gemini** (gemini-2.5-flash) - Decision making
- **Autonomous Agent** - 24/7 monitoring

### **Frontend**
- **React + TypeScript** - UI
- **Tailwind CSS** - Styling
- **Real-time updates** - Live notifications

---

## ✨ Key Features

### 1. 🤖 **Autonomous AI Agent**
- Runs 24/7 independently
- Checks payments every 60 seconds
- Calculates fair late fees (AI-powered)
- Sends proactive reminders
- Risk assessment per tenant

### 2. 🔗 **Arc Blockchain Integration**
- Smart contracts deployed on Arc testnet
- USDC as native payment currency
- Instant settlement
- Immutable transaction records

### 3. 💬 **Conversational AI Chat**
- Natural language processing
- "Create invoice for Sunset Villa, $3, due Dec 1"
- Real-time responses
- Context-aware assistance

### 4. ⚡ **Real-Time Updates**
- WebSocket notifications
- Instant payment status
- Live dashboard updates

### 5. 💰 **Circle USDC Wallets**
- Separate owner & tenant wallets
- Automatic transaction signing
- Secure & compliant

---

## 📦 Project Structure

```
arc-ai-rental-payments/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/         # Owner & Tenant dashboards
│   │   ├── components/    # Reusable components
│   │   └── config/        # Constants & config
│   └── package.json
│
├── backend/               # Node.js backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── services/         # AI agent, Circle wallet
│   ├── scripts/          # Database seed scripts
│   └── index.js          # Entry point
│
└── contracts/            # Smart contracts
    ├── contracts/        # Solidity files
    ├── script/          # Deployment scripts
    └── foundry.toml     # Foundry config
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Foundry (for smart contracts)

### 1. Clone Repository
```bash
git clone https://github.com/hurairaali/arc-ai-rental-payments.git
cd arc-ai-rental-payments
```

### 2. Setup Backend
```bash
cd backend
npm install

# Create .env file with:
MONGODB_URI=mongodb://localhost:27017/arc-real-estate
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
GEMINI_API_KEY=your_gemini_api_key
ARC_RPC_URL=https://rpc-testnet.arc.xyz
PROPERTY_TOKEN_ADDRESS=0xae83572944d669c74bedfd9fcfda95131cdb7e62
PAYMENT_MANAGER_ADDRESS=0x1532afa772ca3f09225370ef5beab05172243e3b

# Start backend
npm start
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Access Application
- **Owner Dashboard**: http://localhost:3000/owner
- **Tenant Dashboard**: http://localhost:3000/tenant

---

## 🎮 Demo Walkthrough

### Owner Flow:
1. View 3 tokenized properties
2. Chat with AI: "Create invoice for Sunset Villa, $3, due Dec 1"
3. AI creates invoice instantly
4. Track rent collection (50% collected)
5. View wallet balance ($10 USDC)

### Tenant Flow:
1. View pending rent invoices
2. Chat with AI: "Pay rent now"
3. AI executes USDC payment via Circle
4. Owner receives instant notification
5. Transaction recorded on Arc blockchain

### Autonomous AI:
1. Detects overdue payment (Downtown Loft)
2. Calculates 5% late fee (AI decision)
3. Sends reminder to tenant
4. Logs decision with 92% confidence

---

## 🎯 Hackathon Alignment

### ✅ AI Drives Decisions
- Google Gemini AI analyzes payment context
- Makes autonomous decisions (late fees, reminders)
- Natural language interface
- 24/7 monitoring without human intervention

### ✅ Arc Executes with USDC
- Live on Arc Testnet (Chain ID: 5042002)
- USDC as native gas currency
- Smart contracts deployed & verified
- Circle Developer-Controlled Wallets

### ✅ Real-World Assets (RWA)
- Tokenized real estate (ERC721 NFTs)
- Recurring rental payments
- Monthly rent automation
- Property ownership tracking

---

## 📊 Smart Contracts

### PropertyToken (ERC721)
```solidity
// Tokenizes real estate properties
contract PropertyToken is ERC721, ERC721Enumerable, Ownable {
    function createProperty(string name, uint256 monthlyRent) external;
    function purchaseShares(uint256 propertyId, uint256 amount) external;
}
```

### PaymentManager
```solidity
// Manages automated USDC payments
contract PaymentManager {
    function createPaymentSchedule(...) external;
    function processPayment(uint256 invoiceId) external;
}
```

**Deployed on Arc Testnet:**
- PropertyToken: [`0xae83...7e62`](https://explorer-testnet.arc.xyz/address/0xae83572944d669c74bedfd9fcfda95131cdb7e62)
- PaymentManager: [`0x1532...3e3b`](https://explorer-testnet.arc.xyz/address/0x1532afa772ca3f09225370ef5beab05172243e3b)

---

## 🤖 AI Agent Capabilities

```javascript
Autonomous Features:
├── Overdue Payment Detection (every 60s)
├── AI Decision Making
│   ├── Late fee calculation (fair & reasonable)
│   ├── Risk scoring (0-100)
│   └── Action recommendation (with confidence %)
├── Proactive Reminders
│   ├── 3 days before due date
│   ├── On due date
│   └── After overdue
└── Learning & Optimization
    └── Adapts to tenant payment patterns
```

---

## 💻 API Endpoints

### Properties
- `GET /api/properties/owner/:userId` - Get owner's properties
- `GET /api/properties/tenant/:userId` - Get tenant's properties

### Invoices
- `GET /api/invoices/owner/:userId` - Get owner's invoices
- `POST /api/invoices/create` - Create new invoice
- `POST /api/invoices/:id/pay` - Execute payment

### AI Agent
- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/status` - Get autonomous agent status

### Wallet
- `GET /api/wallet/balance/:role` - Get wallet balance
- `GET /api/wallet/transactions/:role` - Get transaction history

---

## 🔐 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/arc-real-estate
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
GEMINI_API_KEY=your_gemini_api_key
CIRCLE_OWNER_WALLET_ID=owner_wallet_id
CIRCLE_TENANT_WALLET_ID=tenant_wallet_id
ARC_RPC_URL=https://rpc-testnet.arc.xyz
PROPERTY_TOKEN_ADDRESS=0xae83572944d669c74bedfd9fcfda95131cdb7e62
PAYMENT_MANAGER_ADDRESS=0x1532afa772ca3f09225370ef5beab05172243e3b
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Smart contract tests
cd contracts
forge test

# Frontend tests
cd frontend
npm test
```

---

## 📈 Market Opportunity

- **$3.7 Trillion** in annual rental payments globally
- **95%** still use manual payment collection
- **30%** average late payment rate
- **$12B** lost annually to inefficiencies

**PayArc Solution:**
- ✅ Automate 100% of collection
- ✅ Reduce late payments by 80%
- ✅ Save $500-2000/month per property

---

## 🛣️ Roadmap

### Phase 1 (Current) ✅
- Smart contracts deployed
- AI agent functional
- Owner & Tenant dashboards
- Circle USDC integration

### Phase 2 (Q1 2025)
- Deploy to Arc Mainnet
- Multi-property management
- Tenant credit scoring
- Mobile app

### Phase 3 (Q2 2025)
- International payments
- Automated lease renewals
- AI-powered rent pricing
- Property marketplace

---

## 👥 Team

- **Developer**: Huraira Ali
- **Hackathon**: AI Agents Arc USDC
- **Date**: November 2024

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- **Arc Blockchain** - For the amazing testnet and USDC integration
- **Circle** - For Developer-Controlled Wallets SDK
- **Google AI** - For Gemini API access
- **Lablab.ai** - For hosting the hackathon

---

## 📞 Contact

- **GitHub**: [@hurairaali](https://github.com/hurairaali)
- **Project**: [arc-ai-rental-payments](https://github.com/hurairaali/arc-ai-rental-payments)

---

## 🎉 Demo Links

- **Live Demo**: [Coming Soon]
- **Video Walkthrough**: [Coming Soon]
- **Presentation**: [Coming Soon]

---

**Built with ❤️ for the AI Agents Arc USDC Hackathon**
