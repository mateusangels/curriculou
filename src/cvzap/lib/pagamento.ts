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

export const PRECO_COM_FOTO = 4.0;
export const PRECO_SEM_FOTO = 3.5;
export const PRECO_PROMO = 2.9; // oferta exibida ao tentar cancelar

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

/** Cria a preferência no backend e redireciona para o Checkout Pro do Mercado Pago. */
export async function iniciarCheckout(comFoto: boolean, promo = false): Promise<void> {
  const r = await fetch(`${API_URL}/api/criar-pagamento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comFoto, promo }),
  });
  if (!r.ok) throw new Error('backend indisponível');
  const { id, init_point } = await r.json();
  if (!init_point) throw new Error('sem init_point');
  sessionStorage.setItem('curriculou:pedido', id); // guarda p/ conferir ao voltar
  window.location.href = init_point; // redireciona para o Mercado Pago
}

/** Consulta no backend se o pedido foi pago (chamar ao voltar do checkout). */
export async function verificarPago(id: string): Promise<boolean> {
  try {
    const r = await fetch(`${API_URL}/api/status/${id}`);
    const { pago } = await r.json();
    return !!pago;
  } catch {
    return false;
  }
}
