import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, DollarSign, Bell, BarChart } from 'lucide-react';
import TodoList from './TodoList';
import { useAuth } from '../contexts/AuthContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useIncomes } from '../contexts/IncomeContext';
import { useBalances } from '../contexts/BalanceContext';
import { useCurrency } from '../contexts/CurrencyContext';
import SharedExpenses from './SharedExpenses';
import { formatCurrency } from '../utils/currencyUtils';

const Dashboard: React.FC = () => {
  const [openTasks, setOpenTasks] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const { currentUser } = useAuth();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { balances } = useBalances();
  const { currency, convertAmount } = useCurrency();
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      const tasks = JSON.parse(storedTasks);
      const userOpenTasks = tasks.filter((task: any) => 
        task.status === 'not_completed' && task.assignee === currentUser?.email
      ).length;
      setOpenTasks(userOpenTasks);
      setShowNotification(userOpenTasks > 0);
    }
  }, [currentUser]);

  useEffect(() => {
    // Prevent automatic scrolling
    if (dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [expenses, incomes]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + convertAmount(expense.amount, expense.currency), 0);
  const totalIncome = incomes.reduce((sum, income) => sum + convertAmount(income.salePrice * income.quantity, income.currency), 0);
  const totalAdSpend = incomes.reduce((sum, income) => sum + convertAmount(income.adSpend, income.currency), 0);
  const totalCostPrice = incomes.reduce((sum, income) => sum + convertAmount(income.costPrice * income.quantity, income.currency), 0);
  const netProfit = totalIncome - totalExpenses - totalAdSpend - totalCostPrice;

  return (
    <div ref={dashboardRef} className="space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
      
      {showNotification && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md" role="alert">
          <div className="flex items-center">
            <Bell className="w-6 h-6 mr-2" />
            <p>You have {openTasks} open {openTasks === 1 ? 'task' : 'tasks'} that {openTasks === 1 ? 'needs' : 'need'} to be completed.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <DashboardCard
          to="/expenses"
          icon={<CreditCard className="w-8 h-8 text-red-500" />}
          title="Expense Tracker"
          description="Manage your expenses"
        />
        <DashboardCard
          to="/income"
          icon={<DollarSign className="w-8 h-8 text-green-500" />}
          title="Income Tracker"
          description="Track your income and profits"
        />
      </div>

      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OverviewCard title="Total Income" amount={totalIncome} color="green" />
          <OverviewCard title="Total Expenses" amount={totalExpenses} color="red" />
          <OverviewCard title="Net Profit" amount={netProfit} color={netProfit >= 0 ? "blue" : "red"} />
        </div>
      </div>

      <Link
        to="/report"
        className="card p-6 flex items-center hover:bg-gray-50 transition-colors duration-300"
      >
        <BarChart className="w-8 h-8 text-purple-500 mr-4" />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Financial Report</h2>
          <p className="text-gray-600">View detailed financial reports and analytics</p>
        </div>
      </Link>

      <SharedExpenses />
      
      <div className="card p-6">
        <TodoList />
      </div>
    </div>
  );
};

const DashboardCard: React.FC<{ to: string; icon: React.ReactNode; title: string; description: string }> = ({ to, icon, title, description }) => (
  <Link to={to} className="card p-6 flex items-center hover:bg-gray-50 transition-colors duration-300">
    <div className="mr-4">{icon}</div>
    <div>
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  </Link>
);

const OverviewCard: React.FC<{ title: string; amount: number; color: string }> = ({ title, amount, color }) => {
  const { currency } = useCurrency();
  return (
    <div className={`bg-${color}-100 p-4 rounded-lg`}>
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
      <p className={`text-2xl font-bold text-${color}-600`}>{formatCurrency(amount, currency)}</p>
    </div>
  );
};

export default Dashboard;