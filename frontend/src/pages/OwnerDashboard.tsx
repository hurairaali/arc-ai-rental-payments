import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config/constants';

interface Property {
  _id?: string;
  id?: string;
  name: string;
  monthlyRent: string;
  tokenId: string;
  status?: string;
  tenantId?: string;
}

interface Invoice {
  _id?: string;
  propertyName: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: "👋 Hey! I'm your AI assistant. I can help you create invoices, check payments, and manage your properties. What would you like to do today?",
      timestamp: new Date(),
    },
  ]);

  const userId = 'owner123'; // In production, get from auth
  
  // Setup WebSocket for real-time updates
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    // Listen for invoice events
    newSocket.on('invoice:created', (data) => {
      console.log('📝 New invoice:', data);
      if (data.ownerId === userId) {
        loadData(); // Reload data
        
        // Add AI notification
        const aiMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: `✅ ${data.message}`,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, aiMsg]);
      }
    });

    newSocket.on('invoice:paid', (data) => {
      console.log('💰 Payment received:', data);
      loadData();
      
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'ai',
        content: `💰 ${data.message}`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMsg]);
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
      
      // Load properties
      const propsRes = await fetch(`${BACKEND_URL}/api/properties/owner/${userId}`);
      const propsData = await propsRes.json();
      if (propsData.success) {
        setProperties(propsData.properties || []);
      }

      // Load invoices
      const invRes = await fetch(`${BACKEND_URL}/api/invoices/owner/${userId}`);
      const invData = await invRes.json();
      if (invData.success) {
        setInvoices(invData.invoices || []);
      }

      // Load real wallet balance from Circle (Owner wallet)
      try {
        const balanceRes = await fetch(`${BACKEND_URL}/api/wallet/balance/owner`);
        const balanceData = await balanceRes.json();
        if (balanceData.success) {
          setWalletBalance(balanceData.balance || '0');
          console.log(`👨‍💼 Owner Wallet: ${balanceData.address} - $${balanceData.balance}`);
        }
      } catch (error) {
        console.error('Error loading wallet balance:', error);
        setWalletBalance('0');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isAiTyping) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    const currentMessage = message;
    setMessage('');
    setIsAiTyping(true); // Show typing indicator

    // Call backend AI API
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          userId: 'owner123',
          role: 'owner',
        }),
      });

      const data = await response.json();
      
      // Simulate natural typing delay
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
      if (data.action && (data.action.includes('invoice') || data.action.includes('payment') || data.action.includes('created') || data.action.includes('executed'))) {
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

  // Get property status from invoices
  const getPropertyStatus = (propertyName: string): 'paid' | 'pending' | 'overdue' => {
    const propertyInvoices = invoices.filter(inv => inv.propertyName === propertyName);
    if (propertyInvoices.length === 0) return 'pending';
    
    const latest = propertyInvoices[propertyInvoices.length - 1];
    return latest.status;
  };

  // Calculate stats from real data
  const calculateStats = () => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const totalThisMonth = totalPaid + totalPending;
    
    const collectionRate = invoices.length > 0 
      ? Math.round((paidInvoices.length / invoices.length) * 100) 
      : 0;

    return {
      totalPaid,
      totalPending,
      totalThisMonth,
      collectionRate,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
    };
  };

  const stats = calculateStats();

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
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Owner Dashboard</h1>
                <p className="text-xs text-gray-500">Manage your rental properties</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                Wallet: 0xd630...4c77
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left Sidebar - Properties */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto h-full">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Your Properties</h2>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">Loading properties...</div>
              ) : properties.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">No properties yet</div>
              ) : (
                properties.map((property) => {
                  const status = getPropertyStatus(property.name);
                  return (
                    <div
                      key={property._id || property.id}
                      className="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">{property.name}</h3>
                        <span className="text-xs text-gray-500">{property.tokenId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">${property.monthlyRent}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-xs text-indigo-700 font-medium mb-1">💡 Tip</p>
              <p className="text-xs text-indigo-600">
                Use AI chat to create invoices. Example: "Create invoice for Ocean Apartment, $3, due Dec 1"
              </p>
            </div>
          </div>

          {/* Center - AI Chat */}
          <div className="col-span-6 bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">AI Assistant</h2>
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
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
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
                  placeholder="Ask AI to create invoices, check status..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isAiTyping}
                  className={`px-6 py-3 text-white rounded-lg font-medium text-sm transition-colors ${
                    isAiTyping 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
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
                  onClick={() => setMessage('Show payment status')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  Check Status
                </button>
                <button
                  onClick={() => setMessage('Create invoice')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  Create Invoice
                </button>
                <button
                  onClick={() => setMessage('Show total collected')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  Total Collected
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Stats */}
          <div className="col-span-3 space-y-4 overflow-y-auto h-full">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
              <p className="text-sm opacity-90 mb-1">Total Balance</p>
              <p className="text-3xl font-bold mb-1">${parseFloat(walletBalance).toLocaleString()}</p>
              <p className="text-sm opacity-75">USDC</p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Overview</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Properties</span>
                    <span className="font-semibold text-gray-900">{properties.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-semibold text-green-600">${stats.totalThisMonth.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-semibold text-yellow-600">${stats.totalPending.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Collection Rate</span>
                    <span className="font-semibold text-gray-900">{stats.collectionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${stats.collectionRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {invoices.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-2">No recent activity</div>
                ) : (
                  invoices.slice(0, 3).map((invoice) => (
                    <div key={invoice._id} className="flex items-start space-x-2 text-xs">
                      <div className={`w-2 h-2 rounded-full mt-1 ${
                        invoice.status === 'paid' ? 'bg-green-500' : 
                        invoice.status === 'pending' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-gray-900">
                          {invoice.status === 'paid' ? 'Payment received' : 
                           invoice.status === 'pending' ? 'Invoice created' : 'Overdue'}
                        </p>
                        <p className="text-gray-500">{invoice.propertyName} • ${invoice.amount}</p>
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

export default OwnerDashboard;

