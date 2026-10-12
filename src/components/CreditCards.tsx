import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { getCards, addCard, deleteCard } from '../store';

export default function CreditCards() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [last4, setLast4] = useState('');
  const [limit, setLimit] = useState('');

  useEffect(() => {
    getCards()
      .then((c) => {
        setCards(c);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Ошибка загрузки');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowForm(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!name || !bank || !last4 || !limit) return;
    try {
      const newCard = await addCard({
        name,
        bank,
        last4,
        limit: parseFloat(limit),
        color: '#6366f1',
        cardType: 'debit'
      });
      setCards(prev => [...prev, newCard]);
      setShowForm(false);
      setName('');
      setBank('');
      setLast4('');
      setLimit('');
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить карту?')) return;
    try {
      await deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Загрузка карт...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Ошибка: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Мои карты ({cards.length})</h2>

      {cards.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          Нет карт. Добавьте первую карту!
        </p>
      )}

      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-xl p-5 text-white shadow-lg"
          style={{ background: card.color || '#6366f1' }}
        >
          <p className="text-sm opacity-80">{card.bank}</p>
          <p className="font-bold text-lg">{card.name}</p>
          <p className="font-mono mt-3">**** {card.last4}</p>
          <p className="mt-2">{card.limit} руб</p>
          <button
            onClick={() => handleDelete(card.id)}
            className="mt-3 text-sm underline opacity-80"
          >
            Удалить
          </button>
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Новая карта</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Название" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={bank} onChange={e => setBank(e.target.value)} placeholder="Банк" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={last4} onChange={e => setLast4(e.target.value)} placeholder="Последние 4 цифры" maxLength={4} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <input value={limit} onChange={e => setLimit(e.target.value)} placeholder="Лимит" type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg">Добавить</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
