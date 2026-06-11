// ── Curriculou — App único (front + API de pagamento) para a Hostinger ───────
// Serve o site (dist/) E as rotas /api/* no mesmo processo Node.
// Usa o MySQL da Hostinger para os pedidos (se as variáveis DB_* existirem;
// senão cai para memória, útil em testes locais).
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troque-em-producao';
const JWT_EXPIRA = '30d';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
// limite alto: o snapshot do currículo pode incluir a foto em base64 (>100kb)
app.use(express.json({ limit: '6mb' }));
app.use(cors());

const PORT = process.env.PORT || 3333;

// nunca deixar o app cair por erro não tratado (mantém o site no ar)
process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e));
process.on('uncaughtException', (e) => console.error('uncaughtException:', e));

// Mercado Pago carregado de forma preguiçosa (não derruba o app se faltar token)
async function getMercadoPago() {
  if (!process.env.MP_ACCESS_TOKEN) return null;
  const mod = await import('mercadopago');
  const MP = mod.MercadoPagoConfig || mod.default?.MercadoPagoConfig;
  const Preference = mod.Preference || mod.default?.Preference;
  const Payment = mod.Payment || mod.default?.Payment;
  const PreApproval = mod.PreApproval || mod.default?.PreApproval;
  return { client: new MP({ accessToken: process.env.MP_ACCESS_TOKEN }), Preference, Payment, PreApproval };
}

const PRECO_INDIVIDUAL = 4.9; // 1 download, sem marca d'água
const PRECO_RETENCAO = 7.9;   // oferta de retenção (cancelamento)
const PRECO_PRO_MES = 14.9;   // assinatura Profissional (mensal)

// ── Banco (MySQL da Hostinger) com fallback para memória ─────────────────────
let pool = null;
let dbErro = null;              // motivo da falha de conexão (diagnóstico)
const mem = new Map();          // pedidos
const memUsers = new Map();     // usuarios (email -> registro) no modo memória
const memCurriculos = new Map(); // curriculos (id -> registro) no modo memória
const memEventos = [];          // eventos de analytics no modo memória

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'angelsrequires@gmail.com').toLowerCase();

async function initDb() {
  if (!process.env.DB_HOST) {
    dbErro = 'DB_HOST ausente (o .env não foi lido ou as variáveis não estão no app)';
    console.warn('⚠️  Sem DB_HOST — usando memória (pedidos somem ao reiniciar).');
    return;
  }
  try {
    const mysql = (await import('mysql2/promise')).default;
    // força IPv4: "localhost" resolve para ::1 (IPv6) e o MySQL recusa (grant é IPv4)
    const host = process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST;
    pool = mysql.createPool({
      host,
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
      snapshot LONGTEXT NULL,
      criado_em BIGINT NOT NULL
    )`);
    // migra tabelas antigas que ainda não têm a coluna snapshot
    try { await pool.query('ALTER TABLE pedidos ADD COLUMN snapshot LONGTEXT NULL'); }
    catch { /* coluna já existe */ }
    await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
      id VARCHAR(40) PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      senha_hash VARCHAR(120) NOT NULL,
      plano VARCHAR(20) NOT NULL DEFAULT 'free',
      google_id VARCHAR(60) NULL,
      preapproval_id VARCHAR(60) NULL,
      criado_em BIGINT NOT NULL
    )`);
    try { await pool.query('ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(60) NULL'); }
    catch { /* coluna já existe */ }
    try { await pool.query('ALTER TABLE usuarios ADD COLUMN preapproval_id VARCHAR(60) NULL'); }
    catch { /* coluna já existe */ }
    await pool.query(`CREATE TABLE IF NOT EXISTS curriculos (
      id VARCHAR(40) PRIMARY KEY,
      user_id VARCHAR(40) NOT NULL,
      titulo VARCHAR(160) NOT NULL,
      snapshot LONGTEXT NOT NULL,
      atualizado_em BIGINT NOT NULL,
      INDEX idx_user (user_id)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS eventos (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      tipo VARCHAR(40) NOT NULL,
      visitante VARCHAR(40) NULL,
      user_id VARCHAR(40) NULL,
      dados VARCHAR(255) NULL,
      ua VARCHAR(255) NULL,
      criado_em BIGINT NOT NULL,
      INDEX idx_tipo (tipo), INDEX idx_criado (criado_em)
    )`);
    console.log('✅ MySQL conectado.');
  } catch (e) {
    dbErro = String(e && e.message ? e.message : e);
    console.error('⚠️  Falha no MySQL — caindo para memória:', dbErro);
    pool = null;
  }
}

async function salvarPedido(id, valor, comFoto, snapshot) {
  const snapStr = snapshot ? JSON.stringify(snapshot) : null;
  if (pool) await pool.query('INSERT INTO pedidos (id,pago,valor,com_foto,snapshot,criado_em) VALUES (?,?,?,?,?,?)', [id, 0, valor, comFoto ? 1 : 0, snapStr, Date.now()]);
  else mem.set(id, { pago: false, valor, comFoto, snapshot: snapStr });
}
async function marcarPago(id) {
  if (pool) await pool.query('UPDATE pedidos SET pago=1 WHERE id=?', [id]);
  else mem.set(id, { ...(mem.get(id) || { valor: 0, comFoto: false }), pago: true });
}
async function estaPago(id) {
  if (pool) { const [r] = await pool.query('SELECT pago FROM pedidos WHERE id=?', [id]); return !!(r[0] && r[0].pago); }
  const p = mem.get(id); return !!(p && p.pago);
}
// Retorna { pago, snapshot } — o snapshot só vai junto se o pedido estiver pago.
async function buscarPedido(id) {
  let pago = false, snapStr = null;
  if (pool) {
    const [r] = await pool.query('SELECT pago, snapshot FROM pedidos WHERE id=?', [id]);
    if (r[0]) { pago = !!r[0].pago; snapStr = r[0].snapshot; }
  } else {
    const p = mem.get(id);
    if (p) { pago = !!p.pago; snapStr = p.snapshot; }
  }
  let snapshot;
  if (pago && snapStr) { try { snapshot = JSON.parse(snapStr); } catch { /* corrompido */ } }
  return { pago, snapshot };
}

const novoId = () => 'cv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const novoUserId = () => 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const FRONT = process.env.FRONTEND_URL || '';

// ── Usuários ────────────────────────────────────────────────────────────────
const normEmail = (e) => String(e || '').trim().toLowerCase();

async function buscarUsuarioPorEmail(email) {
  const e = normEmail(email);
  if (pool) { const [r] = await pool.query('SELECT * FROM usuarios WHERE email=?', [e]); return r[0] || null; }
  return memUsers.get(e) || null;
}
async function buscarUsuarioPorId(id) {
  if (pool) { const [r] = await pool.query('SELECT * FROM usuarios WHERE id=?', [id]); return r[0] || null; }
  for (const u of memUsers.values()) if (u.id === id) return u;
  return null;
}
async function criarUsuario(nome, email, senha) {
  const e = normEmail(email);
  const id = novoUserId();
  const senha_hash = await bcrypt.hash(senha, 10);
  const reg = { id, nome: String(nome).trim(), email: e, senha_hash, plano: 'free', criado_em: Date.now() };
  if (pool) await pool.query('INSERT INTO usuarios (id,nome,email,senha_hash,plano,criado_em) VALUES (?,?,?,?,?,?)', [reg.id, reg.nome, reg.email, reg.senha_hash, reg.plano, reg.criado_em]);
  else memUsers.set(e, reg);
  return reg;
}

const tokenDoUsuario = (u) => jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: JWT_EXPIRA });
const usuarioPublico = (u) => ({ id: u.id, nome: u.nome, email: u.email, plano: u.plano });

async function definirPlano(userId, plano, preapprovalId) {
  if (pool) await pool.query('UPDATE usuarios SET plano=?, preapproval_id=? WHERE id=?', [plano, preapprovalId || null, userId]);
  else for (const u of memUsers.values()) if (u.id === userId) { u.plano = plano; u.preapproval_id = preapprovalId || null; }
}

// registra um evento de analytics (nunca derruba o app por causa de tracking)
async function logEvento(tipo, { visitante = null, userId = null, dados = null, ua = null } = {}) {
  const ev = {
    tipo: String(tipo).slice(0, 40),
    visitante: visitante ? String(visitante).slice(0, 40) : null,
    user_id: userId || null,
    dados: dados != null ? String(dados).slice(0, 255) : null,
    ua: ua ? String(ua).slice(0, 255) : null,
    criado_em: Date.now(),
  };
  try {
    if (pool) await pool.query('INSERT INTO eventos (tipo,visitante,user_id,dados,ua,criado_em) VALUES (?,?,?,?,?,?)', [ev.tipo, ev.visitante, ev.user_id, ev.dados, ev.ua, ev.criado_em]);
    else { memEventos.push({ id: memEventos.length + 1, ...ev }); if (memEventos.length > 5000) memEventos.shift(); }
  } catch { /* ignora */ }
}

// middleware: exige Bearer token válido; injeta req.usuario
async function exigirAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const tok = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!tok) return res.status(401).json({ erro: 'não autenticado' });
    const { sub } = jwt.verify(tok, JWT_SECRET);
    const u = await buscarUsuarioPorId(sub);
    if (!u) return res.status(401).json({ erro: 'sessão inválida' });
    req.usuario = u;
    next();
  } catch {
    res.status(401).json({ erro: 'sessão inválida' });
  }
}

// ── Auth API ──────────────────────────────────────────────────────────────────
app.post('/api/auth/registrar', async (req, res) => {
  try {
    const { nome, email, senha } = req.body || {};
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha nome, e-mail e senha.' });
    if (String(senha).length < 6) return res.status(400).json({ erro: 'A senha precisa ter ao menos 6 caracteres.' });
    if (await buscarUsuarioPorEmail(email)) return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail.' });
    const u = await criarUsuario(nome, email, senha);
    logEvento('cadastro', { userId: u.id, dados: u.email, ua: req.headers['user-agent'] });
    res.json({ token: tokenDoUsuario(u), usuario: usuarioPublico(u) });
  } catch (e) {
    console.error('registrar', e);
    res.status(500).json({ erro: 'Falha ao criar conta' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    const u = await buscarUsuarioPorEmail(email);
    if (!u || !(await bcrypt.compare(String(senha || ''), u.senha_hash))) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }
    logEvento('login', { userId: u.id, dados: u.email, ua: req.headers['user-agent'] });
    res.json({ token: tokenDoUsuario(u), usuario: usuarioPublico(u) });
  } catch (e) {
    console.error('login', e);
    res.status(500).json({ erro: 'Falha ao entrar' });
  }
});

app.get('/api/auth/me', exigirAuth, (req, res) => {
  res.json({ usuario: usuarioPublico(req.usuario) });
});

// ── Login com Google (valida o ID token do Firebase com as chaves PÚBLICAS do Google) ─
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'curriculou-7439c';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certsCache = { data: null, exp: 0 };

async function getGoogleCerts() {
  if (certsCache.data && Date.now() < certsCache.exp) return certsCache.data;
  const r = await fetch(CERTS_URL);
  const data = await r.json();
  const m = (r.headers.get('cache-control') || '').match(/max-age=(\d+)/);
  certsCache = { data, exp: Date.now() + (m ? Number(m[1]) * 1000 : 3600000) };
  return data;
}

async function verificarTokenGoogle(idToken) {
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded?.header?.kid) throw new Error('token inválido');
  const cert = (await getGoogleCerts())[decoded.header.kid];
  if (!cert) throw new Error('chave não encontrada');
  return jwt.verify(idToken, cert, {
    algorithms: ['RS256'],
    audience: FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
  });
}

async function acharOuCriarGoogle(payload) {
  const email = normEmail(payload.email);
  const existente = await buscarUsuarioPorEmail(email);
  if (existente) return existente;
  const reg = {
    id: novoUserId(), nome: String(payload.name || email.split('@')[0]).slice(0, 120),
    email, senha_hash: '', plano: 'free', google_id: payload.sub || payload.user_id || '', criado_em: Date.now(),
  };
  if (pool) await pool.query('INSERT INTO usuarios (id,nome,email,senha_hash,plano,google_id,criado_em) VALUES (?,?,?,?,?,?,?)', [reg.id, reg.nome, reg.email, reg.senha_hash, reg.plano, reg.google_id, reg.criado_em]);
  else memUsers.set(email, reg);
  return reg;
}

app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ erro: 'token ausente' });
    const payload = await verificarTokenGoogle(idToken);
    if (!payload.email) return res.status(400).json({ erro: 'Conta Google sem e-mail.' });
    const ja = await buscarUsuarioPorEmail(payload.email);
    const u = await acharOuCriarGoogle(payload);
    logEvento(ja ? 'login' : 'cadastro', { userId: u.id, dados: 'google:' + u.email, ua: req.headers['user-agent'] });
    res.json({ token: tokenDoUsuario(u), usuario: usuarioPublico(u) });
  } catch (e) {
    console.error('google login', e);
    res.status(401).json({ erro: 'Falha ao validar o login do Google' });
  }
});

// ── Assinatura Profissional (Mercado Pago — preapproval mensal) ───────────────
app.post('/api/assinar', exigirAuth, async (req, res) => {
  try {
    const mp = await getMercadoPago();
    if (!mp || !mp.PreApproval) return res.status(503).json({ erro: 'Assinatura ainda não configurada (defina MP_ACCESS_TOKEN).' });
    const pre = await new mp.PreApproval(mp.client).create({
      body: {
        reason: 'Curriculou Profissional',
        external_reference: req.usuario.id,
        payer_email: req.usuario.email,
        back_url: `${FRONT}/?assinado=1`,
        auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: PRECO_PRO_MES, currency_id: 'BRL' },
        status: 'pending',
      },
    });
    res.json({ init_point: pre.init_point });
  } catch (e) {
    console.error('assinar', e);
    res.status(500).json({ erro: 'Falha ao iniciar assinatura' });
  }
});

// ── Currículos (histórico por usuário) ────────────────────────────────────────
const novoCurId = () => 'cur_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

async function listarCurriculos(userId) {
  if (pool) { const [r] = await pool.query('SELECT id,titulo,atualizado_em FROM curriculos WHERE user_id=? ORDER BY atualizado_em DESC', [userId]); return r; }
  return [...memCurriculos.values()].filter((c) => c.user_id === userId)
    .map(({ id, titulo, atualizado_em }) => ({ id, titulo, atualizado_em }))
    .sort((a, b) => b.atualizado_em - a.atualizado_em);
}
async function obterCurriculo(userId, id) {
  if (pool) { const [r] = await pool.query('SELECT * FROM curriculos WHERE id=? AND user_id=?', [id, userId]); return r[0] || null; }
  const c = memCurriculos.get(id); return c && c.user_id === userId ? c : null;
}
async function salvarCurriculo(userId, titulo, snapshot, id) {
  const snapStr = JSON.stringify(snapshot || {});
  const t = String(titulo || 'Currículo').slice(0, 160);
  if (id) {
    const ex = await obterCurriculo(userId, id);
    if (!ex) return null;
    if (pool) await pool.query('UPDATE curriculos SET titulo=?,snapshot=?,atualizado_em=? WHERE id=? AND user_id=?', [t, snapStr, Date.now(), id, userId]);
    else memCurriculos.set(id, { ...ex, titulo: t, snapshot: snapStr, atualizado_em: Date.now() });
    return { id, titulo: t };
  }
  const novo = novoCurId();
  if (pool) await pool.query('INSERT INTO curriculos (id,user_id,titulo,snapshot,atualizado_em) VALUES (?,?,?,?,?)', [novo, userId, t, snapStr, Date.now()]);
  else memCurriculos.set(novo, { id: novo, user_id: userId, titulo: t, snapshot: snapStr, atualizado_em: Date.now() });
  return { id: novo, titulo: t };
}
async function excluirCurriculo(userId, id) {
  if (pool) await pool.query('DELETE FROM curriculos WHERE id=? AND user_id=?', [id, userId]);
  else { const c = memCurriculos.get(id); if (c && c.user_id === userId) memCurriculos.delete(id); }
}

app.get('/api/curriculos', exigirAuth, async (req, res) => {
  try { res.json({ curriculos: await listarCurriculos(req.usuario.id) }); }
  catch (e) { console.error('listar curriculos', e); res.status(500).json({ erro: 'Falha ao listar' }); }
});
app.post('/api/curriculos', exigirAuth, async (req, res) => {
  try {
    const { titulo, snapshot, id } = req.body || {};
    const r = await salvarCurriculo(req.usuario.id, titulo, snapshot, id);
    if (!r) return res.status(404).json({ erro: 'Currículo não encontrado' });
    res.json(r);
  } catch (e) { console.error('salvar curriculo', e); res.status(500).json({ erro: 'Falha ao salvar' }); }
});
app.get('/api/curriculos/:id', exigirAuth, async (req, res) => {
  try {
    const c = await obterCurriculo(req.usuario.id, req.params.id);
    if (!c) return res.status(404).json({ erro: 'não encontrado' });
    let snapshot; try { snapshot = JSON.parse(c.snapshot); } catch { snapshot = null; }
    res.json({ id: c.id, titulo: c.titulo, atualizado_em: c.atualizado_em, snapshot });
  } catch (e) { console.error('obter curriculo', e); res.status(500).json({ erro: 'Falha' }); }
});
app.delete('/api/curriculos/:id', exigirAuth, async (req, res) => {
  try { await excluirCurriculo(req.usuario.id, req.params.id); res.json({ ok: true }); }
  catch (e) { console.error('excluir curriculo', e); res.status(500).json({ erro: 'Falha ao excluir' }); }
});

// ── API ───────────────────────────────────────────────────────────────────────
app.post('/api/criar-pagamento', async (req, res) => {
  try {
    const { plano = 'individual', snapshot = null } = req.body || {};
    const valor = plano === 'retencao' ? PRECO_RETENCAO : PRECO_INDIVIDUAL;
    const titulo = plano === 'retencao' ? 'Curriculou — oferta 30 dias' : 'Currículo Curriculou (PDF sem marca d\'água)';
    const mp = await getMercadoPago();
    if (!mp) return res.status(503).json({ erro: 'Pagamento ainda não configurado (defina MP_ACCESS_TOKEN).' });

    const id = novoId();
    await salvarPedido(id, valor, plano === 'retencao', snapshot);

    const pref = await new mp.Preference(mp.client).create({
      body: {
        items: [{ id: 'curriculo', title: titulo, quantity: 1, unit_price: Number(valor), currency_id: 'BRL' }],
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
    const mp = await getMercadoPago();
    const tipo = String(req.query.type || req.query.topic || req.body?.type || '');
    const id = req.body?.data?.id || req.query['data.id'] || req.query.id;
    if (mp && id && (tipo.includes('preapproval') || tipo.includes('subscription'))) {
      // assinatura: atualiza o plano do usuário conforme o status
      const pre = await new mp.PreApproval(mp.client).get({ id });
      const userId = pre?.external_reference;
      if (userId) {
        if (pre.status === 'authorized') await definirPlano(userId, 'pro', pre.id);
        else if (pre.status === 'cancelled' || pre.status === 'paused') await definirPlano(userId, 'free', pre.id);
      }
    } else if (mp && id) {
      // pagamento avulso
      const payment = await new mp.Payment(mp.client).get({ id });
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

// Pedido completo: { pago, snapshot } — usado para recuperar/baixar o currículo.
app.get('/api/pedido/:id', async (req, res) => {
  try {
    res.json(await buscarPedido(req.params.id));
  } catch (e) {
    console.error('pedido', e);
    res.status(500).json({ pago: false });
  }
});

// (apenas teste) aprova manualmente — DESLIGADO por padrão para não virar
// um buraco de dinheiro. Habilite com ALLOW_TEST_APPROVE=1 só em ambiente local.
app.post('/api/_teste-aprovar/:id', async (req, res) => {
  if (process.env.ALLOW_TEST_APPROVE !== '1') return res.sendStatus(404);
  await marcarPago(req.params.id);
  res.json({ ok: true });
});

// diagnóstico rápido: diz se o app está usando o MySQL ou caiu pra memória
app.get('/api/health', async (req, res) => {
  let tabelas = 0;
  if (pool) { try { const [r] = await pool.query('SHOW TABLES'); tabelas = r.length; } catch { /* */ } }
  // resposta pública mínima (não expõe usuário/host/erro do banco)
  res.json({ ok: true, db: pool ? 'mysql' : 'memoria', tabelas });
});

// ── Rastreamento (analytics) ──────────────────────────────────────────────────
app.post('/api/track', async (req, res) => {
  try {
    const { tipo, visitante, dados } = req.body || {};
    if (!tipo) return res.sendStatus(204);
    let userId = null;
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) { try { userId = jwt.verify(h.slice(7), JWT_SECRET).sub; } catch { /* anônimo */ } }
    await logEvento(tipo, { visitante, userId, dados, ua: req.headers['user-agent'] });
  } catch { /* ignora */ }
  res.sendStatus(204);
});

// ── Admin (somente o e-mail dono) ─────────────────────────────────────────────
function exigirAdmin(req, res, next) {
  exigirAuth(req, res, () => {
    if (normEmail(req.usuario.email) !== ADMIN_EMAIL) return res.status(403).json({ erro: 'acesso restrito' });
    next();
  });
}

async function ultimoCurriculoSnap(userId) {
  if (pool) { const [r] = await pool.query('SELECT snapshot FROM curriculos WHERE user_id=? ORDER BY atualizado_em DESC LIMIT 1', [userId]); return r[0]?.snapshot || null; }
  let achado = null;
  for (const c of memCurriculos.values()) if (c.user_id === userId && (!achado || c.atualizado_em > achado.atualizado_em)) achado = c;
  return achado?.snapshot || null;
}

app.get('/api/admin/resumo', exigirAdmin, async (req, res) => {
  try {
    const ontem = Date.now() - 24 * 3600 * 1000;
    let visitantes = 0, pageviews = 0, cadastros = 0, assinantes = 0, pv24 = 0;
    const porTipo = {};
    if (pool) {
      const [r1] = await pool.query('SELECT COUNT(DISTINCT visitante) c FROM eventos WHERE visitante IS NOT NULL'); visitantes = Number(r1[0]?.c || 0);
      const [r2] = await pool.query("SELECT COUNT(*) c FROM eventos WHERE tipo='pageview'"); pageviews = Number(r2[0]?.c || 0);
      const [r3] = await pool.query('SELECT COUNT(*) c FROM usuarios'); cadastros = Number(r3[0]?.c || 0);
      const [r4] = await pool.query("SELECT COUNT(*) c FROM usuarios WHERE plano='pro'"); assinantes = Number(r4[0]?.c || 0);
      const [r5] = await pool.query("SELECT COUNT(*) c FROM eventos WHERE tipo='pageview' AND criado_em>?", [ontem]); pv24 = Number(r5[0]?.c || 0);
      const [t] = await pool.query('SELECT tipo, COUNT(*) c FROM eventos GROUP BY tipo'); t.forEach((row) => { porTipo[row.tipo] = Number(row.c); });
    } else {
      visitantes = new Set(memEventos.filter((e) => e.visitante).map((e) => e.visitante)).size;
      pageviews = memEventos.filter((e) => e.tipo === 'pageview').length;
      cadastros = memUsers.size;
      assinantes = [...memUsers.values()].filter((u) => u.plano === 'pro').length;
      pv24 = memEventos.filter((e) => e.tipo === 'pageview' && e.criado_em > ontem).length;
      memEventos.forEach((e) => { porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1; });
    }
    res.json({ visitantes, pageviews, pv24, cadastros, assinantes, porTipo });
  } catch (e) { console.error('admin resumo', e); res.status(500).json({ erro: 'falha' }); }
});

app.get('/api/admin/usuarios', exigirAdmin, async (req, res) => {
  try {
    let users;
    if (pool) { const [r] = await pool.query('SELECT id,nome,email,plano,google_id,criado_em FROM usuarios ORDER BY criado_em DESC LIMIT 500'); users = r; }
    else users = [...memUsers.values()].map((u) => ({ id: u.id, nome: u.nome, email: u.email, plano: u.plano, google_id: u.google_id, criado_em: u.criado_em })).sort((a, b) => b.criado_em - a.criado_em);
    for (const u of users) {
      u.google = !!u.google_id; delete u.google_id;
      const snap = await ultimoCurriculoSnap(u.id);
      if (snap) { try { const d = JSON.parse(snap).data || {}; u.telefone = d.telefone || ''; } catch { u.telefone = ''; } }
      else u.telefone = '';
    }
    res.json({ usuarios: users });
  } catch (e) { console.error('admin usuarios', e); res.status(500).json({ erro: 'falha' }); }
});

app.get('/api/admin/eventos', exigirAdmin, async (req, res) => {
  try {
    const limit = Math.min(200, Number(req.query.limit) || 60);
    let evs;
    if (pool) { const [r] = await pool.query('SELECT tipo,visitante,user_id,dados,criado_em FROM eventos ORDER BY id DESC LIMIT ?', [limit]); evs = r; }
    else evs = memEventos.slice(-limit).reverse();
    res.json({ eventos: evs });
  } catch (e) { console.error('admin eventos', e); res.status(500).json({ erro: 'falha' }); }
});

// ── Front (SPA) ───────────────────────────────────────────────────────────────
const DIST = path.join(__dirname, 'dist');
app.use(express.static(DIST));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ erro: 'rota não encontrada' });
  res.sendFile(path.join(DIST, 'index.html'));
});

// sobe o servidor IMEDIATAMENTE (não espera o banco) para evitar 503
app.listen(PORT, '0.0.0.0', () => console.log(`Curriculou rodando na porta ${PORT}`));
// inicializa o banco em segundo plano
initDb().catch((e) => console.error('initDb', e));
