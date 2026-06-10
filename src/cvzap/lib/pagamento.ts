// ── Pagamento (Mercado Pago) ─────────────────────────────────────────────────
// IMPORTANTE: no modo local isto é um MOCK. O pagamento real do Mercado Pago
// exige um BACKEND, porque o Access Token é secreto e não pode ficar no
// app/navegador. Quando o backend existir, substitua `cobrar()` por uma chamada
// que cria uma "preferência" no MP (Checkout Pro) e abre a URL de pagamento:
//
//   const r = await fetch('/api/mp/criar-preferencia', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ titulo, valor }),
//   });
//   const { init_point } = await r.json();
//   window.location.href = init_point; // redireciona pro Checkout Pro
//
// e o sucesso passa a ser tratado pela URL de retorno (back_urls/webhook).

import { coletarSnapshot, type CvSnapshot } from './snapshot';

// ── Planos ───────────────────────────────────────────────────────────────────
export const PRECO_INDIVIDUAL = 4.9;  // 1 download, sem marca d'água, foto, ATS
export const PRECO_PRO_MES = 14.9;    // Profissional (assinatura mensal)
export const PRECO_RETENCAO = 7.9;    // oferta de retenção (cancelamento)

export type Plano = 'individual' | 'retencao';

export function formatarBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface ResultadoPagamento {
  ok: boolean;
  valor: number;
}

/**
 * MOCK de cobrança. Simula o processamento e sempre aprova.
 * Usado enquanto não há backend (modo local).
 */
export function cobrar(titulo: string, valor: number): Promise<ResultadoPagamento> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ok: true, valor }), 1400);
  });
}

// ── INTEGRAÇÃO REAL (quando o backend estiver no ar) ──────────────────────────
// Defina VITE_API_URL no .env do frontend apontando para o backend Hostinger.
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';

// Código do último pedido criado neste navegador — usado para recuperar o
// currículo depois ("Já paguei, quero baixar de novo").
export const ULTIMO_PEDIDO_KEY = 'curriculou:ultimoPedido';

/** Cria a preferência no backend e redireciona para o Checkout Pro do Mercado Pago. */
export async function iniciarCheckout(plano: Plano = 'individual'): Promise<void> {
  // envia o currículo junto para que ele fique guardado no servidor e possa ser
  // recuperado mesmo que o cliente troque de aparelho ou limpe o navegador.
  const snapshot = coletarSnapshot();
  const r = await fetch(`${API_URL}/api/criar-pagamento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plano, snapshot }),
  });
  if (!r.ok) throw new Error('backend indisponível');
  const { id, init_point } = await r.json();
  if (!init_point) throw new Error('sem init_point');
  try { localStorage.setItem(ULTIMO_PEDIDO_KEY, id); } catch { /* quota */ }
  sessionStorage.setItem('curriculou:pedido', id); // guarda p/ conferir ao voltar
  window.location.href = init_point; // redireciona para o Mercado Pago
}

export interface PedidoResposta {
  pago: boolean;
  snapshot?: CvSnapshot;
}

/** Busca um pedido no backend: se está pago e o currículo guardado (snapshot). */
export async function buscarPedido(id: string): Promise<PedidoResposta> {
  try {
    const r = await fetch(`${API_URL}/api/pedido/${encodeURIComponent(id)}`);
    if (!r.ok) return { pago: false };
    return await r.json();
  } catch {
    return { pago: false };
  }
}

/** Consulta no backend se o pedido foi pago (chamar ao voltar do checkout). */
export async function verificarPago(id: string): Promise<boolean> {
  return (await buscarPedido(id)).pago;
}
