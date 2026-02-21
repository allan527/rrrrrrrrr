import React, { FormEvent, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Link, Navigate, Outlet, RouterProvider, createBrowserRouter, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, BarChart3, BookOpen, CircleDollarSign, CreditCard, LayoutDashboard, PlusCircle, Users } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { store } from './lib/store';
import { CashbookEntry, Client, OwnerCapitalTransaction, Transaction, UserSession } from './lib/types';
import { formatDate, formatTime, formatUGX, isOwner, maskPhoneNumber, normalizePhoneNumber } from './lib/utils';
import './styles.css';

const Nav = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/clients', 'Clients', Users],
  ['/add-client', 'Add Client', PlusCircle],
  ['/loans', 'Loans', CircleDollarSign],
  ['/transactions', 'Transactions', CreditCard],
  ['/cashbook', 'Cashbook', BookOpen],
  ['/owner-capital', 'Owner Capital', BarChart3],
  ['/evaluation', 'Evaluation', AlertCircle],
  ['/data-view', 'Data View', BookOpen],
  ['/client-allocation', 'Client Allocation', Users],
] as const;

function useData() {
  const [clients, setClients] = useState(store.getClients());
  const [transactions, setTransactions] = useState(store.getTransactions());
  const [cashbook, setCashbook] = useState(store.getCashbook());
  const [ownerCapital, setOwnerCapital] = useState(store.getOwnerCapital());

  return {
    clients,
    transactions,
    cashbook,
    ownerCapital,
    refresh: () => {
      setClients(store.getClients());
      setTransactions(store.getTransactions());
      setCashbook(store.getCashbook());
      setOwnerCapital(store.getOwnerCapital());
    },
  };
}

function Layout() {
  const navigate = useNavigate();
  const session = store.getSession();
  if (!session) return <Navigate to="/login" replace />;

  return <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
    <aside className="bg-slate-800 text-white p-4">
      <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-purple-200 bg-clip-text text-transparent">Texas Finance</h1>
      <nav className="space-y-1">
        {Nav.map(([to, label, Icon]) => (
          <Link key={to} to={to} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-violet-600/40">
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>
      <button className="mt-6 w-full rounded-lg bg-red-500/80 py-2" onClick={() => { store.setSession(null); navigate('/login'); }}>Logout</button>
    </aside>
    <main className="p-4 lg:p-8"><Outlet /></main>
    <Toaster richColors position="top-right" />
  </div>;
}

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email and password required');
    const session: UserSession = { email, role: isOwner(email) ? 'owner' : 'staff' };
    store.setSession(session);
    nav('/');
  };
  return <div className="min-h-screen grid place-items-center p-4"><form onSubmit={submit} className="card-glass rounded-xl shadow-lg p-6 w-full max-w-md space-y-3">
    <h2 className="text-2xl font-semibold">Texas Finance Login</h2>
    <input className="w-full rounded-lg border p-2" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input type="password" className="w-full rounded-lg border p-2" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
    <button className="w-full rounded-lg p-2 text-white bg-gradient-to-r from-violet-600 to-purple-400">Sign in</button>
  </form></div>;
}

function Dashboard() {
  const { clients, transactions } = useData();
  const kpi = useMemo(() => {
    const active = clients.filter((c) => c.status === 'Active');
    const collected = transactions.reduce((a, t) => a + t.amount, 0);
    const lent = clients.reduce((a, c) => a + c.loanAmount, 0);
    const outstanding = clients.reduce((a, c) => a + c.outstandingBalance, 0);
    return { activeClients: active.length, activeLoans: active.length, collected, lent, outstanding };
  }, [clients, transactions]);

  return <div className="space-y-4">
    <h2 className="text-3xl font-bold">Dashboard</h2>
    <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {[['Active Clients', kpi.activeClients], ['Total Active Loans', kpi.activeLoans], ['Money Lent', formatUGX(kpi.lent)], ['Outstanding', formatUGX(kpi.outstanding)], ['Collected', formatUGX(kpi.collected)]].map(([k,v], i) => (
        <div key={String(k)} className={`rounded-xl border-2 p-4 text-white shadow-md ${['bg-gradient-to-r from-emerald-500 to-emerald-700','bg-gradient-to-r from-blue-500 to-blue-700','bg-gradient-to-r from-violet-500 to-purple-700','bg-gradient-to-r from-amber-500 to-orange-700','bg-gradient-to-r from-green-500 to-emerald-700'][i]}`}>
          <p className="text-sm">{k}</p><p className="text-2xl font-bold">{v}</p>
        </div>
      ))}
    </div>
    <div className="card-glass rounded-xl p-4"><h3 className="font-semibold mb-2">Recent Payments</h3>
      <table className="w-full text-sm"><thead><tr className="text-left"><th>Date</th><th>Client</th><th>Amount</th><th>By</th></tr></thead>
      <tbody>{transactions.slice(-6).reverse().map((t)=><tr key={t.id}><td>{t.date}</td><td>{t.clientName}</td><td>{formatUGX(t.amount)}</td><td>{t.recordedBy}</td></tr>)}</tbody></table>
    </div>
  </div>;
}

function AddClient() {
  const nav = useNavigate();
  const session = store.getSession()!;
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loanAmount, setLoanAmount] = useState(100000);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const start = new Date();
    const end = new Date(start); end.setDate(end.getDate() + 30);
    const client: Client = {
      id: crypto.randomUUID(),
      fullName,
      phoneNumber: normalizePhoneNumber(phone),
      nationalId: 'N/A',
      location: 'N/A',
      guarantorName: 'N/A',
      guarantorId: 'N/A',
      guarantorPhone: 'N/A',
      guarantorLocation: 'N/A',
      loanAmount,
      processingFee: 10000,
      totalPayable: loanAmount * 1.2,
      totalPaid: 0,
      outstandingBalance: loanAmount * 1.2,
      startDate: formatDate(start),
      endDate: formatDate(end),
      status: 'Active',
      addedBy: session.email,
      currentLoanNumber: 1,
      totalLoansCompleted: 0,
    };
    const clients = store.getClients();
    clients.push(client);
    store.setClients(clients);
    const cashbook = store.getCashbook();
    const now = new Date();
    cashbook.push({ id: crypto.randomUUID(), date: formatDate(now), time: formatTime(now), description: `Loan disbursement - ${fullName}`, type: 'Expense', amount: loanAmount, status: 'Disbursement', enteredBy: session.email });
    cashbook.push({ id: crypto.randomUUID(), date: formatDate(now), time: formatTime(now), description: `Processing fee - ${fullName}`, type: 'Income', amount: 10000, status: 'Income', enteredBy: session.email });
    store.setCashbook(cashbook);
    toast.success('Client added successfully with disbursement and fee entries.');
    nav('/clients');
  };

  return <form onSubmit={submit} className="max-w-xl space-y-3 card-glass rounded-xl p-4">
    <h2 className="text-2xl font-bold">Add Client</h2>
    <input required minLength={3} className="w-full rounded-lg border p-2" placeholder="Full name" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
    <input required className="w-full rounded-lg border p-2" placeholder="Phone (0XXXXXXXXX)" value={phone} onChange={(e)=>setPhone(e.target.value)} />
    <input required min={10000} type="number" className="w-full rounded-lg border p-2" value={loanAmount} onChange={(e)=>setLoanAmount(Number(e.target.value))} />
    <button className="rounded-lg px-4 py-2 text-white bg-gradient-to-r from-violet-600 to-purple-400">Create Loan</button>
  </form>;
}

function ClientsPage() {
  const { clients } = useData();
  const [q, setQ] = useState('');
  const filtered = clients.filter((c) => [c.fullName, c.phoneNumber, c.nationalId].join(' ').toLowerCase().includes(q.toLowerCase()));
  return <div>
    <h2 className="text-2xl font-bold mb-3">Clients</h2>
    <input className="mb-3 rounded-lg border p-2 w-full max-w-md" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
      {filtered.map((c) => <Link to={`/clients/${c.id}`} key={c.id} className="card-glass rounded-xl p-4 shadow-sm hover:shadow-lg transition">
        <h3 className="font-semibold">{c.fullName}</h3>
        <p>{maskPhoneNumber(c.phoneNumber)} · <span className={c.status === 'Active' ? 'text-emerald-600' : 'text-blue-600'}>{c.status}</span></p>
        <p>Outstanding: {formatUGX(c.outstandingBalance)}</p>
      </Link>)}
    </div>
  </div>;
}

function ClientDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = store.getSession()!;
  const client = store.getClients().find((c) => c.id === id);
  if (!client) return <div>Client not found</div>;
  const tx = store.getTransactions().filter((t) => t.clientId === client.id);
  const [amount, setAmount] = useState(0);

  const recordPayment = () => {
    if (amount <= 0 || amount > client.outstandingBalance) return toast.error('Invalid amount');
    const clients = store.getClients();
    const idx = clients.findIndex((c) => c.id === client.id);
    const updated = { ...client };
    updated.totalPaid += amount;
    updated.outstandingBalance -= amount;
    updated.status = updated.outstandingBalance === 0 ? 'Completed' : 'Active';
    clients[idx] = updated;
    store.setClients(clients);

    const now = new Date();
    const t: Transaction = { id: crypto.randomUUID(), clientId: client.id, clientName: client.fullName, date: formatDate(now), time: formatTime(now), amount, notes: 'Payment', status: 'Paid', recordedBy: session.email, loanNumber: client.currentLoanNumber };
    store.setTransactions([...store.getTransactions(), t]);
    const cb: CashbookEntry = { id: crypto.randomUUID(), date: t.date, time: t.time, description: `Loan repayment - ${client.fullName}`, type: 'Income', amount, status: 'Paid', enteredBy: session.email };
    store.setCashbook([...store.getCashbook(), cb]);

    toast.success('Payment recorded successfully');
    nav(0);
  };

  return <div className="space-y-3">
    <Link to="/clients" className="text-violet-600">← Back</Link>
    <div className="card-glass rounded-xl p-4"><h2 className="text-2xl font-bold">{client.fullName}</h2>
      <p>{client.phoneNumber} · {client.status}</p>
      <p>Loan #{client.currentLoanNumber} · Due {client.endDate}</p>
      <p>Outstanding: {formatUGX(client.outstandingBalance)}</p>
      <div className="flex gap-2 mt-2"><input type="number" className="rounded-lg border p-2" value={amount} onChange={(e)=>setAmount(Number(e.target.value))}/>
      <button className="rounded-lg px-3 py-2 bg-emerald-600 text-white" onClick={recordPayment}>Record Payment</button>
      {isOwner(session.email) && <button className="rounded-lg px-3 py-2 bg-blue-600 text-white" onClick={()=>toast.info('Balance inquiry SMS queued')}>Send Balance Inquiry SMS</button>}
      </div>
    </div>
    <div className="card-glass rounded-xl p-4"><h3 className="font-semibold">Payments</h3>
      <table className="w-full text-sm"><tbody>{tx.map((t)=><tr key={t.id}><td>{t.date}</td><td>{formatUGX(t.amount)}</td><td>{t.recordedBy}</td></tr>)}</tbody></table>
    </div>
  </div>;
}

function Loans() {
  const clients = store.getClients();
  return <DataTable title="Loans" rows={clients.map((c) => [c.fullName, c.phoneNumber, formatUGX(c.loanAmount), formatUGX(c.outstandingBalance), c.status])} headers={['Client', 'Phone', 'Loan', 'Outstanding', 'Status']} />;
}

function TransactionsPage() {
  const tx = store.getTransactions();
  return <DataTable title="Transactions" rows={tx.map((t) => [t.date, t.time, t.clientName, formatUGX(t.amount), t.recordedBy])} headers={['Date', 'Time', 'Client', 'Amount', 'By']} />;
}

function CashbookPage() {
  const cashbook = store.getCashbook();
  return <DataTable title="Cashbook" rows={cashbook.map((e) => [e.date, e.description, e.type, formatUGX(e.amount), e.status])} headers={['Date', 'Description', 'Type', 'Amount', 'Status']} />;
}

function OwnerCapitalPage() {
  const session = store.getSession()!;
  if (!isOwner(session.email)) return <div className="text-red-500">Access denied: Owner only</div>;
  const items = store.getOwnerCapital();
  const add = () => {
    const now = new Date();
    const item: OwnerCapitalTransaction = { id: crypto.randomUUID(), date: formatDate(now), time: formatTime(now), type: 'Injection', amount: 100000, notes: 'Manual', recordedBy: session.email };
    store.setOwnerCapital([...items, item]);
    toast.success('Capital injection added');
  };
  return <div className="space-y-3"><button onClick={add} className="rounded-lg bg-violet-600 text-white px-3 py-2">Add Injection</button>
    <DataTable title="Owner Capital" rows={items.map((e) => [e.date, e.type, formatUGX(e.amount), e.notes])} headers={['Date','Type','Amount','Notes']} />
  </div>;
}

function Evaluation() {
  const cashbook = store.getCashbook();
  const collections = cashbook.filter((e) => e.type === 'Income').reduce((a, e) => a + e.amount, 0);
  const disbursements = cashbook.filter((e) => e.status === 'Disbursement').reduce((a, e) => a + e.amount, 0);
  const expenses = cashbook.filter((e) => e.type === 'Expense' && e.status !== 'Disbursement').reduce((a, e) => a + e.amount, 0);
  return <div className="card-glass p-4 rounded-xl"><h2 className="text-2xl font-bold mb-2">Evaluation</h2>
    <p>Total Collections: {formatUGX(collections)}</p><p>Amount Loaned: {formatUGX(disbursements)}</p><p>Expenses: {formatUGX(expenses)}</p>
  </div>;
}

function DataView() {
  const session = store.getSession()!;
  if (!isOwner(session.email)) return <div className="text-red-500">Access denied: Owner only</div>;
  return <div className="card-glass rounded-xl p-4 text-sm"><pre>{JSON.stringify({ clients: store.getClients(), tx: store.getTransactions(), cashbook: store.getCashbook() }, null, 2)}</pre></div>;
}

function ClientAllocation() {
  const session = store.getSession()!;
  if (!isOwner(session.email)) return <div className="text-red-500">Access denied: Owner only</div>;
  return <div className="card-glass rounded-xl p-4">Client allocation workspace (assign collectors).</div>;
}

function DataTable({ title, headers, rows }: { title: string; headers: string[]; rows: (string | number)[][] }) {
  return <div className="card-glass rounded-xl p-4 overflow-x-auto"><h2 className="text-2xl font-bold mb-2">{title}</h2>
    <table className="min-w-full text-sm"><thead><tr>{headers.map((h) => <th className="text-left p-2" key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="odd:bg-slate-50/60">{r.map((c,j) => <td key={j} className="p-2">{c}</td>)}</tr>)}</tbody>
    </table></div>;
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientDetail /> },
      { path: 'add-client', element: <AddClient /> },
      { path: 'loans', element: <Loans /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'cashbook', element: <CashbookPage /> },
      { path: 'owner-capital', element: <OwnerCapitalPage /> },
      { path: 'evaluation', element: <Evaluation /> },
      { path: 'data-view', element: <DataView /> },
      { path: 'client-allocation', element: <ClientAllocation /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
