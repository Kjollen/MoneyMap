import { Client, Account, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://moneymap-finance.duckdns.org/v1')
  .setProject('6acf4911001d3d89e235');

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
