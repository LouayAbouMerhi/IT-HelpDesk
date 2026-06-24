import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Page Imports
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import ResetPassword from './Pages/ResetPassword'; 
import AgentRoster from './pages/AgentRoster'; 
import Tickets from './pages/Tickets'; 
import ActivityLogs from './pages/ActivityLogs';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AgentDashboard from './pages/AgentDashboard'; 
import SupervisorDashboard from './pages/SupervisorDashboard';
import Analytics from './pages/Analytics';
import KnowledgeBase from './pages/KnowledgeBase';
import ErrorBoundary from './components/ErrorBoundary';
// Route Guard to prevent unauthorized access
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Route Guard to prevent authenticated users from returning to auth screens
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token) {
    try {
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // Use exact database role IDs and string checks for bulletproof routing
        const rId = String(user.roleid);
        const rName = (user.role || '').toLowerCase();

        if (rId === '1' || rName === 'admin') {
          return <Navigate to="/dashboard" replace />;
        } else if (rId === '4' || rName === 'supervisor') {
          return <Navigate to="/supervisor-dashboard" replace />;
        } else if (rId === '2' || rName === 'agent') {
          return <Navigate to="/agent-workspace" replace />;
        } else {
          // If roleid is 3 or unknown, default to standard employee view
          return <Navigate to="/my-requests" replace />;
        }
      }
    } catch (e) {
      console.error("Failed to parse user data in routing", e);
    }
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
        <ErrorBoundary>
        <Routes>
          {/* Public Authentication Path */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Public Password Reset Path */}
          <Route 
            path="/reset-password" 
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } 
          />

          {/* Protected Enterprise View Metrics */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/my-requests" 
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Agent Workspace */}
          <Route 
            path="/agent-workspace" 
            element={
              <ProtectedRoute>
                <AgentDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Supervisor Dashboard */}
          <Route 
            path="/supervisor-dashboard" 
            element={
              <ProtectedRoute>
                <SupervisorDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Incident Tickets Queue */}
          <Route 
            path="/tickets" 
            element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            } 
          />

          {/* Protected Agent Roster / Profile Management */}
          <Route 
            path="/roster" 
            element={
              <ProtectedRoute>
                <AgentRoster />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/activity-logs" 
            element={
              <ProtectedRoute>
                <ActivityLogs />
              </ProtectedRoute>
            } 
          />

          <Route path="/analytics" element={<Analytics />} />
  <Route path="/knowledge-base" element={<KnowledgeBase />} />

          {/* Catch-all Fallback Navigation Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;