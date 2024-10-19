import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Trash2, Edit2, FileText, BarChart2, Eye } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuth } from '../contexts/AuthContext';
import { useBalances } from '../contexts/BalanceContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency, currencies, getCurrencySymbol } from '../utils/currencyUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const categories = ['Shopify', 'Advertising', 'Transportation', 'Office Supplies', 'Other'];

const ExpenseTracker: React.FC = () => {
  const { expenses, addExpense, deleteExpense, updateExpense } = useExpenses();
  const { getUsers, currentUser } = useAuth();
  const { updateBalances } = useBalances();
  const { currency, convertAmount } = useCurrency();
  const [users, setUsers] = useState<string[]>([]);
  const [newExpense, setNewExpense] = useState({
    date: new Date(),
    category: '',
    amount: 0,
    paidBy: currentUser?.displayName || '',
    description: '',
    isShared: false,
    sharedWith: [],
    taxRelevant: false,
    isRecurring: false,
    currency: currency,
    proofFile: null as File | null,
    proofUrl: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const userList = await getUsers();
      setUsers(userList);
    };
    fetchUsers();
  }, [getUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleDateChange = (date: Date) => {
    setNewExpense(prev => ({ ...prev, date }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewExpense(prev => ({ ...prev, proofFile: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let proofUrl = newExpense.proofUrl;
    if (newExpense.proofFile) {
      // In a real application, you would upload the file to a server and get a URL back
      // For this example, we'll just use a fake URL
      proofUrl = URL.createObjectURL(newExpense.proofFile);
    }
    const expenseToAdd = {
      ...newExpense,
      id: editingId || Date.now(),
      amount: parseFloat(newExpense.amount.toString()),
      proofUrl,
    };
    if (editingId) {
      updateExpense(expenseToAdd);
      setEditingId(null);
    } else {
      addExpense(expenseToAdd);
    }
    updateBalances(expenseToAdd);
    resetForm();
  };

  const resetForm = () => {
    setNewExpense({
      date: new Date(),
      category: '',
      amount: 0,
      paidBy: currentUser?.displayName || '',
      description: '',
      isShared: false,
      sharedWith: [],
      taxRelevant: false,
      isRecurring: false,
      currency: currency,
      proofFile: null,
      proofUrl: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: number) => {
    const expenseToDelete = expenses.find(expense => expense.id === id);
    if (expenseToDelete) {
      deleteExpense(id);
      updateBalances(expenseToDelete, true);
    }
  };

  const handleEdit = (expense: any) => {
    setNewExpense(expense);
    setEditingId(expense.id);
  };

  const filteredExpenses = expenses.filter(expense => {
    const isInDateRange = dateRange[0] && dateRange[1]
      ? expense.date >= dateRange[0] && expense.date <= dateRange[1]
      : true;
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? expense.category === filterCategory : true;
    return isInDateRange && matchesSearch && matchesCategory;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Date", "Category", "Amount", "Paid By", "Description", "Shared", "Tax Relevant", "Recurring", "Proof"];
    const tableRows = filteredExpenses.map(expense => [
      expense.date.toLocaleDateString(),
      expense.category,
      formatCurrency(convertAmount(expense.amount, expense.currency), currency),
      expense.paidBy,
      expense.description,
      expense.isShared ? 'Yes' : 'No',
      expense.taxRelevant ? 'Yes' : 'No',
      expense.isRecurring ? 'Yes' : 'No',
      expense.proofUrl ? 'Yes' : 'No',
    ]);

    doc.text("Expense Report", 14, 15);
    doc.setFontSize(11);
    doc.text(`Date Range: ${dateRange[0]?.toLocaleDateString() || 'All'} - ${dateRange[1]?.toLocaleDateString() || 'All'}`, 14, 25);
    doc.text(`Currency: ${currency}`, 14, 35);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
    });

    doc.save("expense_report.pdf");
  };

  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'Expenses',
        data: categories.map(category => 
          filteredExpenses
            .filter(expense => expense.category === category)
            .reduce((sum, expense) => sum + convertAmount(expense.amount, expense.currency), 0)
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Expenses by Category (${getCurrencySymbol(currency)})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatCurrency(value, currency),
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Expense Tracker</h2>
      
      <div className="flex space-x-4 mb-4">
        <DatePicker
          selectsRange={true}
          startDate={dateRange[0]}
          endDate={dateRange[1]}
          onChange={(update: [Date | null, Date | null]) => {
            setDateRange(update);
          }}
          className="p-2 border rounded"
          placeholderText="Select date range"
        />
        <input
          type="text"
          placeholder="Search expenses"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button
          onClick={exportToPDF}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          <FileText className="inline-block mr-2" />
          Export to PDF
        </button>
        <button
          onClick={() => setShowAllTransactions(!showAllTransactions)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Eye className="inline-block mr-2" />
          {showAllTransactions ? 'Hide' : 'View All'} Transactions
        </button>
      </div>

      {!showAllTransactions && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
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
              <label className="block mb-2">Currency</label>
              <select
                name="currency"
                value={newExpense.currency}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
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
                  name="isShared"
                  checked={newExpense.isShared}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Shared Expense
              </label>
            </div>
            {newExpense.isShared && (
              <div className="col-span-2">
                <label className="block mb-2">Shared With</label>
                <select
                  multiple
                  name="sharedWith"
                  value={newExpense.sharedWith}
                  onChange={(e) => {
                    const selectedUsers = Array.from(e.target.selectedOptions, option => option.value);
                    setNewExpense(prev => ({ ...prev, sharedWith: selectedUsers }));
                  }}
                  className="w-full p-2 border rounded"
                >
                  {users.filter(user => user !== newExpense.paidBy).map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>
            )}
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
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={newExpense.isRecurring}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Recurring Expense
              </label>
            </div>
            <div className="col-span-2">
              <label className="block mb-2">Proof of Expense</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
                ref={fileInputRef}
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {editingId ? (
              <>
                <Edit2 className="inline-block mr-2" />
                Update Expense
              </>
            ) : (
              <>
                <PlusCircle className="inline-block mr-2" />
                Add Expense
              </>
            )}
          </button>
        </form>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">
          {showAllTransactions ? 'All Transactions' : 'Expense List'}
        </h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Date</th>
              <th className="text-left">Category</th>
              <th className="text-left">Amount</th>
              <th className="text-left">Paid By</th>
              <th className="text-left">Description</th>
              <th className="text-left">Shared</th>
              <th className="text-left">Tax Relevant</th>
              <th className="text-left">Recurring</th>
              <th className="text-left">Proof</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(expense => (
              <tr key={expense.id} className="border-t">
                <td>{expense.date.toLocaleDateString()}</td>
                <td>{expense.category}</td>
                <td>{formatCurrency(convertAmount(expense.amount, expense.currency), currency)}</td>
                <td>{expense.paidBy}</td>
                <td>{expense.description}</td>
                <td>{expense.isShared ? 'Yes' : 'No'}</td>
                <td>{expense.taxRelevant ? 'Yes' : 'No'}</td>
                <td>{expense.isRecurring ? 'Yes' : 'No'}</td>
                <td>
                  {expense.proofUrl && (
                    <a href={expense.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      View Proof
                    </a>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleEdit(expense)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Expenses by Category</h3>
        <Bar options={chartOptions} data={chartData} />
      </div>
    </div>
  );
};

export default ExpenseTracker;