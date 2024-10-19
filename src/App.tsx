import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import MonthlyOverview from './components/MonthlyOverview';
import Report from './components/Report';
import Navbar from './components/Navbar';
import IncomeTracker from './components/IncomeTracker';
import ExpenseTracker from './components/ExpenseTracker';
import VATReport from './components/VATReport';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Profile from './components/Profile';
import ChangePassword from './components/ChangePassword';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { IncomeProvider } from './contexts/IncomeContext';
import { BalanceProvider } from './contexts/BalanceContext';
import { useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';

function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <CurrencyProvider>
        <ExpenseProvider>
          <IncomeProvider>
            <BalanceProvider>
              <div className="min-h-screen bg-gray-100 flex flex-col">
                {currentUser && <Navbar />}
                <div className="flex-grow container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route
                      path="/"
                      element={currentUser ? <Dashboard /> : <Navigate to="/login" />}
                    />
                    <Route
                      path="/month/:month"
                      element={currentUser ? <MonthlyOverview /> : <Navigate to="/login" />}
                    />
                    <Route
                      path="/report"
                      element={currentUser ? <Report /> : <Navigate to="/login" />}
                    />
                    <Route
                      path="/income"
                      element={currentUser ? <IncomeTracker /> : <Navigate to="/login" />}
                    />
                    <Route
                      path="/expenses"
                      element={currentUser ? <ExpenseTracker /> : <Navigate to="/login" />}
                    />
                    <Route
                      path="/vat-report"
                      element={currentUser ? <VATReport /> : <Navigate to="/login" />}
                    />
                    <Route
                      path="/profile"
                      element={currentUser ? <Profile /> : <Navigate to="/login" />}
                    />
                    <Route
                      path="/change-password"
                      element={currentUser ? <ChangePassword /> : <Navigate to="/login" />}
                    />
                  </Routes>
                </div>
              </div>
            </BalanceProvider>
          </IncomeProvider>
        </ExpenseProvider>
      </CurrencyProvider>
    </Router>
  );
}

export default App;