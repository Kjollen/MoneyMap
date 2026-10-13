import { account, databases, DATABASE_ID, COLLECTIONS } from './lib/appwrite';
import { Query } from 'appwrite';
import type { Transaction, CreditCard, Budget, PlanningGoal, ThemeMode, Loan } from './types';

// ===================== AUTH =====================

export async function signUp(email: string, password: string, name: string) {
  const user = await account.create(email, password, name);
  await account.createEmailPasswordSession(email, password);
  return user;
}

export async function signIn(email: string, password: string) {
  await account.createEmailPasswordSession(email, password);
  return await account.get();
}

export async function signOut() {
  await account.deleteSession('current');
}

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback: (user: any) => void) {
  getCurrentUser().then(callback);
  return () => {};
}

// ===================== CACHE HELPER =====================

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  cacheDurationMs: number = 300000
): Promise<T> {
  const cached = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(cacheKey + '_time');
  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < cacheDurationMs) {
      return JSON.parse(cached);
    }
  }
  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await fetchFn();
      localStorage.setItem(cacheKey, JSON.stringify(result));
      localStorage.setItem(cacheKey + '_time', Date.now().toString());
      return result;
    } catch (err) {
      lastError = err;
      if (cached) {
        return JSON.parse(cached);
      }
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function getUid(): Promise<string> {
  const user = await account.get();
  if (!user) throw new Error('Not authenticated');
  return user.$id;
}

// ===================== TRANSACTIONS =====================

export async function getTransactions(): Promise<Transaction[]> {
  return fetchWithRetry(async () => {
    const uid = await getUid();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.transactions,
      [Query.equal('userId', uid), Query.orderDesc('date')]
    );
    return response.documents.map(mapTransaction);
  }, 'cache_transactions', 300000);
}

export async function addTransaction(t: Omit<Transaction, 'id'>): Promise<Transaction> {
  const uid = await getUid();
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.transactions,
    'unique()',
    {
      userId: uid,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      cardId: t.cardId || null
    }
  );
  localStorage.removeItem('cache_transactions');
  return mapTransaction(doc);
}

export async function deleteTransaction(id: string) {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.transactions, id);
  localStorage.removeItem('cache_transactions');
}

function mapTransaction(doc: any): Transaction {
  return {
    id: doc.$id,
    type: doc.type,
    amount: doc.amount,
    category: doc.category,
    description: doc.description,
    date: doc.date,
    cardId: doc.cardId || undefined
  };
}

// ===================== CREDIT CARDS =====================

export async function getCards(): Promise<CreditCard[]> {
  return fetchWithRetry(async () => {
    const uid = await getUid();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.credit_cards,
      [Query.equal('userId', uid)]
    );
    return response.documents.map(mapCard);
  }, 'cache_cards', 300000);
}

export async function addCard(c: Omit<CreditCard, 'id'>): Promise<CreditCard> {
  const uid = await getUid();
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.credit_cards,
    'unique()',
    {
      userId: uid,
      name: c.name,
      bank: c.bank,
      last4: c.last4,
      card_limit: c.limit,
      color: c.color,
      card_type: c.cardType || 'debit'
    }
  );
  localStorage.removeItem('cache_cards');
  return mapCard(doc);
}

export async function deleteCard(id: string) {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.credit_cards, id);
  localStorage.removeItem('cache_cards');
}

function mapCard(doc: any): CreditCard {
  return {
    id: doc.$id,
    name: doc.name,
    bank: doc.bank,
    last4: doc.last4,
    limit: doc.card_limit,
    color: doc.color,
    cardType: doc.card_type || 'debit'
  };
}

// ===================== BUDGETS =====================

export async function getBudgets(): Promise<Budget[]> {
  return fetchWithRetry(async () => {
    const uid = await getUid();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.budgets,
      [Query.equal('userId', uid)]
    );
    return response.documents.map(mapBudget);
  }, 'cache_budgets', 300000);
}

export async function addBudget(b: Omit<Budget, 'id'>): Promise<Budget> {
  const uid = await getUid();
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.budgets,
    'unique()',
    {
      userId: uid,
      category: b.category,
      card_limit: b.limit,
      month: b.month
    }
  );
  localStorage.removeItem('cache_budgets');
  return mapBudget(doc);
}

export async function deleteBudget(id: string) {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.budgets, id);
  localStorage.removeItem('cache_budgets');
}

function mapBudget(doc: any): Budget {
  return {
    id: doc.$id,
    category: doc.category,
    limit: doc.card_limit,
    month: doc.month
  };
}

// ===================== GOALS =====================

export async function getGoals(): Promise<PlanningGoal[]> {
  return fetchWithRetry(async () => {
    const uid = await getUid();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.goals,
      [Query.equal('userId', uid)]
    );
    return response.documents.map(mapGoal);
  }, 'cache_goals', 300000);
}

export async function addGoal(g: Omit<PlanningGoal, 'id'>): Promise<PlanningGoal> {
  const uid = await getUid();
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.goals,
    'unique()',
    {
      userId: uid,
      title: g.title,
      target_amount: g.targetAmount,
      current_amount: g.currentAmount,
      deadline: g.deadline,
      icon: g.icon
    }
  );
  localStorage.removeItem('cache_goals');
  return mapGoal(doc);
}

export async function updateGoal(id: string, updates: Partial<PlanningGoal>) {
  const dbUpdates: any = {};
  if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.goals, id, dbUpdates);
  localStorage.removeItem('cache_goals');
}

export async function deleteGoal(id: string) {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.goals, id);
  localStorage.removeItem('cache_goals');
}

function mapGoal(doc: any): PlanningGoal {
  return {
    id: doc.$id,
    title: doc.title,
    targetAmount: doc.target_amount,
    currentAmount: doc.current_amount,
    deadline: doc.deadline,
    icon: doc.icon
  };
}

// ===================== LOANS =====================

export async function getLoans(): Promise<Loan[]> {
  return fetchWithRetry(async () => {
    const uid = await getUid();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.loans,
      [Query.equal('userId', uid)]
    );
    return response.documents.map(mapLoan);
  }, 'cache_loans', 300000);
}

export async function addLoan(loan: Omit<Loan, 'id'>): Promise<Loan> {
  const uid = await getUid();
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.loans,
    'unique()',
    {
      userId: uid,
      name: loan.name,
      bank: loan.bank,
      total_amount: loan.totalAmount,
      remaining_amount: loan.remainingAmount,
      monthly_payment: loan.monthlyPayment,
      interest_rate: loan.interestRate,
      payment_day: loan.paymentDay,
      next_payment_date: loan.nextPaymentDate,
      end_date: loan.endDate || '',
      color: loan.color
    }
  );
  localStorage.removeItem('cache_loans');
  return mapLoan(doc);
}

export async function updateLoan(id: string, updates: Partial<Loan>) {
  const dbUpdates: any = {};
  if (updates.remainingAmount !== undefined) dbUpdates.remaining_amount = updates.remainingAmount;
  if (updates.nextPaymentDate !== undefined) dbUpdates.next_payment_date = updates.nextPaymentDate;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.loans, id, dbUpdates);
  localStorage.removeItem('cache_loans');
}

export async function deleteLoan(id: string) {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.loans, id);
  localStorage.removeItem('cache_loans');
}

function mapLoan(doc: any): Loan {
  return {
    id: doc.$id,
    name: doc.name,
    bank: doc.bank,
    totalAmount: doc.total_amount,
    remainingAmount: doc.remaining_amount,
    monthlyPayment: doc.monthly_payment,
    interestRate: doc.interest_rate,
    paymentDay: doc.payment_day,
    nextPaymentDate: doc.next_payment_date,
    endDate: doc.end_date || '',
    color: doc.color
  };
}

// ===================== THEME =====================

export function getTheme(): ThemeMode {
  return (localStorage.getItem('ft_theme') as ThemeMode) || 'light';
}

export function saveTheme(t: ThemeMode) {
  localStorage.setItem('ft_theme', t);
}
