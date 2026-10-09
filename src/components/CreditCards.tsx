import { useState, useEffect } from 'react';
import { getCards, addCard, deleteCard } from '../store';

export default function CreditCards() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleDelete = async (id: string) => {
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
    </div>
  );
}
