import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  fullName?: string;
  phoneNumber?: string;
  company?: string;
  role?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getUsers: () => Promise<string[]>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  setCurrentUser: () => {},
  register: async () => {},
  login: async () => {},
  logout: () => {},
  getUsers: async () => [],
  resetPassword: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
  deleteAccount: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  const register = async (username: string, email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find((user: User) => user.email === email)) {
      throw new Error('User already exists');
    }
    const newUser = { username, email, password, displayName: username };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    setCurrentUser(newUser);
  };

  const login = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((user: User) => user.email === email && user.password === password);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      setCurrentUser(user);
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const getUsers = async (): Promise<string[]> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.map((user: User) => user.username);
  };

  const resetPassword = async (email: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((user: User) => user.email === email);
    if (user) {
      const newPassword = Math.random().toString(36).slice(-8);
      user.password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
      console.log(`New password for ${email}: ${newPassword}`);
    } else {
      throw new Error('User not found');
    }
  };

  const updateProfile = async (profile: Partial<User>) => {
    if (!currentUser) throw new Error('No user logged in');
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUser = { ...currentUser, ...profile };
    const updatedUsers = users.map((user: User) => 
      user.email === currentUser.email ? updatedUser : user
    );
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) throw new Error('No user logged in');
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: User) => u.email === currentUser.email);
    
    if (user && user.password === currentPassword) {
      user.password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify(user));
      setCurrentUser(user);
    } else {
      throw new Error('Current password is incorrect');
    }
  };

  const deleteAccount = async () => {
    if (!currentUser) throw new Error('No user logged in');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.filter((user: User) => user.email !== currentUser.email);
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    setCurrentUser,
    register,
    login,
    logout,
    getUsers,
    resetPassword,
    updateProfile,
    changePassword,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};