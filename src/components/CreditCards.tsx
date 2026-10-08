import { useState, useEffect } from 'react';
import {
  Plus, Trash2, X,
  CreditCard as CardIcon
} from 'lucide-react';
import {
  getCards, getTransactions,
  addCard, deleteCard
} from '../store';
import type {
  CreditCard as CreditCardType,
  Transaction
} from '../types';

const CARD_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
];

export default function CreditCards() {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<
    'all' | 'debit' | 'credit'
  >('all');
  const [formName, setFormName] = useState('');
  const [formBank, setFormBank] = useState('');
  const [formLast4, setFormLast4] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [formColor, setFormColor] = useState(CARD_COLORS[0]);
  const [formCardType, setFormCardType] = useState<
    'debit' | 'credit'
  >('debit');

  useEffect(() => {
    Promise.all([getCards(), getTransactions()])
      .then(([c, t]) => {
        setCards(c);
        setTransactions(t);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBank || !formLast4 || !formLimit) return;
    try {
      const newCard = await addCard({
        name: formName,
        bank: formBank,
        last4: formLast4,
        limit: parseFloat(formLimit),
        color: formColor,
        cardType: formCardType,
      });
      setCards(prev => [...prev, newCard]);
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCard(id);
      setCards(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormBank('');
    setFormLast4('');
    setFormLimit('');
    setFormColor(CARD_COLORS[0]);
    setFormCardType('debit');
  };

  const filtered = cards.filter(c =>
    filterType === 'all' || c.cardType === filterType
  );

  const cardSpending = filtered.map(card => {
    const spent = transactions
      .filter(t => t.cardId === card.id && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return { ...card, spent };
  });

  const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
  const totalSpent = cardSpending.reduce(
    (s, c) => s + c.spent, 0
  );
  const debitCount = cards.filter(
    c => c.cardType === 'debit'
  ).length;
  const creditCount = cards.filter(
    c => c.cardType === 'credit'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Дебетовые
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {debitCount}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Кредитные
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {creditCount}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Общий лимит
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalLimit.toLocaleString('ru')} ₽
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Потрачено
          </p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {totalSpent.toLocaleString('ru')} ₽
          </p>
        </div>
      </div>

      {/* Фильтр */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={
            filterType === 'all'
              ? 'px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white transition'
              : 'px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 transition'
          }
        >
          Все ({cards.length})
        </button>
        <button
          onClick={() => setFilterType('debit')}
          className={
            filterType === 'debit'
              ? 'px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white transition'
              : 'px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 transition'
          }
        >
          💳 Дебетовые ({debitCount})
        </button>
        <button
          onClick={() => setFilterType('credit')}
          className={
            filterType === 'credit'
              ? 'px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white transition'
              : 'px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 transition'
          }
        >
          🏦 Кредитные ({creditCount})
        </button>
      </div>

      {/* Карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardSpending.map(card => (
          <div key={card.id} className="relative group">
            <div
              className="rounded-2xl p-6 text-white shadow-lg min-h-[200px] flex flex-col justify-between"
              style={{
                background: `linear-gradient(135deg, ${card.color}, ${card.color}bb)`
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                      {card.cardType === 'credit'
                        ? '🏦 Кредитная'
                        : '💳 Дебетовая'}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">
                    {card.bank}
                  </p>
                  <p className="font-semibold text-lg">
                    {card.name}
                  </p>
                </div>
                <CardIcon size={28} className="opacity-60" />
              </div>
              <div className="mt-8">
                <p className="font-mono text-xl tracking-wider mb-3">
                  •••• •••• •••• {card.last4}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-70">
                      {card.cardType === 'credit' ? 'Лимит' : 'Баланс'}
                    </p>
                    <p className="font-semibold">
                      {card.limit.toLocaleString('ru')} ₽
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-70">
                      Потрачено
                    </p>
                    <p className="font-semibold">
                      {card.spent.toLocaleString('ru')} ₽
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/60 rounded-full transition-all"
                    style={{
                      width: `${Math.min((card.spent / card.limit) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(card.id)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          onClick={() => setShowForm(true)}
          className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 min-h-[200px] flex flex-col items-center justify-center gap-3 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition group"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition">
            <Plus size={24} className="text-gray-400 group-hover:text-indigo-500 transition" />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
            Добавить карту
          </span>
        </button>
      </div>

      {/* Форма */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Новая карта
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              {/* Тип карты */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тип карты
                </label>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFormCardType('debit')}
                    className={
                      formCardType === 'debit'
                        ? 'flex-1 py-2.5 text-sm font-medium bg-indigo-500 text-white transition'
                        : 'flex-1 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition'
                    }
                  >
                    💳 Дебетовая
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCardType('credit')}
                    className={
                      formCardType === 'credit'
                        ? 'flex-1 py-2.5 text-sm font-medium bg-indigo-500 text-white transition'
                        : 'flex-1 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition'
                    }
                  >
                    🏦 Кредитная
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Основная"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Банк
                </label>
                <input
                  type="text"
                  value={formBank}
                  onChange={e => setFormBank(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Сбербанк"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Последние 4 цифры
                  </label>
                  <input
                    type="text"
                    value={formLast4}
                    onChange={e => setFormLast4(e.target.value)}
                    maxLength={4}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="4276"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {formCardType === 'credit' ? 'Лимит (₽)' : 'Баланс (₽)'}
                  </label>
                  <input
                    type="number"
                    value={formLimit}
                    onChange={e => setFormLimit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="200000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Цвет карты
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CARD_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={
                        formColor === color
                          ? 'w-8 h-8 rounded-full scale-125 ring-2 ring-offset-2 ring-gray-400 transition-transform'
                          : 'w-8 h-8 rounded-full transition-transform'
                      }
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
              >
                Добавить карту
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
