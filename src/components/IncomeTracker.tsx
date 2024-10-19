import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit2, FileText, BarChart2, Eye } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useIncomes } from '../contexts/IncomeContext';
import { EU_VAT_RATES, EU_COUNTRIES, ProductType } from '../utils/euVatUtils';
import { useAuth } from '../contexts/AuthContext';
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

const IncomeTracker: React.FC = () => {
  const { incomes, addIncome, deleteIncome, updateIncome } = useIncomes();
  const { getUsers, currentUser } = useAuth();
  const { currency, convertAmount } = useCurrency();
  const [newIncome, setNewIncome] = useState({
    date: new Date(),
    product: '',
    productType: '' as ProductType,
    quantity: 1,
    costPrice: 0,
    salePrice: 0,
    adSpend: 0,
    addedBy: currentUser?.displayName || '',
    customerCountry: '' as EU_COUNTRIES,
    currency: currency,
  });
  const [users, setUsers] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const userList = await getUsers();
      setUsers(userList);
    };
    fetchUsers();
  }, [getUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewIncome(prev => ({
      ...prev,
      [name]: name === 'salePrice' || name === 'costPrice' || name === 'adSpend' || name === 'quantity'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleDateChange = (date: Date) => {
    setNewIncome(prev => ({ ...prev, date }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incomeToAdd = {
      ...newIncome,
      id: editingId || Date.now(),
      vatRate: EU_VAT_RATES[newIncome.customerCountry][newIncome.productType],
    };
    if (editingId) {
      updateIncome(incomeToAdd);
      setEditingId(null);
    } else {
      addIncome(incomeToAdd);
    }
    resetForm();
  };

  const resetForm = () => {
    setNewIncome({
      date: new Date(),
      product: '',
      productType: '' as ProductType,
      quantity: 1,
      costPrice: 0,
      salePrice: 0,
      adSpend: 0,
      addedBy: currentUser?.displayName || '',
      customerCountry: '' as EU_COUNTRIES,
      currency: currency,
    });
  };

  const handleDelete = (id: number) => {
    deleteIncome(id);
  };

  const handleEdit = (income: any) => {
    setNewIncome(income);
    setEditingId(income.id);
  };

  const filteredIncomes = incomes.filter(income => {
    const isInDateRange = dateRange[0] && dateRange[1]
      ? income.date >= dateRange[0] && income.date <= dateRange[1]
      : true;
    const matchesSearch = income.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = filterUser ? income.addedBy === filterUser : true;
    return isInDateRange && matchesSearch && matchesUser;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Date", "Product", "Quantity", "Cost Price", "Sale Price", "Ad Spend", "Added By", "Country", "VAT"];
    const tableRows = filteredIncomes.map(income => [
      income.date.toLocaleDateString(),
      income.product,
      income.quantity,
      formatCurrency(convertAmount(income.costPrice, income.currency), currency),
      formatCurrency(convertAmount(income.salePrice, income.currency), currency),
      formatCurrency(convertAmount(income.adSpend, income.currency), currency),
      income.addedBy,
      income.customerCountry,
      `${(income.vatRate * 100).toFixed(2)}%`,
    ]);

    const totalSales = filteredIncomes.reduce((sum, income) => sum + convertAmount(income.salePrice * income.quantity, income.currency), 0);
    const totalAdSpend = filteredIncomes.reduce((sum, income) => sum + convertAmount(income.adSpend, income.currency), 0);
    const totalCost = filteredIncomes.reduce((sum, income) => sum + convertAmount(income.costPrice * income.quantity, income.currency), 0);
    const totalProfit = totalSales - totalAdSpend - totalCost;

    doc.text("Income Report", 14, 15);
    doc.setFontSize(11);
    doc.text(`Date Range: ${dateRange[0]?.toLocaleDateString() || 'All'} - ${dateRange[1]?.toLocaleDateString() || 'All'}`, 14, 25);
    doc.text(`Currency: ${currency}`, 14, 35);
    doc.text(`Total Sales: ${formatCurrency(totalSales, currency)}`, 14, 45);
    doc.text(`Total Ad Spend: ${formatCurrency(totalAdSpend, currency)}`, 14, 55);
    doc.text(`Total Cost: ${formatCurrency(totalCost, currency)}`, 14, 65);
    doc.text(`Net Profit: ${formatCurrency(totalProfit, currency)}`, 14, 75);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 85,
    });

    doc.save("income_report.pdf");
  };

  const chartData = {
    labels: filteredIncomes.map(income => income.product),
    datasets: [
      {
        label: 'Sales',
        data: filteredIncomes.map(income=> convertAmount(income.salePrice * income.quantity, income.currency)),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Ad Spend',
        data: filteredIncomes.map(income => convertAmount(income.adSpend, income.currency)),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
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
        text: `Income vs Ad Spend (${getCurrencySymbol(currency)})`,
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
      <h2 className="text-2xl font-bold">Income Tracker</h2>
      
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
          placeholder="Search products"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Users</option>
          {users.map(user => (
            <option key={user} value={user}>{user}</option>
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
                selected={newIncome.date}
                onChange={handleDateChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Product</label>
              <input
                type="text"
                name="product"
                value={newIncome.product}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Product Type</label>
              <select
                name="productType"
                value={newIncome.productType}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select product type</option>
                {Object.values(ProductType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={newIncome.quantity}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block mb-2">Cost Price</label>
              <input
                type="number"
                name="costPrice"
                value={newIncome.costPrice}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                step="0.01"
              />
            </div>
            <div>
              <label className="block mb-2">Sale Price</label>
              <input
                type="number"
                name="salePrice"
                value={newIncome.salePrice}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                step="0.01"
              />
            </div>
            <div>
              <label className="block mb-2">Ad Spend</label>
              <input
                type="number"
                name="adSpend"
                value={newIncome.adSpend}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                step="0.01"
              />
            </div>
            <div>
              <label className="block mb-2">Added By</label>
              <select
                name="addedBy"
                value={newIncome.addedBy}
                onChange={handleInputChange}
                className="w-full p-2 borderrounded"
                required
              >
                <option value="">Select a team member</option>
                {users.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">Customer Country</label>
              <select
                name="customerCountry"
                value={newIncome.customerCountry}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select country</option>
                {Object.values(EU_COUNTRIES).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">Currency</label>
              <select
                name="currency"
                value={newIncome.currency}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {editingId ? (
              <>
                <Edit2 className="inline-block mr-2" />
                Update Income
              </>
            ) : (
              <>
                <PlusCircle className="inline-block mr-2" />
                Add Income
              </>
            )}
          </button>
        </form>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">
          {showAllTransactions ? 'All Transactions' : 'Income List'}
        </h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Date</th>
              <th className="text-left">Product</th>
              <th className="text-left">Quantity</th>
              <th className="text-left">Cost Price</th>
              <th className="text-left">Sale Price</th>
              <th className="text-left">Ad Spend</th>
              <th className="text-left">Added By</th>
              <th className="text-left">Country</th>
              <th className="text-left">VAT</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncomes.map(income => (
              <tr key={income.id} className="border-t">
                <td>{income.date.toLocaleDateString()}</td>
                <td>{income.product}</td>
                <td>{income.quantity}</td>
                <td>{formatCurrency(convertAmount(income.costPrice, income.currency), currency)}</td>
                <td>{formatCurrency(convertAmount(income.salePrice, income.currency), currency)}</td>
                <td>{formatCurrency(convertAmount(income.adSpend, income.currency), currency)}</td>
                <td>{income.addedBy}</td>
                <td>{income.customerCountry}</td>
                <td>{(income.vatRate * 100).toFixed(2)}%</td>
                <td>
                  <button
                    onClick={() => handleEdit(income)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(income.id)}
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
        <h3 className="text-xl font-semibold mb-4">Income vs Ad Spend Chart</h3>
        <Bar options={chartOptions} data={chartData} />
      </div>
    </div>
  );
};

export default IncomeTracker;