// ── Rastreamento de eventos (analytics próprio) ──────────────────────────────
import { API_URL } from './pagamento';

export const ADMIN_EMAIL = 'angelsrequires@gmail.com';

const VID_KEY = 'curriculou:vid';

function vid(): string {
  try {
    let v = localStorage.getItem(VID_KEY);
    if (!v) { v = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(VID_KEY, v); }
    return v;
  } catch { return 'v_anon'; }
}

/** Registra um evento (não bloqueia a UI; falha em silêncio). */
export function track(tipo: string, dados?: string) {
  try {
    let tok: string | null = null;
    try { tok = localStorage.getItem('curriculou:token'); } catch { /* */ }
    fetch(`${API_URL}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
      body: JSON.stringify({ tipo, visitante: vid(), dados }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* ignora */ }
}
