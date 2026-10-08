import { useState, useEffect } from 'react';
import {
  Plus, Trash2, X, Check,
  AlertTriangle, Calendar
} from 'lucide-react';
import {
  getLoans, addLoan, updateLoan, deleteLoan
} from '../store';
import type { Loan } from '../types';
import {
  format, parseISO, addMonths,
  differenceInDays
} from 'date-fns';
import { ru } from 'date-fns/locale';

const LOAN_COLORS = [
  '#ef4444', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#10b981'
];

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formBank, setFormBank] = useState('');
  const [formTotal, setFormTotal] = useState('');
  const [formRemaining, setFormRemaining] = useState('');
  const [formPayment, setFormPayment] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formDay, setFormDay] = useState('15');
  const [formColor, setFormColor] = useState(LOAN_COLORS[0]);

  useEffect(() => {
    getLoans()
      .then(l => { setLoans(l); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBank || !formTotal || !formPayment) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = parseInt(formDay);
    let nextDate = new Date(year, month, day);
    if (nextDate <= today) {
      nextDate = addMonths(nextDate, 1);
    }

    try {
      const newLoan = await addLoan({
        name: formName,
        bank: formBank,
        totalAmount: parseFloat(formTotal),
        remainingAmount: parseFloat(formRemaining) || parseFloat(formTotal),
        monthlyPayment: parseFloat(formPayment),
        interestRate: parseFloat(formRate) || 0,
        paymentDay: parseInt(formDay),
        nextPaymentDate: format(nextDate, 'yyyy-MM-dd'),
        endDate: '',
        color: formColor,
      });
      setLoans(prev => [...prev, newLoan]);
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayment = async (loan: Loan) => {
    try {
      const newRemaining = Math.max(
        0,
        loan.remainingAmount - loan.monthlyPayment
      );
      const nextDate = addMonths(
        parseISO(loan.nextPaymentDate),
        1
      );
      await updateLoan(loan.id, {
        remainingAmount: newRemaining,
        nextPaymentDate: format(nextDate, 'yyyy-MM-dd'),
      });
      setLoans(prev =>
        prev.map(l =>
          l.id === loan.id
            ? {
                ...l,
                remainingAmount: newRemaining,
                nextPaymentDate: format(nextDate, 'yyyy-MM-dd'),
              }
            : l
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLoan(id);
      setLoans(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormBank('');
    setFormTotal('');
    setFormRemaining('');
    setFormPayment('');
    setFormRate('');
    setFormDay('15');
    setFormColor(LOAN_COLORS[0]);
  };

  const totalRemaining = loans.reduce(
    (s, l) => s + l.remainingAmount, 0
  );
  const totalMonthly = loans.reduce(
    (s, l) => s + l.monthlyPayment, 0
  );
  const upcomingPayments = loans.filter(l => {
    const days = differenceInDays(
      parseISO(l.nextPaymentDate),
      new Date()
    );
    return days <= 7 && days >= 0;
  });

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Всего кредитов
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {loans.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Общий остаток
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {totalRemaining.toLocaleString('ru')} ₽
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ежемесячно
          </p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {totalMonthly.toLocaleString('ru')} ₽
          </p>
        </div>
      </div>

      {/* Предупреждение о ближайших платежах */}
      {upcomingPayments.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-amber-700 dark:text-amber-400">
              Ближайшие платежи (7 дней)
            </span>
          </div>
          <div className="space-y-1">
            {upcomingPayments.map(l => (
              <p key={l.id} className="text-sm text-amber-700 dark:text-amber-400">
                {l.name} ({l.bank}): {l.monthlyPayment.toLocaleString('ru')} ₽ — {format(parseISO(l.nextPaymentDate), 'dd MMM', { locale: ru })}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Список кредитов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loans.map(loan => {
          const progress = loan.totalAmount > 0
            ? ((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100
            : 0;
          const isPaid = loan.remainingAmount <= 0;
          const daysLeft = differenceInDays(
            parseISO(loan.nextPaymentDate),
            new Date()
          );
          const isOverdue = daysLeft < 0;

          return (
            <div
              key={loan.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: loan.color }}
                  >
                    🏦
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {loan.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {loan.bank}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(loan.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Основная информация */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Остаток
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {loan.remainingAmount.toLocaleString('ru')} ₽
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Платёж/мес
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {loan.monthlyPayment.toLocaleString('ru')} ₽
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ставка
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {loan.interestRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Дата платежа
                  </p>
                  <p className={
                    isOverdue
                      ? 'font-semibold text-red-600 dark:text-red-400'
                      : daysLeft <= 7
                        ? 'font-semibold text-amber-600 dark:text-amber-400'
                        : 'font-semibold text-gray-900 dark:text-white'
                  }>
                    {loan.paymentDay} число
                  </p>
                </div>
              </div>

              {/* Прогресс */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">
                    Погашено
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: isPaid ? '#10b981' : loan.color
                    }}
                  />
                </div>
              </div>

              {/* Следующий платёж */}
              {!isPaid && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Следующий платёж
                      </p>
                      <p className={
                        isOverdue
                          ? 'text-sm font-medium text-red-600 dark:text-red-400'
                          : 'text-sm font-medium text-gray-900 dark:text-white'
                      }>
                        {isOverdue
                          ? 'Просрочен!'
                          : format(parseISO(loan.nextPaymentDate), 'dd MMMM', { locale: ru })
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePayment(loan)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition"
                  >
                    <Check size={14} />
                    Оплачено
                  </button>
                </div>
              )}

              {isPaid && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✅ Кредит погашен!
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Кнопка добавления */}
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 min-h-[300px] flex flex-col items-center justify-center gap-3 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition group"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition">
            <Plus size={24} className="text-gray-400 group-hover:text-indigo-500 transition" />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
            Добавить кредит
          </span>
        </button>
      </div>

      {/* Форма добавления */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Новый кредит
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Потребительский кредит"
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
                    Сумма кредита (₽)
                  </label>
                  <input
                    type="number"
                    value={formTotal}
                    onChange={e => setFormTotal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="500000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Остаток (₽)
                  </label>
                  <input
                    type="number"
                    value={formRemaining}
                    onChange={e => setFormRemaining(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="500000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ежемесячный платёж (₽)
                  </label>
                  <input
                    type="number"
                    value={formPayment}
                    onChange={e => setFormPayment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="15000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ставка (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formRate}
                    onChange={e => setFormRate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="12.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  День платежа (1-28)
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formDay}
                  onChange={e => setFormDay(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Цвет
                </label>
                <div className="flex gap-2 flex-wrap">
                  {LOAN_COLORS.map(color => (
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
                Добавить кредит
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
