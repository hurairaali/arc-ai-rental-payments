import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RoleSelection from './pages/RoleSelection';
import OwnerDashboard from './pages/OwnerDashboard';
import TenantDashboard from './pages/TenantDashboard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/tenant" element={<TenantDashboard />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;





