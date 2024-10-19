import React, { useState, useEffect } from 'react';
import { BarChart, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useExpenses } from '../contexts/ExpenseContext';
import { useIncomes } from '../contexts/IncomeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currencyUtils';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const VAT_RATE = 0.21;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Report: React.FC = () => {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { getUsers } = useAuth();
  const { currency, convertAmount } = useCurrency();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [filters, setFilters] = useState({
    category: '',
    paidBy: '',
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

  const filterData = (data: any[]) => {
    return data.filter(item => {
      const itemDate = new Date(item.date);
      const isInDateRange = dateRange[0] && dateRange[1]
        ? isWithinInterval(itemDate, { start: dateRange[0], end: dateRange[1] })
        : selectedMonth !== null
        ? itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear
        : itemDate.getFullYear() === selectedYear;

      return (
        isInDateRange &&
        (filters.category === '' || item.category === filters.category) &&
        (filters.paidBy === '' || item.paidBy === filters.paidBy) &&
        (!filters.taxRelevant || item.taxRelevant)
      );
    });
  };

  const calculateMonthlyTotals = () => {
    const monthlyTotals = months.map((_, index) => ({
      expenses: 0,
      income: 0,
      vat: 0,
    }));

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getFullYear() === selectedYear) {
        monthlyTotals[expenseDate.getMonth()].expenses += convertAmount(expense.amount, expense.currency);
      }
    });

    incomes.forEach(income => {
      const incomeDate = new Date(income.date);
      if (incomeDate.getFullYear() === selectedYear) {
        const convertedSalePrice = convertAmount(income.salePrice, income.currency);
        const convertedCostPrice = convertAmount(income.costPrice, income.currency);
        const convertedAdSpend = convertAmount(income.adSpend, income.currency);
        const netIncome = (convertedSalePrice / (1 + VAT_RATE) - convertedCostPrice - convertedAdSpend) * income.quantity;
        const vat = (convertedSalePrice - convertedSalePrice / (1 + VAT_RATE)) * income.quantity;
        monthlyTotals[incomeDate.getMonth()].income += netIncome;
        monthlyTotals[incomeDate.getMonth()].vat += vat;
      }
    });

    return monthlyTotals;
  };

  const generateChartData = () => {
    if (selectedMonth !== null || (dateRange[0] && dateRange[1])) {
      const totals = calculateTotals();
      return {
        labels: ['Expenses', 'Income', 'Profit', 'VAT'],
        datasets: [
          {
            label: 'Amount',
            data: [totals.expenses, totals.income, totals.profit, totals.vat],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)',
            ],
          },
        ],
      };
    } else {
      const monthlyTotals = calculateMonthlyTotals();
      return {
        labels: months,
        datasets: [
          {
            label: 'Expenses',
            data: monthlyTotals.map(total => total.expenses),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'Income',
            data: monthlyTotals.map(total => total.income),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
          {
            label: 'VAT',
            data: monthlyTotals.map(total => total.vat),
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
          },
        ],
      };
    }
  };

  const calculateTotals = () => {
    const filteredExpenses = filterData(expenses);
    const filteredIncomes = filterData(incomes);

    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + convertAmount(expense.amount, expense.currency), 0);
    let totalIncome = 0;
    let totalVAT = 0;

    filteredIncomes.forEach(income => {
      const convertedSalePrice = convertAmount(income.salePrice, income.currency);
      const convertedCostPrice = convertAmount(income.costPrice, income.currency);
      const convertedAdSpend = convertAmount(income.adSpend, income.currency);
      const netIncome = (convertedSalePrice / (1 + VAT_RATE) - convertedCostPrice - convertedAdSpend) * income.quantity;
      const vat = (convertedSalePrice - convertedSalePrice / (1 + VAT_RATE)) * income.quantity;
      totalIncome += netIncome;
      totalVAT += vat;
    });

    return {
      expenses: totalExpenses,
      income: totalIncome,
      profit: totalIncome - totalExpenses,
      vat: totalVAT,
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Financial Overview ${selectedMonth !== null ? `for ${months[selectedMonth]} ${selectedYear}` : 
          dateRange[0] && dateRange[1] ? `from ${format(dateRange[0], 'MMM d, yyyy')} to ${format(dateRange[1], 'MMM d, yyyy')}` : 
          `for ${selectedYear}`}`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y, currency);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: selectedMonth === null && (!dateRange[0] || !dateRange[1]),
      },
      y: {
        stacked: selectedMonth === null && (!dateRange[0] || !dateRange[1]),
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value, currency);
          }
        }
      }
    }
  };

  const exportToExcel = () => {
    const totals = calculateTotals();
    const worksheetData = [
      { Category: 'Expenses', Amount: totals.expenses },
      { Category: 'Income', Amount: totals.income },
      { Category: 'Profit', Amount: totals.profit },
      { Category: 'VAT', Amount: totals.vat },
    ];

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');
    XLSX.writeFile(wb, `financial_report_${selectedYear}_${selectedMonth !== null ? months[selectedMonth] : 'Full_Year'}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const totals = calculateTotals();

    doc.setFontSize(18);
    doc.text('Financial Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Period: ${selectedMonth !== null ? `${months[selectedMonth]} ${selectedYear}` : 
      dateRange[0] && dateRange[1] ? `${format(dateRange[0], 'MMM d, yyyy')} to ${format(dateRange[1], 'MMM d, yyyy')}` : 
      selectedYear}`, 14, 32);

    const tableData = [
      ['Category', 'Amount'],
      ['Expenses', formatCurrency(totals.expenses, currency)],
      ['Income', formatCurrency(totals.income, currency)],
      ['Profit', formatCurrency(totals.profit, currency)],
      ['VAT', formatCurrency(totals.vat, currency)],
    ];

    doc.autoTable({
      startY: 40,
      head: [tableData[0]],
      body: tableData.slice(1),
    });

    doc.save(`financial_report_${selectedYear}_${selectedMonth !== null ? months[selectedMonth] : 'Full_Year'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financial Report</h1>
      
      <div className="flex items-center space-x-4 flex-wrap">
        <div className="flex items-center">
          <Calendar className="mr-2" />
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value));
              setSelectedMonth(null);
              setDateRange([null, null]);
            }}
            className="p-2 border rounded"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
        <div className="flex items-center">
          <select
            value={selectedMonth !== null ? selectedMonth : ''}
            onChange={(e) => {
              const monthIndex = e.target.value !== '' ? parseInt(e.target.value) : null;
              setSelectedMonth(monthIndex);
              setDateRange([null, null]);
            }}
            className="p-2 border rounded"
          >
            <option value="">Full Year</option>
            {months.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <DatePicker
            selectsRange={true}
            startDate={dateRange[0]}
            endDate={dateRange[1]}
            onChange={(update: [Date | null, Date | null]) => {
              setDateRange(update);
              setSelectedMonth(null);
            }}
            className="p-2 border rounded"
            placeholderText="Select date range"
          />
        </div>
        <div className="flex items-center">
          <Filter className="mr-2" />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">All Categories</option>
            <option value="Shopify">Shopify</option>
            <option value="Advertising">Advertising</option>
            <option value="Transportation">Transportation</option>
          </select>
        </div>
        <div className="flex items-center">
          <select
            value={filters.paidBy}
            onChange={(e) => setFilters({ ...filters, paidBy: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">All Team Members</option>
            {users.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.taxRelevant}
            onChange={(e) => setFilters({ ...filters, taxRelevant: e.target.checked })}
            className="mr-2"
          />
          Tax Relevant Only
        </label>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
        <Bar data={generateChartData()} options={chartOptions} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Object.entries(calculateTotals()).map(([key, value]) => (
            <div key={key} className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
              <p className={`text-2xl font-bold ${key === 'profit' ? (value >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                {formatCurrency(value, currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={exportToExcel}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          <FileSpreadsheet className="inline-block mr-2" />
          Export to Excel
        </button>
        <button
          onClick={exportToPDF}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          <FileText className="inline-block mr-2" />
          Export to PDF
        </button>
      </div>
    </div>
  );
};

export default Report;