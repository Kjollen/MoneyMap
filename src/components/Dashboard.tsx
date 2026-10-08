import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { getTransactions, getCards } from '../store';
import { Transaction, CreditCard, CATEGORY_ICONS } from '../types';
import { format, parseISO, startOfMonth, subMonths, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tx, c] = await Promise.all([
        getTransactions(), getCards()
      ]);
      setTransactions(tx);
      setCards(c);
    } catch (err) {
      console.error('Error loading data', err);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = parseISO(t.date);
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const totalIncome = thisMonth
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = thisMonth
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalBalance = cards.reduce((s, c) => s + c.limit, 0);

  const chartData = useMemo(() => {
    const start = startOfMonth(now);
    const end = now;
    const days = eachDayOfInterval({ start, end });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTx = transactions.filter(t => t.date === dayStr);
      const income = dayTx
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expense = dayTx
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return {
        date: format(day, 'dd.MM'),
        income,
        expense
      };
    });
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    thisMonth
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [thisMonth]);

  const COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
  ];
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const prevMonth = subMonths(now, 1);
  const prevTx = transactions.filter(t => {
    const d = parseISO(t.date);
    return (
      d.getMonth() === prevMonth.getMonth() &&
      d.getFullYear() === prevMonth.getFullYear()
    );
  });
  const prevExpense = prevTx
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const change = prevExpense > 0
    ? ((totalExpense - prevExpense) / prevExpense) * 100
    : 0;

 if (loading) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 dark:text-gray-400">Загрузка данных...</p>
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Баланс месяца"
          value={balance}
          icon={<Wallet size={20} />}
          color="indigo"
          change={change}
          changeLabel="vs прошлый мес."
        />
        <StatCard
          title="Доходы"
          value={totalIncome}
          icon={<TrendingUp size={20} />}
          color="green"
          prefix="+"
        />
        <StatCard
          title="Расходы"
          value={totalExpense}
          icon={<TrendingDown size={20} />}
          color="red"
          prefix="-"
        />
        <StatCard
          title="Лимиты карт"
          value={totalBalance}
          icon={<PiggyBank size={20} />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Движение средств — {format(now, 'LLLL', { locale: ru })}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                tickFormatter={v => `${(v / 1000).toFixed(0)}к`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white'
                }}
                formatter={(value: number) => [
                  `${value.toLocaleString('ru')} ₽`
                ]}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                fill="url(#cI)"
                strokeWidth={2}
                name="Доходы"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                fill="url(#cE)"
                strokeWidth={2}
                name="Расходы"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Расходы по категориям
          </h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toLocaleString('ru')} ₽`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryData.slice(0, 4).map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[i % COLORS.length]
                        }}
                      />
                      <span className="text-gray-600 dark:text-gray-300">
                        {CATEGORY_ICONS[item.name] || '📦'} {item.name}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.value.toLocaleString('ru')} ₽
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Нет расходов в этом месяце
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Последние операции
          </h3>
          <div className="space-y-3">
            {recent.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                  {CATEGORY_ICONS[t.category] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {t.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.category} · {format(parseISO(t.date), 'dd MMM', { locale: ru })}
                  </p>
                </div>
                <span className={
                  t.type === 'income'
                    ? 'text-sm font-semibold text-green-600 dark:text-green-400'
                    : 'text-sm font-semibold text-red-600 dark:text-red-400'
                }>
                  {t.type === 'income' ? '+' : '-'}
                  {t.amount.toLocaleString('ru')} ₽
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Мои карты
          </h3>
          <div className="space-y-3">
            {cards.map(card => (
              <div
                key={card.id}
                className="p-4 rounded-xl text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)`
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-sm opacity-80">{card.bank}</p>
                    <p className="font-semibold">{card.name}</p>
                  </div>
                  <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
                    <circle cx="14" cy="14" r="10" fill="rgba(255,255,255,0.3)" />
                    <circle cx="26" cy="14" r="10" fill="rgba(255,255,255,0.2)" />
                  </svg>
                </div>
                <div className="flex justify-between items-end">
                  <p className="font-mono text-lg tracking-wider">
                    •••• •••• •••• {card.last4}
                  </p>
                  <p className="text-sm opacity-80">
                    лимит {card.limit.toLocaleString('ru')} ₽
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, prefix = '', change, changeLabel }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  change?: number;
  changeLabel?: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {prefix}{value.toLocaleString('ru')} ₽
      </p>
      {change !== undefined && (
        <div className={
          change > 0
            ? 'flex items-center gap-1 mt-2 text-xs text-red-500'
            : 'flex items-center gap-1 mt-2 text-xs text-green-500'
        }>
          {change > 0
            ? <ArrowUpRight size={14} />
            : <ArrowDownRight size={14} />
          }
          <span>{Math.abs(change).toFixed(1)}%</span>
          <span className="text-gray-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
