import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { getBudgets, getTransactions, addBudget, deleteBudget } from '../store';
import { EXPENSE_CATEGORIES, CATEGORY_ICONS } from '../types';
import type { Budget as BudgetType, Transaction } from '../types';
import { format, parseISO } from 'date-fns';

export default function Budget() {
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    Promise.all([getBudgets(), getTransactions()]).then(([b, t]) => {
      setBudgets(b); setTransactions(t); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const currentBudgets = budgets.filter(b => b.month === ym);

  const spending = currentBudgets.map(b => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === b.category)
      .filter(t => { const d = parseISO(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, t) => s + t.amount, 0);
    const percent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    return { ...b, spent, percent };
  });

  const totalBudget = currentBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = spending.reduce((s, b) => s + b.spent, 0);
  const overBudget = spending.filter(b => b.percent > 100);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory || !formLimit) return;
    try {
      const existing = currentBudgets.find(b => b.category === formCategory);
      if (existing) {
        await deleteBudget(existing.id);
      }
      const newBudget = await addBudget({ category: formCategory, limit: parseFloat(formLimit), month: ym });
      setBudgets(prev => [...prev.filter(b => b.id !== existing?.id), newBudget]);
      setShowForm(false); setFormCategory(''); setFormLimit('');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (err) { console.error(err); }
  };

  const availableCategories = EXPENSE_CATEGORIES.filter(c => !currentBudgets.find(b => b.category === c));

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Загрузка...</p></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Бюджет на месяц</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBudget.toLocaleString('ru')} ₽</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Потрачено</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalSpent.toLocaleString('ru')} ₽</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${totalBudget > 0 && (totalSpent / totalBudget) > 0.9 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Остаток</p>
          <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{(totalBudget - totalSpent).toLocaleString('ru')} ₽</p>
        </div>
      </div>

      {overBudget.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={18} className="text-red-600 dark:text-red-400" /><span className="font-medium text-red-700 dark:text-red-400">Превышен бюджет</span></div>
          <div className="space-y-1">{overBudget.map(b => <p key={b.id} className="text-sm text-red-600 dark:text-red-400">{CATEGORY_ICONS[b.category]} {b.category}: {b.spent.toLocaleString('ru')} ₽ из {b.limit.toLocaleString('ru')} ₽</p>)}</div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Бюджет на {format(now, 'LLLL yyyy')}</h3>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"><Plus size={16} />Добавить</button>
        </div>
        {spending.length === 0 ? (
          <div className="text-center py-12"><p className="text-gray-500 dark:text-gray-400">Бюджет не задан</p></div>
        ) : (
          <div className="space-y-4">
            {spending.map(item => {
              const isOver = item.percent > 100;
              const isWarning = item.percent > 80 && !isOver;
              return (
                <div key={item.id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{CATEGORY_ICONS[item.category] || '📦'}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.category}</span>
                      {isOver ? <AlertTriangle size={14} className="text-red-500" /> : item.percent > 0 && <CheckCircle size={14} className="text-green-500" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${isOver ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>{item.spent.toLocaleString('ru')} / {item.limit.toLocaleString('ru')} ₽</span>
                      <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(item.percent, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{item.percent.toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Новый бюджет</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" required>
                  <option value="">Выберите категорию</option>
                  {availableCategories.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Лимит (₽)</label>
                <input type="number" value={formLimit} onChange={e => setFormLimit(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="10000" required />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition">Сохранить</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
