import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useDropzone } from 'react-dropzone';
import { PlusCircle, Upload, X, Trash2 } from 'lucide-react';
import { useExpenses } from '../contexts/ExpenseContext';
import { useIncomes } from '../contexts/IncomeContext';
import { useBalances } from '../contexts/BalanceContext';
import { useAuth } from '../contexts/AuthContext';

interface Expense {
  id: number;
  date: Date;
  category: string;
  amount: number;
  paidBy: string;
  description: string;
  attachment: File | null;
  taxRelevant: boolean;
}

interface DeletedExpense {
  id: number;
  date: Date;
  category: string;
  amount: number;
  paidBy: string;
  description: string;
  deletedAt: Date;
}

const categories = ['Shopify', 'Advertising', 'Transportation', 'Office Supplies', 'Other'];

const MonthlyOverview: React.FC = () => {
  const { month } = useParams<{ month: string }>();
  const { expenses, addExpense, deleteExpense } = useExpenses();
  const { incomes } = useIncomes();
  const { updateBalances } = useBalances();
  const { getUsers } = useAuth();
  const [deletedExpenses, setDeletedExpenses] = useState<DeletedExpense[]>([]);
  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
    date: new Date(),
    category: '',
    amount: 0,
    paidBy: '',
    description: '',
    attachment: null,
    taxRelevant: false,
  });
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const userList = await getUsers();
      setUsers(userList);
    };
    fetchUsers();
  }, [getUsers]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setNewExpense(prev => ({ ...prev, attachment: acceptedFiles[0] }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleDateChange = (date: Date) => {
    setNewExpense(prev => ({ ...prev, date }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expenseToAdd = {
      ...newExpense,
      id: Date.now(),
      amount: parseFloat(newExpense.amount.toString()) || 0,
    };
    addExpense(expenseToAdd);
    updateBalances(expenseToAdd);
    setNewExpense({
      date: new Date(),
      category: '',
      amount: 0,
      paidBy: '',
      description: '',
      attachment: null,
      taxRelevant: false,
    });
  };

  const handleDelete = (id: number) => {
    const expenseToDelete = expenses.find(expense => expense.id === id);
    if (expenseToDelete) {
      deleteExpense(id);
      updateBalances(expenseToDelete, true);
      setDeletedExpenses(prev => [
        ...prev,
        {
          ...expenseToDelete,
          deletedAt: new Date(),
        },
      ]);
    }
  };

  const filteredExpenses = expenses.filter(
    expense => expense.date.getMonth() === parseInt(month!) - 1
  );

  const filteredIncomes = incomes.filter(
    income => income.date.getMonth() === parseInt(month!) - 1
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Expenses and Income for {new Date(2024, parseInt(month!) - 1).toLocaleString('default', { month: 'long' })}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Date</label>
            <DatePicker
              selected={newExpense.date}
              onChange={handleDateChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Category</label>
            <select
              name="category"
              value={newExpense.category}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">Amount</label>
            <input
              type="number"
              name="amount"
              value={newExpense.amount}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
              step="0.01"
            />
          </div>
          <div>
            <label className="block mb-2">Paid By</label>
            <select
              name="paidBy"
              value={newExpense.paidBy}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select who paid</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block mb-2">Description</label>
            <textarea
              name="description"
              value={newExpense.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>
          <div className="col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="taxRelevant"
                checked={newExpense.taxRelevant}
                onChange={handleInputChange}
                className="mr-2"
              />
              Tax Relevant
            </label>
          </div>
          <div className="col-span-2">
            <label className="block mb-2">Attachment</label>
            <div
              {...getRootProps()}
              className={`p-4 border-2 border-dashed rounded ${
                isDragActive ? 'border-blue-400 bg-blue-100' : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              {newExpense.attachment ? (
                <div className="flex items-center justify-between">
                  <span>{newExpense.attachment.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewExpense(prev => ({ ...prev, attachment: null }));
                    }}
                    className="text-red-500"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <p>Drag & drop a file here, or click to select a file</p>
              )}
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <PlusCircle className="inline-block mr-2" />
          Add Expense
        </button>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Expenses</h2>
        <ul className="space-y-2">
          {filteredExpenses.map(expense => (
            <li key={expense.id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
              <span>
                {expense.date.toLocaleDateString()} - {expense.category} - €{expense.amount.toFixed(2)}
              </span>
              <button
                onClick={() => handleDelete(expense.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Income</h2>
        <ul className="space-y-2">
          {filteredIncomes.map(income => (
            <li key={income.id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
              <span>
                {income.date.toLocaleDateString()} - {income.product} - €{income.salePrice.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MonthlyOverview;