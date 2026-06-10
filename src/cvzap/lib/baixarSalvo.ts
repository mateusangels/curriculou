// ── Baixa o currículo salvo no navegador (usado ao voltar do pagamento) ──────
import { gerarCurriculoPDF } from './gerarCurriculoPDF';
import { curriculoVazio } from '../types';
import { DESIGN_PADRAO } from '../design/presets';
import { SECOES_PADRAO } from '../design/types';

function ler<T>(chave: string, fallback: T): T {
  try { const r = localStorage.getItem(chave); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}

export function baixarCurriculoSalvo() {
  const estado = ler<{ data?: unknown }>('cvzap:estado:v1', {});
  const data = { ...curriculoVazio(), ...((estado.data as object) || {}) };
  const design = ler('cvzap:design:v2', DESIGN_PADRAO);
  const sections = ler('cvzap:sections:v2', SECOES_PADRAO);
  const foto = localStorage.getItem('cvzap:foto:v1') || undefined;
  gerarCurriculoPDF(data as never, design, sections, { foto });
}
