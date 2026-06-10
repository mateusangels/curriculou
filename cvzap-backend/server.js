// ── CVZap — Backend de pagamento (Mercado Pago Checkout Pro) ─────────────────
// Sobe na Hostinger como "Web app Node.js".
// Fluxo:
//   1) front chama POST /api/criar-pagamento  -> cria a preferência e devolve init_point
//   2) usuário paga no Checkout Pro do Mercado Pago
//   3) MP chama POST /api/webhook             -> marcamos o pedido como pago
//   4) front consulta GET /api/status/:id     -> { pago: true } e libera o download
//
// IMPORTANTE: o Access Token é SECRETO e só vive aqui no servidor (.env).

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const app = express();
app.use(express.json());
app.use(cors({ origin: (process.env.FRONTEND_URL || '*') }));

const PORT = process.env.PORT || 3333;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5180';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

// ⚠️ Armazenamento em memória (some ao reiniciar). Troque por um banco em produção.
const pedidos = new Map(); // id -> { pago, valor, comFoto, criadoEm }

function novoId() {
  return 'cv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const PRECO_COM_FOTO = 4.0;
const PRECO_SEM_FOTO = 3.5;
const PRECO_PROMO = 2.9;

// ── 1) cria a preferência de pagamento ───────────────────────────────────────
app.post('/api/criar-pagamento', async (req, res) => {
  try {
    const { comFoto = false, promo = false } = req.body || {};
    const valor = promo ? PRECO_PROMO : (comFoto ? PRECO_COM_FOTO : PRECO_SEM_FOTO);
    const id = novoId();
    pedidos.set(id, { pago: false, valor, comFoto: !!comFoto, criadoEm: Date.now() });

    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items: [{
          id: 'curriculo',
          title: comFoto ? 'Currículo CVZap (com foto)' : 'Currículo CVZap',
          quantity: 1,
          unit_price: Number(valor),
          currency_id: 'BRL',
        }],
        external_reference: id,
        notification_url: `${process.env.BACKEND_URL || ''}/api/webhook`,
        back_urls: {
          success: `${FRONTEND_URL}/cvzap?pago=${id}`,
          failure: `${FRONTEND_URL}/cvzap?falhou=${id}`,
          pending: `${FRONTEND_URL}/cvzap?pendente=${id}`,
        },
        auto_return: 'approved',
      },
    });

    res.json({ id, init_point: result.init_point, sandbox_init_point: result.sandbox_init_point });
  } catch (e) {
    console.error('criar-pagamento', e);
    res.status(500).json({ erro: 'Falha ao criar pagamento' });
  }
});

// ── 2) webhook do Mercado Pago ────────────────────────────────────────────────
app.post('/api/webhook', async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query['data.id'];
    if (paymentId) {
      const payment = await new Payment(mp).get({ id: paymentId });
      const ref = payment?.external_reference;
      if (ref && payment?.status === 'approved' && pedidos.has(ref)) {
        pedidos.get(ref).pago = true;
      }
    }
    res.sendStatus(200); // sempre 200 para o MP não reenviar
  } catch (e) {
    console.error('webhook', e);
    res.sendStatus(200);
  }
});

// ── 3) status do pedido (o front consulta para liberar o download) ────────────
app.get('/api/status/:id', (req, res) => {
  const p = pedidos.get(req.params.id);
  res.json({ pago: !!(p && p.pago) });
});

// (opcional p/ testes locais) marca como pago manualmente
app.post('/api/_teste-aprovar/:id', (req, res) => {
  const p = pedidos.get(req.params.id);
  if (p) p.pago = true;
  res.json({ ok: !!p });
});

app.get('/', (_req, res) => res.send('CVZap backend ok'));

app.listen(PORT, () => console.log(`CVZap backend rodando na porta ${PORT}`));
