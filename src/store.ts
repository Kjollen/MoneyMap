import { auth, db } from './lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import type { Transaction, CreditCard, Budget, PlanningGoal, ThemeMode, Loan } from './types';

// ===================== AUTH =====================

export async function signUp(email: string, password: string, name: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function getCurrentUser(): Promise<User | null> {
  return auth.currentUser;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
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

function getUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

// ===================== TRANSACTIONS =====================

export async function getTransactions(): Promise<Transaction[]> {
  return fetchWithRetry(async () => {
    const uid = getUid();
        const q = query(
      collection(db, 'transactions'),
      where('userId', '==', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      type: d.data().type,
      amount: d.data().amount,
      category: d.data().category,
      description: d.data().description,
      date: d.data().date,
      cardId: d.data().cardId || undefined,
    }));
  }, 'cache_transactions', 300000);
}

export async function addTransaction(t: Omit<Transaction, 'id'>): Promise<Transaction> {
  const uid = getUid();
  const docRef = await addDoc(collection(db, 'transactions'), {
    userId: uid,
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.date,
    cardId: t.cardId || null,
  });
  localStorage.removeItem('cache_transactions');
  return { id: docRef.id, ...t };
}

export async function deleteTransaction(id: string) {
  await deleteDoc(doc(db, 'transactions', id));
  localStorage.removeItem('cache_transactions');
}

// ===================== CREDIT CARDS =====================

export async function getCards(): Promise<CreditCard[]> {
  return fetchWithRetry(async () => {
    const uid = getUid();
    const q = query(
      collection(db, 'credit_cards'),
      where('userId', '==', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      name: d.data().name,
      bank: d.data().bank,
      last4: d.data().last4,
      limit: d.data().limit,
      color: d.data().color,
      cardType: d.data().cardType || 'debit',
    }));
  }, 'cache_cards', 300000);
}

export async function addCard(c: Omit<CreditCard, 'id'>): Promise<CreditCard> {
  const uid = getUid();
  const docRef = await addDoc(collection(db, 'credit_cards'), {
    userId: uid,
    name: c.name,
    bank: c.bank,
    last4: c.last4,
    limit: c.limit,
    color: c.color,
    cardType: c.cardType || 'debit',
    createdAt: Date.now(),
  });
  localStorage.removeItem('cache_cards');
  return { id: docRef.id, ...c };
}

export async function deleteCard(id: string) {
  await deleteDoc(doc(db, 'credit_cards', id));
  localStorage.removeItem('cache_cards');
}

// ===================== BUDGETS =====================

export async function getBudgets(): Promise<Budget[]> {
  return fetchWithRetry(async () => {
    const uid = getUid();
    const q = query(
      collection(db, 'budgets'),
      where('userId', '==', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      category: d.data().category,
      limit: d.data().limit,
      month: d.data().month,
    }));
  }, 'cache_budgets', 300000);
}

export async function addBudget(b: Omit<Budget, 'id'>): Promise<Budget> {
  const uid = getUid();
  const docRef = await addDoc(collection(db, 'budgets'), {
    userId: uid,
    category: b.category,
    limit: b.limit,
    month: b.month,
    createdAt: Date.now(),
  });
  localStorage.removeItem('cache_budgets');
  return { id: docRef.id, ...b };
}

export async function deleteBudget(id: string) {
  await deleteDoc(doc(db, 'budgets', id));
  localStorage.removeItem('cache_budgets');
}

// ===================== GOALS =====================

export async function getGoals(): Promise<PlanningGoal[]> {
  return fetchWithRetry(async () => {
    const uid = getUid();
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      title: d.data().title,
      targetAmount: d.data().targetAmount,
      currentAmount: d.data().currentAmount,
      deadline: d.data().deadline,
      icon: d.data().icon,
    }));
  }, 'cache_goals', 300000);
}

export async function addGoal(g: Omit<PlanningGoal, 'id'>): Promise<PlanningGoal> {
  const uid = getUid();
  const docRef = await addDoc(collection(db, 'goals'), {
    userId: uid,
    title: g.title,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    deadline: g.deadline,
    icon: g.icon,
    createdAt: Date.now(),
  });
  localStorage.removeItem('cache_goals');
  return { id: docRef.id, ...g };
}

export async function updateGoal(id: string, updates: Partial<PlanningGoal>) {
  const docRef = doc(db, 'goals', id);
  const dbUpdates: any = {};
  if (updates.currentAmount !== undefined) dbUpdates.currentAmount = updates.currentAmount;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.targetAmount !== undefined) dbUpdates.targetAmount = updates.targetAmount;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  await updateDoc(docRef, dbUpdates);
  localStorage.removeItem('cache_goals');
}

export async function deleteGoal(id: string) {
  await deleteDoc(doc(db, 'goals', id));
  localStorage.removeItem('cache_goals');
}

// ===================== LOANS =====================

export async function getLoans(): Promise<Loan[]> {
  return fetchWithRetry(async () => {
    const uid = getUid();
    const q = query(
      collection(db, 'loans'),
      where('userId', '==', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      name: d.data().name,
      bank: d.data().bank,
      totalAmount: d.data().totalAmount,
      remainingAmount: d.data().remainingAmount,
      monthlyPayment: d.data().monthlyPayment,
      interestRate: d.data().interestRate,
      paymentDay: d.data().paymentDay,
      nextPaymentDate: d.data().nextPaymentDate,
      endDate: d.data().endDate || '',
      color: d.data().color,
    }));
  }, 'cache_loans', 300000);
}

export async function addLoan(loan: Omit<Loan, 'id'>): Promise<Loan> {
  const uid = getUid();
  const docRef = await addDoc(collection(db, 'loans'), {
    userId: uid,
    name: loan.name,
    bank: loan.bank,
    totalAmount: loan.totalAmount,
    remainingAmount: loan.remainingAmount,
    monthlyPayment: loan.monthlyPayment,
    interestRate: loan.interestRate,
    paymentDay: loan.paymentDay,
    nextPaymentDate: loan.nextPaymentDate,
    endDate: loan.endDate || '',
    color: loan.color,
    createdAt: Date.now(),
  });
  localStorage.removeItem('cache_loans');
  return { id: docRef.id, ...loan };
}

export async function updateLoan(id: string, updates: Partial<Loan>) {
  const docRef = doc(db, 'loans', id);
  const dbUpdates: any = {};
  if (updates.remainingAmount !== undefined) dbUpdates.remainingAmount = updates.remainingAmount;
  if (updates.nextPaymentDate !== undefined) dbUpdates.nextPaymentDate = updates.nextPaymentDate;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  await updateDoc(docRef, dbUpdates);
  localStorage.removeItem('cache_loans');
}

export async function deleteLoan(id: string) {
  await deleteDoc(doc(db, 'loans', id));
  localStorage.removeItem('cache_loans');
}

// ===================== THEME =====================

export function getTheme(): ThemeMode {
  return (localStorage.getItem('ft_theme') as ThemeMode) || 'light';
}

export function saveTheme(t: ThemeMode) {
  localStorage.setItem('ft_theme', t);
}
