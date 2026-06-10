// ── Curriculou — App único (front + API de pagamento) para a Hostinger ───────
// Serve o site (dist/) E as rotas /api/* no mesmo processo Node.
// Usa o MySQL da Hostinger para os pedidos (se as variáveis DB_* existirem;
// senão cai para memória, útil em testes locais).
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3333;
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

const PRECO_COM_FOTO = 4.0;
const PRECO_SEM_FOTO = 3.5;
const PRECO_PROMO = 2.9;

// ── Banco (MySQL da Hostinger) com fallback para memória ─────────────────────
let pool = null;
const mem = new Map();

async function initDb() {
  if (!process.env.DB_HOST) {
    console.warn('⚠️  Sem DB_HOST — usando memória (pedidos somem ao reiniciar).');
    return;
  }
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });
  await pool.query(`CREATE TABLE IF NOT EXISTS pedidos (
    id VARCHAR(40) PRIMARY KEY,
    pago TINYINT NOT NULL DEFAULT 0,
    valor DECIMAL(10,2) NOT NULL,
    com_foto TINYINT NOT NULL DEFAULT 0,
    criado_em BIGINT NOT NULL
  )`);
  console.log('✅ MySQL conectado.');
}

async function salvarPedido(id, valor, comFoto) {
  if (pool) await pool.query('INSERT INTO pedidos (id,pago,valor,com_foto,criado_em) VALUES (?,?,?,?,?)', [id, 0, valor, comFoto ? 1 : 0, Date.now()]);
  else mem.set(id, { pago: false, valor, comFoto });
}
async function marcarPago(id) {
  if (pool) await pool.query('UPDATE pedidos SET pago=1 WHERE id=?', [id]);
  else mem.set(id, { ...(mem.get(id) || { valor: 0, comFoto: false }), pago: true });
}
async function estaPago(id) {
  if (pool) { const [r] = await pool.query('SELECT pago FROM pedidos WHERE id=?', [id]); return !!(r[0] && r[0].pago); }
  const p = mem.get(id); return !!(p && p.pago);
}

const novoId = () => 'cv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const FRONT = process.env.FRONTEND_URL || '';

// ── API ───────────────────────────────────────────────────────────────────────
app.post('/api/criar-pagamento', async (req, res) => {
  try {
    const { comFoto = false, promo = false } = req.body || {};
    const valor = promo ? PRECO_PROMO : (comFoto ? PRECO_COM_FOTO : PRECO_SEM_FOTO);
    const id = novoId();
    await salvarPedido(id, valor, comFoto);

    const pref = await new Preference(mp).create({
      body: {
        items: [{ id: 'curriculo', title: comFoto ? 'Currículo Curriculou (com foto)' : 'Currículo Curriculou', quantity: 1, unit_price: Number(valor), currency_id: 'BRL' }],
        external_reference: id,
        notification_url: `${process.env.BACKEND_URL || FRONT}/api/webhook`,
        back_urls: {
          success: `${FRONT}/?pago=${id}`,
          failure: `${FRONT}/?falhou=${id}`,
          pending: `${FRONT}/?pendente=${id}`,
        },
        auto_return: 'approved',
      },
    });
    res.json({ id, init_point: pref.init_point, sandbox_init_point: pref.sandbox_init_point });
  } catch (e) {
    console.error('criar-pagamento', e);
    res.status(500).json({ erro: 'Falha ao criar pagamento' });
  }
});

app.post('/api/webhook', async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query['data.id'];
    if (paymentId) {
      const payment = await new Payment(mp).get({ id: paymentId });
      const ref = payment?.external_reference;
      if (ref && payment?.status === 'approved') await marcarPago(ref);
    }
    res.sendStatus(200);
  } catch (e) {
    console.error('webhook', e);
    res.sendStatus(200);
  }
});

app.get('/api/status/:id', async (req, res) => {
  res.json({ pago: await estaPago(req.params.id) });
});

// (teste local) aprova manualmente
app.post('/api/_teste-aprovar/:id', async (req, res) => { await marcarPago(req.params.id); res.json({ ok: true }); });

// ── Front (SPA) ───────────────────────────────────────────────────────────────
const DIST = path.join(__dirname, 'dist');
app.use(express.static(DIST));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ erro: 'rota não encontrada' });
  res.sendFile(path.join(DIST, 'index.html'));
});

initDb().finally(() => {
  app.listen(PORT, () => console.log(`Curriculou rodando na porta ${PORT}`));
});
