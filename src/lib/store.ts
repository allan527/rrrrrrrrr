import { CashbookEntry, Client, OwnerCapitalTransaction, Transaction, UserSession } from './types';

const KEYS = {
  clients: 'tf_clients',
  tx: 'tf_transactions',
  cashbook: 'tf_cashbook',
  ownerCapital: 'tf_owner_capital',
  session: 'tf_session'
};

function getItem<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T[]) : [];
}

function setItem<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  getClients: () => getItem<Client>(KEYS.clients),
  setClients: (x: Client[]) => setItem(KEYS.clients, x),
  getTransactions: () => getItem<Transaction>(KEYS.tx),
  setTransactions: (x: Transaction[]) => setItem(KEYS.tx, x),
  getCashbook: () => getItem<CashbookEntry>(KEYS.cashbook),
  setCashbook: (x: CashbookEntry[]) => setItem(KEYS.cashbook, x),
  getOwnerCapital: () => getItem<OwnerCapitalTransaction>(KEYS.ownerCapital),
  setOwnerCapital: (x: OwnerCapitalTransaction[]) => setItem(KEYS.ownerCapital, x),
  getSession: (): UserSession | null => {
    const raw = localStorage.getItem(KEYS.session);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  },
  setSession: (session: UserSession | null) => {
    if (session) localStorage.setItem(KEYS.session, JSON.stringify(session));
    else localStorage.removeItem(KEYS.session);
  }
};
