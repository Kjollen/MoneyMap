export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  cardId?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  last4: string;
  limit: number;
  color: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string;
}

export interface PlanningGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
}

export type ThemeMode = 'light' | 'dark';

export const INCOME_CATEGORIES = [
  'Зарплата', 'Фриланс', 'Инвестиции', 'Подарки', 'Другое'
];

export const EXPENSE_CATEGORIES = [
  'Продукты', 'Транспорт', 'Жильё', 'Развлечения', 
  'Здоровье', 'Одежда', 'Рестораны', 'Подписки', 
  'Образование', 'Коммунальные', 'Другое'
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Зарплата': '💰', 'Фриланс': '💻', 'Инвестиции': '📈', 'Подарки': '🎁',
  'Продукты': '🛒', 'Транспорт': '🚗', 'Жильё': '🏠', 'Развлечения': '🎮',
  'Здоровье': '💊', 'Одежда': '👕', 'Рестораны': '🍽️', 'Подписки': '📱',
  'Образование': '📚', 'Коммунальные': '💡', 'Другое': '📦'
};
