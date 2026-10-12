import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLoans, addLoan, updateLoan, deleteLoan } from '../store';

export default function Loans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [paymentDay, setPaymentDay] = useState('15');

  useEffect(() => {
    getLoans().then(l => {
      setLoans(l);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowForm(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!name || !bank || !totalAmount || !monthlyPayment || !paymentDay) return;
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = parseInt(paymentDay);
    let nextDate = new Date(year, month, day);
    if (nextDate <= today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    try {
      const newLoan = await addLoan({
        name,
        bank,
        totalAmount: parseFloat(totalAmount),
        remainingAmount: parseFloat(remainingAmount) || parseFloat(totalAmount),
        monthlyPayment: parseFloat(monthlyPayment),
        interestRate: parseFloat(interestRate) || 0,
        paymentDay: parseInt(paymentDay),
        nextPaymentDate: nextDate.toISOString().split('T')[0],
        endDate: '',
        color: '#ef4444'
      });
      setLoans(prev => [...prev, newLoan]);
      setShowForm(false);
      resetForm();
    } catch (err) {
      alert('Ошибка: ' + err);
    }
  };

  const handlePayment = async (loan: any) => {
    if (!confirm('Подтвердить платёж?')) return;
    
    const newRemaining = Math.max(0, loan.remainingAmount - loan.monthlyPayment);
    const nextDate = new Date(loan.nextPaymentDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    
    await updateLoan(loan.id, {
      remainingAmount: newRemaining,
      nextPaymentDate: nextDate.toISOString().split('T')[0]
    });
    
    setLoans(prev => prev.map(l => 
      l.id === loan.id 
        ? { ...l, remainingAmount: newRemaining, nextPaymentDate: nextDate.toISOString().split('T')[0] }
        : l
    ));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить кредит?')) return;
    await deleteLoan(id);
    setLoans(prev => prev.filter(l => l.id !== id));
  };

  const resetForm = () => {
    setName('');
    setBank('');
    setTotalAmount('');
    setRemainingAmount('');
    setMonthlyPayment('');
    setInterestRate('');
    setPaymentDay('15');
  };

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;

  const totalRemaining = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalMonthly = loans.reduce((sum, l) => sum + l.monthlyPayment, 0);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Кредиты</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Учёт кредитов и займов</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Общий остаток долга</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalRemaining.toLocaleString('ru')} руб</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ежемесячные платежи</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalMonthly.toLocaleString('ru')} руб</p>
        </div>
      </div>

      {loans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Нет кредитов</p>
          <p className="text-gray-400 text-sm mt-2">Добавьте кредит для учёта</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map(loan => {
            const progress = loan.totalAmount > 0 
              ? ((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100 
              : 0;
            const isPaid = loan.remainingAmount <= 0;
            const daysLeft = Math.ceil((new Date(loan.nextPaymentDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysLeft < 0;

            return (
              <div key={loan.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{loan.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{loan.bank}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(loan.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Остаток долга</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{loan.remainingAmount.toLocaleString('ru')} руб</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Платёж/мес</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{loan.monthlyPayment.toLocaleString('ru')} руб</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ставка</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">День платежа</p>
                    <p className={'text-lg font-bold ' + (isOverdue ? 'text-red-600' : 'text-gray-900 dark:text-white')}>
                      {loan.paymentDay} число
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Погашено</span>
                    <span className="text-gray-500 dark:text-gray-400">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: Math.min(progress, 100) + '%' }}
                    />
                  </div>
                </div>

                {!isPaid && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Следующий платёж</p>
                      <p className={'text-sm font-medium ' + (isOverdue ? 'text-red-600' : 'text-gray-900 dark:text-white')}>
                        {isOverdue ? 'Просрочен!' : daysLeft + ' дн.'}
                      </p>
                    </div>
                    <button 
                      onClick={() => handlePayment(loan)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Оплачено
                    </button>
                  </div>
                )}

                {isPaid && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Кредит погашен!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Новый кредит</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Название" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={bank} onChange={e => setBank(e.target.value)} placeholder="Банк" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Сумма кредита" type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={remainingAmount} onChange={e => setRemainingAmount(e.target.value)} placeholder="Остаток долга (если не весь)" type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              <input value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} placeholder="Ежемесячный платёж" type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="Ставка %" type="number" step="0.1" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              <input value={paymentDay} onChange={e => setPaymentDay(e.target.value)} placeholder="День платежа (1-28)" type="number" min="1" max="28" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <button type="submit" className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                Добавить
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
