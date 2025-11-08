import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config/constants';

interface Invoice {
  _id?: string;
  id?: string;
  propertyName: string;
  amount: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  txHash?: string;
  paidDate?: string;
}

interface Property {
  _id?: string;
  name: string;
  tokenId: string;
  monthlyRent: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const TenantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: "👋 Hi! I'm your AI payment assistant. I can help you pay rent, view invoices, and set up auto-pay. What would you like to do?",
      timestamp: new Date(),
    },
  ]);

  const userId = 'tenant123'; // In production, get from auth
  
  // Setup WebSocket for real-time updates
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    // Listen for invoice events
    newSocket.on('invoice:created', (data) => {
      console.log('📝 New invoice received:', data);
      if (data.tenantId === userId) {
        loadData(); // Reload data
        
        // Add AI notification
        const aiMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: `📝 ${data.message} - Would you like to pay it now?`,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, aiMsg]);
      }
    });

    newSocket.on('invoice:paid', (data) => {
      console.log('✅ Payment confirmed:', data);
      loadData();
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Load real data from backend
  useEffect(() => {
    loadData();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load invoices
      const invRes = await fetch(`${BACKEND_URL}/api/invoices/tenant/${userId}`);
      const invData = await invRes.json();
      if (invData.success) {
        setInvoices(invData.invoices || []);
      }

      // Load property
      const propRes = await fetch(`${BACKEND_URL}/api/properties/tenant/${userId}`);
      const propData = await propRes.json();
      if (propData.success && propData.properties.length > 0) {
        setProperty(propData.properties[0]);
      }

      // Load tenant wallet balance from Circle
      try {
        const balanceRes = await fetch(`${BACKEND_URL}/api/wallet/balance/tenant`);
        const balanceData = await balanceRes.json();
        if (balanceData.success) {
          console.log(`👤 Tenant Wallet: ${balanceData.address} - $${balanceData.balance}`);
        }
      } catch (error) {
        console.error('Error loading wallet balance:', error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isAiTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    const currentMessage = message;
    setMessage('');
    setIsAiTyping(true);

    // Call backend AI API
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          userId: 'tenant123',
          role: 'tenant',
        }),
      });

      const data = await response.json();
      
      // Natural typing delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.response || 'I encountered an error processing your request.',
        timestamp: new Date(),
      };

      setIsAiTyping(false);
      setChatMessages(prev => [...prev, aiMsg]);

      // Reload data if AI performed an action
      if (data.action && (data.action.includes('invoice') || data.action.includes('payment') || data.action.includes('executed'))) {
        setTimeout(() => {
          loadData();
        }, 1500);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      setIsAiTyping(false);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMsg]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Tenant Dashboard</h1>
                <p className="text-xs text-gray-500">Manage your rent payments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                Wallet: 0xabc1...5678
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left Sidebar - Invoices */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto h-full">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Rent Invoices</h2>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">No invoices yet</div>
              ) : (
                invoices.map((invoice) => (
                  <div
                    key={invoice._id || invoice.id}
                    className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="mb-2">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{invoice.propertyName}</h3>
                      <p className="text-xs text-gray-500">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">${invoice.amount}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    {invoice.txHash && (
                      <p className="text-xs text-gray-500 mt-2 truncate">Tx: {invoice.txHash.substring(0, 10)}...</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center - AI Chat */}
          <div className="col-span-6 bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">AI Payment Assistant</h2>
                  <div className="flex items-center text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                    Online
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input - Fixed at bottom */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask AI to pay rent, check invoices..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isAiTyping}
                  className={`px-6 py-3 text-white rounded-lg font-medium text-sm transition-colors ${
                    isAiTyping 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isAiTyping ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send'}
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setMessage('Show my invoices')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  My Invoices
                </button>
                <button
                  onClick={() => setMessage('Pay rent now')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  Pay Now
                </button>
                <button
                  onClick={() => setMessage('Show payment history')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  History
                </button>
                <button
                  onClick={() => setMessage('Enable auto-pay')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  Auto-Pay
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Property Info */}
          <div className="col-span-3 space-y-4 overflow-y-auto h-full">
            {/* Property Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Details</h3>
              {property ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Property</p>
                    <p className="text-sm font-semibold text-gray-900">{property.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Token ID</p>
                    <p className="text-sm font-mono text-gray-900">{property.tokenId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monthly Rent</p>
                    <p className="text-sm font-semibold text-gray-900">${property.monthlyRent} USDC</p>
                  </div>
                  {invoices.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Next Due</p>
                      <p className="text-sm font-semibold text-yellow-600">
                        {new Date(invoices[0].dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 text-center py-2">No property assigned</div>
              )}
            </div>

            {/* Auto-Pay Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Auto-Pay</h3>
                <button
                  onClick={() => setAutoPayEnabled(!autoPayEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoPayEnabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoPayEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-600">
                {autoPayEnabled
                  ? 'Rent will be paid automatically on due date'
                  : 'Enable to automate your rent payments'}
              </p>
            </div>

            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4 text-white">
              <p className="text-sm opacity-90 mb-2">Payment Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-90">Paid This Year</span>
                  <span className="font-semibold">
                    ${invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-90">Pending</span>
                  <span className="font-semibold">
                    ${invoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + parseFloat(inv.amount), 0).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/20">
                  <div className="flex justify-between">
                    <span className="text-sm opacity-90">Total</span>
                    <span className="font-bold text-lg">
                      ${invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Payments</h3>
              <div className="space-y-3">
                {invoices.filter(i => i.status === 'paid').length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-2">No payments yet</div>
                ) : (
                  invoices.filter(i => i.status === 'paid').slice(0, 3).map((invoice) => (
                    <div key={invoice._id} className="flex items-start space-x-2 text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">${invoice.amount} USDC</p>
                        <p className="text-gray-500">
                          {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : 'N/A'} • Paid
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;

