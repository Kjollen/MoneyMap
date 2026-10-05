import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { getTransactions } from '../store';
import { Transaction, CATEGORY_ICONS } from '../types';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Analytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(6);

  useEffect(() => {
    getTransactions().then(t => { setTransactions(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(new Date(), period - 1), end: new Date() });
    return months.map(m => {
      const monthStart = startOfMonth(m);
      const monthEnd = endOfMonth(m);
      const monthTx = transactions.filter(t => { const d = parseISO(t.date); return d >= monthStart && d <= monthEnd; });
      const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { month: format(m, 'MMM', { locale: ru }), income, expense, savings: income - expense };
    });
  }, [transactions, period]);

  const categoryBreakdown = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthTx = transactions.filter(t => { const d = parseISO(t.date); return d >= monthStart && d <= monthEnd && t.type === 'expense'; });
    const map = new Map<string, number>();
    monthTx.forEach(t => map.set(t.category, (map.get(t.category) || 0) + t.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === 'expense').forEach(t => { map.set(t.category, (map.get(t.category) || 0) + t.amount); });
    return Array.from(map.entries()).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [transactions]);

  const savingsTrend = monthlyData.map(d => ({ month: d.month, savings: d.savings }));
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
  const totalIncomeAll = monthlyData.reduce((s, d) => s + d.income, 0);
  const totalExpenseAll = monthlyData.reduce((s, d) => s + d.expense, 0);
  const avgMonthlyExpense = monthlyData.length > 0 ? totalExpenseAll / monthlyData.length : 0;

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Загрузка...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Период:</span>
        {[3, 6, 12].map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${period === p ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>{p} мес.</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Общие доходы</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalIncomeAll.toLocaleString('ru')} ₽</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Общие расходы</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalExpenseAll.toLocaleString('ru')} ₽</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Средние расходы/мес</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(avgMonthlyExpense).toLocaleString('ru')} ₽</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Доходы vs Расходы по месяцам</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={v => `${(v / 1000).toFixed(0)}к`} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} formatter={(value: number) => [`${value.toLocaleString('ru')} ₽`]} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Доходы" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" name="Расходы" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Тренд накоплений</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={savingsTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={v => `${(v / 1000).toFixed(0)}к`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} formatter={(value: number) => [`${value.toLocaleString('ru')} ₽`, 'Накопления']} />
              <Line type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Расходы по категориям</h3>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('ru')} ₽`]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">Нет данных</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Топ категорий расходов</h3>
        <div className="space-y-3">
          {topCategories.map((item, i) => {
            const max = topCategories[0]?.total || 1;
            const percent = (item.total / max) * 100;
            return (
              <div key={item.category} className="flex items-center gap-3">
                <span className="text-lg w-8">{CATEGORY_ICONS[item.category] || '📦'}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{item.total.toLocaleString('ru')} ₽</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
