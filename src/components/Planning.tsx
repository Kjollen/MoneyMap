import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Target } from 'lucide-react';
import { getGoals, addGoal, updateGoal, deleteGoal } from '../store';
import type { PlanningGoal } from '../types';
import { parseISO, differenceInDays } from 'date-fns';

const GOAL_ICONS = ['🏖️', '💻', '🛡️', '🏠', '🚗', '📱', '🎓', '💍', '✈️', '🎯', '💰', '🏋️'];

export default function Planning() {
  const [goals, setGoals] = useState<PlanningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formCurrent, setFormCurrent] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formIcon, setFormIcon] = useState('🎯');
  const [addAmount, setAddAmount] = useState<Record<string, string>>({});

  useEffect(() => {
    getGoals().then(g => { setGoals(g); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formTarget || !formDeadline) return;
    try {
      const newGoal = await addGoal({
        title: formTitle,
        targetAmount: parseFloat(formTarget),
        currentAmount: parseFloat(formCurrent) || 0,
        deadline: formDeadline,
        icon: formIcon,
      });
      setGoals(prev => [...prev, newGoal]);
      setShowForm(false);
      setFormTitle(''); setFormTarget(''); setFormCurrent(''); setFormDeadline(''); setFormIcon('🎯');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleAddFunds = async (id: string) => {
    const amount = parseFloat(addAmount[id] || '0');
    if (amount <= 0) return;
    try {
      const goal = goals.find(g => g.id === id);
      if (!goal) return;
      const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
      await updateGoal(id, { currentAmount: newAmount });
      setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: newAmount } : g));
      setAddAmount(prev => ({ ...prev, [id]: '' }));
    } catch (err) { console.error(err); }
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Загрузка...</p></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Всего целей</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
          <p className="text-xs text-gray-400 mt-1">{completedGoals} выполнено</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Накоплено</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalCurrent.toLocaleString('ru')} ₽</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Общая цель</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTarget.toLocaleString('ru')} ₽</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const isCompleted = percent >= 100;
          const daysLeft = differenceInDays(parseISO(goal.deadline), new Date());
          const remaining = goal.targetAmount - goal.currentAmount;

          return (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{goal.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isCompleted ? '✅ Выполнено!' : daysLeft > 0 ? `Осталось ${daysLeft} дн.` : '⚠️ Срок прошёл'}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(goal.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition"><Trash2 size={16} /></button>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-300">{goal.currentAmount.toLocaleString('ru')} ₽</span>
                  <span className="text-gray-500 dark:text-gray-400">{goal.targetAmount.toLocaleString('ru')} ₽</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{percent.toFixed(0)}%</p>
              </div>
              {!isCompleted && (
                <div className="flex gap-2">
                  <input type="number" value={addAmount[goal.id] || ''} onChange={e => setAddAmount(prev => ({ ...prev, [goal.id]: e.target.value }))} placeholder="Сумма" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <button onClick={() => handleAddFunds(goal.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition">+</button>
                </div>
              )}
              {!isCompleted && remaining > 0 && <p className="text-xs text-gray-400 mt-2">Осталось: {remaining.toLocaleString('ru')} ₽</p>}
            </div>
          );
        })}
        <button onClick={() => setShowForm(true)} className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 min-h-[220px] flex flex-col items-center justify-center gap-3 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition group">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition"><Target size={24} className="text-gray-400 group-hover:text-indigo-500 transition" /></div>
          <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">Новая цель</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Новая цель</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Отпуск в Турции" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Иконка</label>
                <div className="flex gap-2 flex-wrap">
                  {GOAL_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setFormIcon(icon)} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition ${formIcon === icon ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цель (₽)</label>
                  <input type="number" value={formTarget} onChange={e => setFormTarget(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="200000" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Уже есть (₽)</label>
                  <input type="number" value={formCurrent} onChange={e => setFormCurrent(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дедлайн</label>
                <input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition">Создать цель</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
