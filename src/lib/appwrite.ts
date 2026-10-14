import { Client, Account, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://moneymap-finance.duckdns.org/v1')
  .setProject('6acf4911001d3d89e235');

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = '6acf55d4001d54979db8';
export const COLLECTIONS = {
  transactions: '6acf55de0027ca509f27',
  credit_cards: '6acf563c00134fb79460',
  budgets: '6acf568a003e42b76ad9',
  goals: '6acf56b60032ce6f1f69',
  loans: '6acf56f60012d76b1e2d'
};
