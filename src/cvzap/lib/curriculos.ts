// ── Histórico de currículos (por usuário logado) ─────────────────────────────
import { API_URL } from './pagamento';
import { getToken } from './auth';
import type { CvSnapshot } from './snapshot';

export interface CurriculoResumo {
  id: string;
  titulo: string;
  atualizado_em: number;
}

function auth() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function listarCurriculos(): Promise<CurriculoResumo[]> {
  const r = await fetch(`${API_URL}/api/curriculos`, { headers: { ...auth() } });
  if (!r.ok) return [];
  const { curriculos } = await r.json();
  return curriculos || [];
}

/** Salva (cria ou atualiza, se `id` for passado). Retorna o id salvo. */
export async function salvarCurriculo(titulo: string, snapshot: CvSnapshot, id?: string): Promise<string> {
  const r = await fetch(`${API_URL}/api/curriculos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ titulo, snapshot, id }),
  });
  if (!r.ok) throw new Error('Falha ao salvar currículo');
  const { id: salvoId } = await r.json();
  return salvoId;
}

export async function obterCurriculo(id: string): Promise<{ id: string; titulo: string; snapshot: CvSnapshot } | null> {
  const r = await fetch(`${API_URL}/api/curriculos/${id}`, { headers: { ...auth() } });
  if (!r.ok) return null;
  return r.json();
}

export async function excluirCurriculo(id: string): Promise<void> {
  await fetch(`${API_URL}/api/curriculos/${id}`, { method: 'DELETE', headers: { ...auth() } });
}
