import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { currentUser, updateProfile, deleteAccount } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      setFullName(currentUser.fullName || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setCompany(currentUser.company || '');
      setRole(currentUser.role || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await updateProfile({ 
        displayName: username, 
        email, 
        fullName, 
        phoneNumber, 
        company, 
        role 
      });
      setMessage('Profile updated successfully');
    } catch (error: any) {
      setMessage(`Failed to update profile: ${error.message}`);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      navigate('/login');
    } catch (error: any) {
      setMessage(`Failed to delete account: ${error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
          <div className="flex items-center">
            <User size={24} className="text-gray-500 mr-2" />
            <span className="text-lg font-semibold text-gray-700">{username}</span>
          </div>
        </div>
        
        {message && (
          <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="username" className="block mb-1 font-medium text-gray-700">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label htmlFor="email" className="block mb-1 font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label htmlFor="fullName" className="block mb-1 font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block mb-1 font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label htmlFor="company" className="block mb-1 font-medium text-gray-700">Company</label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label htmlFor="role" className="block mb-1 font-medium text-gray-700">Role</label>
              <input
                type="text"
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300">
              Update Profile
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300"
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-5 rounded-lg shadow-xl">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-red-500 mr-2" size={24} />
              <h3 className="text-lg font-bold">Delete Account</h3>
            </div>
            <p className="mb-4">Are you sure you want to delete your account? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;