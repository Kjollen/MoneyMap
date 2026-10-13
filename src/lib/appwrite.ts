import { Client, Account, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('http://31.59.126.197/v1')
  .setProject('6ace2093002a63c56f64');

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = 'moneymap';
export const COLLECTIONS = {
  transactions: 'transactions',
  credit_cards: 'credit_cards',
  budgets: 'budgets',
  goals: 'goals',
  loans: 'loans'
};
