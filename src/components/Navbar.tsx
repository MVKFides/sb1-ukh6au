import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, BarChart, DollarSign, CreditCard, User, Settings, Key, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { currencies } from '../utils/currencyUtils';

const Navbar: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const { currency, changeCurrency } = useCurrency();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const closeDropdown = () => setIsProfileOpen(false);
    window.addEventListener('popstate', closeDropdown);
    return () => window.removeEventListener('popstate', closeDropdown);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsProfileOpen(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-600">Finance Tracker</Link>
          <div className="flex items-center space-x-6">
            <NavLink to="/" icon={<Home size={20} />} text="Dashboard" onClick={() => handleNavigation('/')} />
            <NavLink to="/income" icon={<DollarSign size={20} />} text="Income" onClick={() => handleNavigation('/income')} />
            <NavLink to="/expenses" icon={<CreditCard size={20} />} text="Expenses" onClick={() => handleNavigation('/expenses')} />
            <NavLink to="/report" icon={<BarChart size={20} />} text="Report" onClick={() => handleNavigation('/report')} />
            <select
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              className="p-2 border rounded"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors duration-300"
              >
                <User size={20} className="mr-2" />
                <span>{currentUser?.displayName || 'User'}</span>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={() => handleNavigation('/profile')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Settings size={16} className="mr-2" />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => handleNavigation('/change-password')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Key size={16} className="mr-2" />
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink: React.FC<{ to: string; icon: React.ReactNode; text: string; onClick: () => void }> = ({ to, icon, text, onClick }) => (
  <button onClick={onClick} className="flex items-center text-gray-700 hover:text-blue-600 transition-colors duration-300">
    {icon}
    <span className="ml-2">{text}</span>
  </button>
);

export default Navbar;