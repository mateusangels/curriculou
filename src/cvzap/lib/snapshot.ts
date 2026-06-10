// ── Snapshot do currículo ────────────────────────────────────────────────────
// Reúne tudo que define o currículo (dados, design, seções, foto) num único
// objeto. Usado para ENVIAR ao servidor no momento do pagamento, de modo que o
// cliente consiga RECUPERAR e baixar de novo mesmo que troque de aparelho ou
// limpe o navegador.
import { gerarCurriculoPDF } from './gerarCurriculoPDF';
import { curriculoVazio } from '../types';
import { DESIGN_PADRAO } from '../design/presets';
import { SECOES_PADRAO } from '../design/types';
import type { CurriculoData } from '../types';
import type { DesignConfig, SectionsConfig } from '../design/types';

export interface CvSnapshot {
  data: CurriculoData;
  design: DesignConfig;
  sections: SectionsConfig;
  foto?: string;
}

function ler<T>(chave: string, fallback: T): T {
  try { const r = localStorage.getItem(chave); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}

/** Reúne o currículo atual do navegador num único objeto. */
export function coletarSnapshot(): CvSnapshot {
  const estado = ler<{ data?: unknown }>('cvzap:estado:v1', {});
  const data = { ...curriculoVazio(), ...((estado.data as object) || {}) } as CurriculoData;
  const design = ler('cvzap:design:v2', DESIGN_PADRAO) as DesignConfig;
  const sections = ler('cvzap:sections:v2', SECOES_PADRAO) as SectionsConfig;
  const foto = localStorage.getItem('cvzap:foto:v1') || undefined;
  return { data, design, sections, foto };
}

/** Gera o PDF a partir de um snapshot (do navegador ou vindo do servidor). */
export function baixarDeSnapshot(snap: CvSnapshot) {
  const data = { ...curriculoVazio(), ...(snap.data || {}) } as CurriculoData;
  gerarCurriculoPDF(data, snap.design || DESIGN_PADRAO, snap.sections || SECOES_PADRAO, { foto: snap.foto });
}

/** Carrega um snapshot no navegador (para abrir um currículo salvo no editor). */
export function aplicarSnapshot(snap: CvSnapshot) {
  try {
    localStorage.setItem('cvzap:estado:v1', JSON.stringify({ messages: [], data: snap.data || {}, contador: 0 }));
    localStorage.setItem('cvzap:design:v2', JSON.stringify(snap.design || DESIGN_PADRAO));
    localStorage.setItem('cvzap:sections:v2', JSON.stringify(snap.sections || SECOES_PADRAO));
    if (snap.foto) localStorage.setItem('cvzap:foto:v1', snap.foto);
    else localStorage.removeItem('cvzap:foto:v1');
  } catch { /* quota */ }
}
