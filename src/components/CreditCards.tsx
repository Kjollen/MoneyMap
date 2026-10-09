import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { getCards, addCard, deleteCard } from '../store';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CreditCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [last4, setLast4] = useState('');
  const [limit, setLimit] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    getCards().then(c => {
      setCards(c);
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
        color,
        cardType: 'debit'
      });
      setCards((prev: any) => [...prev, newCard]);
      setShowForm(false);
      setName(''); setBank(''); setLast4(''); setLimit('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCard(id);
    setCards((prev: any) => prev.filter((c: any) => c.id !== id));
  };

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Мои карты</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">+ Добавить</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card: any) => (
          <div key={card.id} className="rounded-xl p-5 text-white" style={{ background: card.color }}>
            <p className="text-sm opacity-80">{card.bank}</p>
            <p className="font-bold text-lg">{card.name}</p>
            <p className="font-mono mt-4">**** {card.last4}</p>
            <p className="mt-2">{card.limit} руб</p>
            <button onClick={() => handleDelete(card.id)} className="mt-3 text-sm underline">Удалить</button>
          </div>
        ))}
      </div>

      {cards.length === 0 && <p className="text-gray-500 text-center py-8">Нет карт. Добавьте первую!</p>}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Новая карта</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Название" className="w-full p-2 border rounded" required />
              <input value={bank} onChange={e => setBank(e.target.value)} placeholder="Банк" className="w-full p-2 border rounded" required />
              <input value={last4} onChange={e => setLast4(e.target.value)} placeholder="Последние 4 цифры" maxLength={4} className="w-full p-2 border rounded" required />
              <input value={limit} onChange={e => setLimit(e.target.value)} placeholder="Лимит" type="number" className="w-full p-2 border rounded" required />
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded">Добавить</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
