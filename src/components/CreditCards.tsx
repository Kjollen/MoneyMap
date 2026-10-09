import { useState, useEffect } from 'react';
import { getCards, addCard, deleteCard } from '../store';

export default function CreditCards() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [last4, setLast4] = useState('');
  const [limit, setLimit] = useState('');

  useEffect(() => {
    getCards().then(c => {
      setCards(c.filter(card => card.cardType === 'credit'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!name || !bank || !last4 || !limit) return;
    try {
      const newCard = await addCard({
        name, bank, last4,
        limit: parseFloat(limit),
        color: '#ef4444',
        cardType: 'credit'
      });
      setCards(prev => [...prev, newCard]);
      setShowForm(false);
      setName(''); setBank(''); setLast4(''); setLimit('');
    } catch (err) {
      alert('Ошибка: ' + err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить карту?')) return;
    await deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Кредитные карты</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Карты которые нужно погашать</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          + Добавить
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Нет кредитных карт</p>
          <p className="text-gray-400 text-sm mt-2">Добавьте кредитную карту для учёта долгов</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(card => (
            <div key={card.id} className="rounded-xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm opacity-80">{card.bank}</p>
                  <p className="font-bold text-xl mt-1">{card.name}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-white/20 rounded-full">Кредитная</span>
              </div>
              <p className="font-mono text-lg">**** {card.last4}</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-sm opacity-80">Лимит</p>
                <p className="text-2xl font-bold">{card.limit.toLocaleString('ru')} ₽</p>
              </div>
              <button onClick={() => handleDelete(card.id)} className="mt-4 text-sm underline opacity-80 hover:opacity-100">
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Новая кредитная карта</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Название" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={bank} onChange={e => setBank(e.target.value)} placeholder="Банк" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={last4} onChange={e => setLast4(e.target.value)} placeholder="Последние 4 цифры" maxLength={4} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={limit} onChange={e => setLimit(e.target.value)} placeholder="Кредитный лимит" type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
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
