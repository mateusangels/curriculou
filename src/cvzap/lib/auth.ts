// ── Autenticação (contas Curriculou) ─────────────────────────────────────────
import { API_URL } from './pagamento';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  plano: 'free' | 'pro' | string;
}

const TOKEN_KEY = 'curriculou:token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(t: string) { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* */ } }
export function logout() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* */ } }

async function postAuth(rota: string, body: unknown): Promise<{ token: string; usuario: Usuario }> {
  const r = await fetch(`${API_URL}/api/auth/${rota}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.erro || 'Falha na autenticação');
  setToken(data.token);
  return data;
}

export const registrar = (nome: string, email: string, senha: string) => postAuth('registrar', { nome, email, senha });
export const login = (email: string, senha: string) => postAuth('login', { email, senha });

/** Login com Google: abre o popup do Firebase, manda o token ao backend e recebe o nosso JWT. */
export async function loginComGoogle(): Promise<{ token: string; usuario: Usuario }> {
  const { loginGooglePopup } = await import('./firebase'); // carrega o SDK só quando precisa
  const idToken = await loginGooglePopup();
  return postAuth('google', { idToken });
}

/** Retorna o usuário logado (valida o token no servidor) ou null. */
export async function me(): Promise<Usuario | null> {
  const tok = getToken();
  if (!tok) return null;
  try {
    const r = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${tok}` } });
    if (!r.ok) { if (r.status === 401) logout(); return null; }
    const { usuario } = await r.json();
    return usuario as Usuario;
  } catch {
    return null;
  }
}
