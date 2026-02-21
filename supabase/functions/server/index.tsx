import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';

const app = new Hono();
app.use('*', cors());

const supabase = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');
const table = 'kv_store_68baa523';

const getBucket = async <T>(key: string): Promise<T[]> => {
  const { data } = await supabase.from(table).select('value').eq('key', key).single();
  return ((data?.value as T[]) ?? []);
};

const setBucket = async <T>(key: string, value: T[]) => {
  await supabase.from(table).upsert({ key, value }, { onConflict: 'key' });
};

app.get('/make-server-68baa523/clients', async (c) => c.json(await getBucket('clients')));
app.post('/make-server-68baa523/clients', async (c) => {
  const body = await c.req.json();
  const clients = await getBucket<any>('clients');
  clients.push(body);
  await setBucket('clients', clients);
  return c.json(body, 201);
});

app.put('/make-server-68baa523/clients/:id', async (c) => {
  const id = c.req.param('id');
  const payload = await c.req.json();
  const clients = await getBucket<any>('clients');
  const idx = clients.findIndex((x) => x.id === id);
  if (idx < 0) return c.json({ error: 'Not found' }, 404);
  clients[idx] = { ...clients[idx], ...payload };
  await setBucket('clients', clients);
  return c.json(clients[idx]);
});

app.delete('/make-server-68baa523/clients/:id', async (c) => {
  const id = c.req.param('id');
  const clients = (await getBucket<any>('clients')).filter((x) => x.id !== id);
  const transactions = (await getBucket<any>('transactions')).filter((x) => x.clientId !== id);
  const cashbook = (await getBucket<any>('cashbook')).filter((x) => !String(x.description).includes(id));
  await Promise.all([setBucket('clients', clients), setBucket('transactions', transactions), setBucket('cashbook', cashbook)]);
  return c.json({ ok: true });
});

app.get('/make-server-68baa523/transactions', async (c) => c.json(await getBucket('transactions')));
app.post('/make-server-68baa523/transactions', async (c) => {
  const body = await c.req.json();
  const items = await getBucket<any>('transactions');
  items.push(body);
  await setBucket('transactions', items);
  return c.json(body, 201);
});

app.get('/make-server-68baa523/cashbook', async (c) => c.json(await getBucket('cashbook')));
app.post('/make-server-68baa523/cashbook', async (c) => {
  const body = await c.req.json();
  const items = await getBucket<any>('cashbook');
  items.push(body);
  await setBucket('cashbook', items);
  return c.json(body, 201);
});

app.get('/make-server-68baa523/owner-capital', async (c) => c.json(await getBucket('ownerCapital')));
app.post('/make-server-68baa523/owner-capital', async (c) => {
  const body = await c.req.json();
  const items = await getBucket<any>('ownerCapital');
  items.push(body);
  await setBucket('ownerCapital', items);
  return c.json(body, 201);
});

const sendSms = async (to: string, message: string) => {
  const username = process.env.AFRICAS_TALKING_USERNAME ?? 'william_main_user';
  const apiKey = process.env.AFRICAS_TALKING_API_KEY ?? 'atsk_eee56107794a362e5f04a427ca658d3c6063ce37b3c7932106e4016e6a7a950c9fc121e0';
  const senderId = process.env.AFRICAS_TALKING_SENDER_ID ?? 'ATTech';
  const body = new URLSearchParams({ username, to, message, from: senderId }).toString();

  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', apiKey },
    body,
  });
  const json = await res.json();
  console.log('AT SMS response', json);
  return json;
};

app.post('/make-server-68baa523/sms/:template', async (c) => {
  const { phone, message } = await c.req.json();
  try {
    const response = await sendSms(phone, message);
    return c.json({ ok: true, response });
  } catch (error) {
    console.error('SMS error', error);
    return c.json({ ok: false, error: 'SMS send failed' }, 500);
  }
});

export default app;
