import { useState, useEffect } from 'react';
import { getLoans, addLoan, updateLoan, deleteLoan } from '../store';

export default function Loans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [total, setTotal] = useState('');
  const [remaining, setRemaining] = useState('');
  const [payment, setPayment] = useState('');
  const [rate, setRate] = useState('');
  const [day, setDay] = useState('15');

  useEffect(() => {
    getLoans().then(l => { setLoans(l); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!name || !bank || !total || !payment || !day) return;
    const today = new Date();
    const d = parseInt(day);
    let next = new Date(today.getFullYear(), today.getMonth(), d);
    if (next <= today) next.setMonth(next.getMonth() + 1);
    try {
      const loan = await addLoan({
        name, bank,
        totalAmount: parseFloat(total),
        remainingAmount: parseFloat(remaining) || parseFloat(total),
        monthlyPayment: parseFloat(payment),
        interestRate: parseFloat(rate) || 0,
        paymentDay: d,
        nextPaymentDate: next.toISOString().split('T')[0],
        endDate: '', color: '#ef4444'
      });
      setLoans(p => [...p, loan]);
      setShowForm(false);
      setName(''); setBank(''); setTotal('');
      setRemaining(''); setPayment(''); setRate(''); setDay('15');
    } catch (err) { alert('Ошибка: ' + err); }
  };

  const pay = async (loan: any) => {
    const nr = Math.max(0, loan.remainingAmount - loan.monthlyPayment);
    const nd = new Date(loan.nextPaymentDate);
    nd.setMonth(nd.getMonth() + 1);
    const ds = nd.toISOString().split('T')[0];
    await updateLoan(loan.id, { remainingAmount: nr, nextPaymentDate: ds });
    setLoans(p => p.map(l => l.id === loan.id
      ? { ...l, remainingAmount: nr, nextPaymentDate: ds } : l));
  };

  const del = async (id: string) => {
    if (!confirm('Удалить?')) return;
    await deleteLoan(id);
    setLoans(p => p.filter(l => l.id !== id));
  };

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;

  const totalDebt = loans.reduce((s, l) => s + l.remainingAmount, 0);
  const totalPay = loans.reduce((s, l) => s + l.monthlyPayment, 0);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Кредиты</h2>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg">
          + Добавить
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500">Остаток долга</p>
          <p className="text-xl font-bold text-red-600">{totalDebt.toLocaleString('ru')} руб</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500">Платёж/мес</p>
          <p className="text-xl font-bold text-orange-600">{totalPay.toLocaleString('ru')} руб</p>
        </div>
      </div>

      {loans.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Нет кредитов</p>
      ) : (
        <div className="space-y-4">
          {loans.map(l => {
            const paid = l.remainingAmount <= 0;
            const pct = l.totalAmount > 0
              ? ((l.totalAmount - l.remainingAmount) / l.totalAmount) * 100 : 0;
            const days = Math.ceil(
              (new Date(l.nextPaymentDate).getTime() - Date.now())
              / 86400000
            );
            const overdue = days < 0;

            return (
              <div key={l.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{l.name}</h3>
                    <p className="text-sm text-gray-500">{l.bank} | {l.interestRate}%</p>
                  </div>
                  <button onClick={() => del(l.id)} className="text-red-500 text-sm">Удалить</button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Остаток</p>
                    <p className="font-bold">{l.remainingAmount.toLocaleString('ru')} руб</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Платёж</p>
                    <p className="font-bold">{l.monthlyPayment.toLocaleString('ru')} руб</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Дата платежа</p>
                    <p className={'font-bold ' + (overdue ? 'text-red-600' : '')}>
                      {overdue ? 'Просрочен!' : l.nextPaymentDate}
                    </p>
                  </div>
                </div>

                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
                  <div className="h-full bg-green-500 rounded-full"
                    style={{ width: Math.min(pct, 100) + '%' }} />
                </div>

                {!paid ? (
                  <button onClick={() => pay(l)}
                    className="w-full py-2 bg-green-600 text-white rounded-lg text-sm">
                    Оплачено ({l.monthlyPayment.toLocaleString('ru')} руб)
                  </button>
                ) : (
                  <p className="text-center text-green-600 text-sm font-medium">Погашен</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Новый кредит</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Название" className="w-full p-2 border rounded-lg dark:bg-gray-700" required />
              <input value={bank} onChange={e => setBank(e.target.value)}
                placeholder="Банк" className="w-full p-2 border rounded-lg dark:bg-gray-700" required />
              <input value={total} onChange={e => setTotal(e.target.value)}
                placeholder="Сумма кредита" type="number"
                className="w-full p-2 border rounded-lg dark:bg-gray-700" required />
              <input value={remaining} onChange={e => setRemaining(e.target.value)}
                placeholder="Остаток (если не весь)" type="number"
                className="w-full p-2 border rounded-lg dark:bg-gray-700" />
              <input value={payment} onChange={e => setPayment(e.target.value)}
                placeholder="Ежемесячный платёж" type="number"
                className="w-full p-2 border rounded-lg dark:bg-gray-700" required />
              <input value={rate} onChange={e => setRate(e.target.value)}
                placeholder="Ставка %" type="number" step="0.1"
                className="w-full p-2 border rounded-lg dark:bg-gray-700" />
              <input value={day} onChange={e => setDay(e.target.value)}
                placeholder="День платежа (1-28)" type="number" min="1" max="28"
                className="w-full p-2 border rounded-lg dark:bg-gray-700" required />
              <button type="submit"
                className="w-full py-2 bg-red-600 text-white rounded-lg">
                Добавить
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
