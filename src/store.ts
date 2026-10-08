import { supabase } from './lib/supabase';
import type { Transaction, CreditCard, Budget, PlanningGoal, ThemeMode } from './types';

// ===================== AUTH =====================

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {  { name } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

// ===================== CACHE HELPER =====================

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  cacheDurationMs: number = 60000
): Promise<T> {
  // Проверяем кэш
  const cached = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(cacheKey + '_time');
  
  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < cacheDurationMs) {
      return JSON.parse(cached);
    }
  }

  // Пытаемся загрузить с повторами
  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await fetchFn();
      // Сохраняем в кэш
      localStorage.setItem(cacheKey, JSON.stringify(result));
      localStorage.setItem(cacheKey + '_time', Date.now().toString());
      return result;
    } catch (err) {
      lastError = err;
      // Если есть кэш — возвращаем его
      if (cached) {
        console.log('Using cached data, refreshing in background...');
        return JSON.parse(cached);
      }
      // Ждём перед повтором
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

// ===================== TRANSACTIONS =====================

export async function getTransactions(): Promise<Transaction[]> {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTransaction);
  }, 'cache_transactions', 60000);
}

export async function addTransaction(t: Omit<Transaction, 'id'>): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      card_id: t.cardId || null,
    })
    .select()
    .single();
  if (error) throw error;
  
  // Очищаем кэш
  localStorage.removeItem('cache_transactions');
  
  return mapTransaction(data);
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
  
  // Очищаем кэш
  localStorage.removeItem('cache_transactions');
}

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    category: row.category,
    description: row.description,
    date: row.date,
    cardId: row.card_id,
  };
}

// ===================== CREDIT CARDS =====================

export async function getCards(): Promise<CreditCard[]> {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapCard);
  }, 'cache_cards', 60000);
}

export async function addCard(c: Omit<CreditCard, 'id'>): Promise<CreditCard> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('credit_cards')
    .insert({
      user_id: user.id,
      name: c.name,
      bank: c.bank,
      last4: c.last4,
      card_limit: c.limit,
      color: c.color,
      card_type: c.cardType || 'debit',
    })
    .select()
    .single();
  if (error) throw error;
  
  // Очищаем кэш
  localStorage.removeItem('cache_cards');
  
  return mapCard(data);
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from('credit_cards').delete().eq('id', id);
  if (error) throw error;
  
  // Очищаем кэш
  localStorage.removeItem('cache_cards');
}

function mapCard(row: any): CreditCard {
  return {
    id: row.id,
    name: row.name,
    bank: row.bank,
    last4: row.last4,
    limit: row.card_limit,
    color: row.color,
    cardType: row.card_type || 'debit',
  };
}

// ===================== BUDGETS =====================

export async function getBudgets(): Promise<Budget[]> {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapBudget);
  }, 'cache_budgets', 60000);
}

export async function addBudget(b: Omit<Budget, 'id'>): Promise<Budget> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: user.id,
      category: b.category,
      card_limit: b.limit,
      month: b.month,
    })
    .select()
    .single();
  if (error) throw error;
  
  // Очищаем кэш
  localStorage.removeItem('cache_budgets');
  
  return mapBudget(data);
}

export async function deleteBudget(id: string) {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
  
  // Очищаем кэш
  localStorage.removeItem('cache_budgets');
}

function mapBudget(row: any): Budget {
  return {
    id: row.id,
    category: row.category,
    limit: row.card_limit,
    month: row.month,
  };
}

// ===================== GOALS =====================

export async function getGoals(): Promise<PlanningGoal[]> {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapGoal);
  }, 'cache_goals', 60000);
}

export async function addGoal(g: Omit<PlanningGoal, 'id'>): Promise<PlanningGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title: g.title,
      target_amount: g.targetAmount,
      current_amount: g.currentAmount,
      deadline: g.deadline,
      icon: g.icon,
    })
    .select()
    .single();
  if (error) throw error;
  
  // Очищаем кэш
  localStorage.removeItem('cache_goals');
  
  return mapGoal(data);
}

export async function updateGoal(id: string, updates: Partial<PlanningGoal>) {
  const dbUpdates: any = {};
  if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
  
  const { error } = await supabase.from('goals').update(dbUpdates).eq('id', id);
  if (error) throw error;
  
  // Очищаем кэш
  localStorage.removeItem('cache_goals');
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
  
  // Очищаем кэш
  localStorage.removeItem('cache_goals');
}

function mapGoal(row: any): PlanningGoal {
  return {
    id: row.id,
    title: row.title,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    deadline: row.deadline,
    icon: row.icon,
  };
}

// ===================== THEME (local only) =====================

export function getTheme(): ThemeMode {
  return (localStorage.getItem('ft_theme') as ThemeMode) || 'light';
}

export function saveTheme(t: ThemeMode) {
  localStorage.setItem('ft_theme', t);
}
