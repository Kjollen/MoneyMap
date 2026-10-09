import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trash2, Search, X } from 'lucide-react';
import { getTransactions, getCards, addTransaction, deleteTransaction } from '../store';
import { Transaction, TransactionType, INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_ICONS, CreditCard } from '../types';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formCardId, setFormCardId] = useState('');

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowForm(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [tx, c] = await Promise.all([getTransactions(), getCards()]);
      setTransactions(tx);
      setCards(c);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => !filterCategory || t.category === filterCategory)
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || !formCategory) return;
    try {
      const newTx = await addTransaction({
        type: formType,
        amount: parseFloat(formAmount),
        category: formCategory,
        description: formDescription || formCategory,
        date: formDate,
        cardId: formCardId || undefined,
      });
      setTransactions(prev => [newTx, ...prev]);
      setShowForm(false);
      setFormAmount(''); setFormCategory(''); setFormDescription('');
      setFormDate(format(new Date(), 'yyyy-MM-dd')); setFormCardId('');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) { console.error(err); }
  };

  const categories = formType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const allCategories = [...new Set(transactions.map(t => t.category))];
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Загрузка...</p></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Всего операций</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{filtered.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Доходы</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{totalIncome.toLocaleString('ru')} ₽</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Расходы</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{totalExpense.toLocaleString('ru')} ₽</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Новая операция</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <button type="button" onClick={() => { setFormType('expense'); setFormCategory(''); }} className={`flex-1 py-2.5 text-sm font-medium transition ${formType === 'expense' ? 'bg-red-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Расход</button>
                <button type="button" onClick={() => { setFormType('income'); setFormCategory(''); }} className={`flex-1 py-2.5 text-sm font-medium transition ${formType === 'income' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Доход</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Сумма (₽)</label>
                <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-semibold" placeholder="0" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button key={cat} type="button" onClick={() => setFormCategory(cat)} className={`px-3 py-2 rounded-lg text-xs font-medium transition border ${formCategory === cat ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Необязательно" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Кредитная карта</label>
  <select value={formCardId} onChange={e => setFormCardId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
    <option value="">Общий остаток</option>
    {cards.filter(c => c.cardType === 'credit').map(c => <option key={c.id} value={c.id}>{c.name} (•••• {c.last4})</option>)}
  </select>
</div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
          </div>
          <div className="flex gap-2">
            <select value={filterType} onChange={e => setFilterType(e.target.value as 'all' | TransactionType)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
              <option value="all">Все типы</option>
              <option value="income">Доходы</option>
              <option value="expense">Расходы</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
              <option value="">Все категории</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center"><p className="text-gray-500 dark:text-gray-400">Операции не найдены</p></div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {CATEGORY_ICONS[t.category] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.category} · {format(parseISO(t.date), 'dd MMMM yyyy', { locale: ru })}</p>
                </div>
                <span className={`text-sm font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('ru')} ₽
                </span>
                <button onClick={() => handleDelete(t.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
