import React, { useState, useEffect } from 'react';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuth } from '../contexts/AuthContext';
import { useBalances } from '../contexts/BalanceContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertCurrency, formatCurrency, currencies } from '../utils/currencyUtils';

interface UserBalance {
  [key: string]: number;
}

const SharedExpenses: React.FC = () => {
  const { expenses } = useExpenses();
  const { getUsers, currentUser } = useAuth();
  const { balances, updateBalances } = useBalances();
  const { currency: globalCurrency, convertAmount } = useCurrency();
  const [users, setUsers] = useState<string[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance>({});
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentFrom, setPaymentFrom] = useState<string>('');
  const [paymentTo, setPaymentTo] = useState<string>('');
  const [paymentCurrency, setPaymentCurrency] = useState<string>(globalCurrency);

  useEffect(() => {
    const fetchUsers = async () => {
      const userList = await getUsers();
      setUsers(userList);
    };
    fetchUsers();
  }, [getUsers]);

  useEffect(() => {
    calculateBalances();
  }, [expenses, users, globalCurrency]);

  const calculateBalances = () => {
    const newBalances: UserBalance = {};
    users.forEach(user => {
      newBalances[user] = 0;
    });

    expenses.forEach(expense => {
      if (expense.isShared) {
        const sharedAmount = convertAmount(expense.amount, expense.currency) / (expense.sharedWith.length + 1);
        newBalances[expense.paidBy] += convertAmount(expense.amount, expense.currency) - sharedAmount;
        expense.sharedWith.forEach(user => {
          newBalances[user] -= sharedAmount;
        });
      }
    });

    setUserBalances(newBalances);
  };

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (amount && paymentFrom && paymentTo) {
      const convertedAmount = convertAmount(amount, paymentCurrency);
      const updatedBalances = { ...userBalances };
      updatedBalances[paymentFrom] += convertedAmount;
      updatedBalances[paymentTo] -= convertedAmount;
      setUserBalances(updatedBalances);
      updateBalances({
        amount: convertedAmount,
        paidBy: paymentFrom,
        sharedWith: [paymentTo],
      });
      setPaymentAmount('');
      setPaymentFrom('');
      setPaymentTo('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Shared Expenses</h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">User Balances</h3>
        <ul className="space-y-2">
          {Object.entries(userBalances).map(([user, balance]) => (
            <li key={user} className="flex justify-between items-center">
              <span>{user}</span>
              <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(balance, globalCurrency)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Log Payment</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">From</label>
            <select
              value={paymentFrom}
              onChange={(e) => setPaymentFrom(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select user</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">To</label>
            <select
              value={paymentTo}
              onChange={(e) => setPaymentTo(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select user</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">Amount</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full p-2 border rounded"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block mb-2">Currency</label>
            <select
              value={paymentCurrency}
              onChange={(e) => setPaymentCurrency(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handlePayment}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Log Payment
        </button>
      </div>
    </div>
  );
};

export default SharedExpenses;