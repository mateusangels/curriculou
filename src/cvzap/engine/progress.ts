// ── Cálculo de progresso por seção do currículo ──────────────────────────────

import type { CurriculoData, SecaoProgresso } from '../types';

function pct(preenchidos: number, total: number): number {
  return Math.round((preenchidos / total) * 100);
}

export function calcularProgresso(data: CurriculoData): SecaoProgresso[] {
  // Dados pessoais (6 campos essenciais)
  const pessoais = [data.nome, data.idade || data.dataNascimento, data.cidade, data.estado, data.telefone, data.email];
  const pessoaisPct = pct(pessoais.filter(Boolean).length, pessoais.length);

  // Objetivo (2 campos)
  const objetivo = [data.objetivo, data.area];
  const objetivoPct = pct(objetivo.filter(Boolean).length, objetivo.length);

  // Experiência — completa quando há pelo menos uma bem preenchida
  const expPct = data.experiencias.length === 0
    ? 0
    : Math.min(100, Math.round(
        data.experiencias.reduce((acc, e) => {
          const campos = [e.empresa, e.cargo, e.inicio, e.atual || e.fim, e.atividades];
          return acc + pct(campos.filter(Boolean).length, campos.length);
        }, 0) / data.experiencias.length
      ));

  // Formação
  const formPct = data.formacoes.length === 0
    ? 0
    : Math.min(100, Math.round(
        data.formacoes.reduce((acc, f) => {
          const campos = [f.escolaridade, f.curso || f.instituicao, f.anoConclusao];
          return acc + pct(campos.filter(Boolean).length, campos.length);
        }, 0) / data.formacoes.length
      ));

  // Habilidades — 100% com 3 ou mais
  const habPct = Math.min(100, Math.round((data.habilidades.length / 3) * 100));

  return [
    { label: 'Dados pessoais', pct: pessoaisPct },
    { label: 'Objetivo', pct: objetivoPct },
    { label: 'Experiência', pct: expPct },
    { label: 'Formação', pct: formPct },
    { label: 'Habilidades', pct: habPct },
  ];
}

export function progressoTotal(secoes: SecaoProgresso[]): number {
  if (!secoes.length) return 0;
  return Math.round(secoes.reduce((a, s) => a + s.pct, 0) / secoes.length);
}
