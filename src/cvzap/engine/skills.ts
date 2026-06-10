// ── Sugestão de habilidades com base no cargo/área/atividades informados ─────

import type { CurriculoData } from '../types';

const MAPA: Array<{ termos: RegExp; sugestoes: string[] }> = [
  { termos: /vend|comercial|loja|varejo|atendente|caixa/i, sugestoes: ['Atendimento ao cliente', 'Vendas', 'Negociação', 'Comunicação'] },
  { termos: /atend|recep|sac|call|telemarketing/i, sugestoes: ['Atendimento ao cliente', 'Comunicação', 'Organização', 'Trabalho em equipe'] },
  { termos: /admin|escrit|secret|auxiliar administrativo/i, sugestoes: ['Excel', 'Word', 'Organização', 'Rotinas administrativas'] },
  { termos: /financ|contab|fiscal|cobran/i, sugestoes: ['Excel', 'Controle financeiro', 'Atenção a detalhes', 'Organização'] },
  { termos: /motor|entreg|logist|estoqu|almox/i, sugestoes: ['Organização', 'Gestão de estoque', 'Pontualidade', 'Trabalho em equipe'] },
  { termos: /cozin|garç|garc|restaur|bar|aux de cozinha|chapeiro/i, sugestoes: ['Atendimento ao cliente', 'Trabalho em equipe', 'Agilidade', 'Higiene e organização'] },
  { termos: /limpez|servic|zelad|domest/i, sugestoes: ['Organização', 'Comprometimento', 'Trabalho em equipe', 'Atenção a detalhes'] },
  { termos: /program|desenvolv|software|ti\b|sistemas|suporte tecnico/i, sugestoes: ['Lógica de programação', 'Resolução de problemas', 'Trabalho em equipe', 'Inglês técnico'] },
  { termos: /profess|educ|monitor|pedagog/i, sugestoes: ['Comunicação', 'Didática', 'Organização', 'Paciência'] },
  { termos: /saude|enferm|cuidador|tecnico de enfermagem/i, sugestoes: ['Empatia', 'Trabalho em equipe', 'Organização', 'Atenção a detalhes'] },
  { termos: /produc|operad|fabric|industr|montag/i, sugestoes: ['Trabalho em equipe', 'Atenção a detalhes', 'Agilidade', 'Comprometimento'] },
  { termos: /market|social media|design|publicid/i, sugestoes: ['Comunicação', 'Criatividade', 'Pacote Office', 'Organização'] },
];

const PADRAO = ['Comunicação', 'Trabalho em equipe', 'Organização', 'Proatividade'];

export function sugerirHabilidades(data: CurriculoData): string[] {
  const base = [
    data.objetivo,
    data.area,
    ...data.experiencias.map((e) => `${e.cargo} ${e.atividades}`),
  ]
    .join(' ')
    .toLowerCase();

  const set = new Set<string>();
  for (const { termos, sugestoes } of MAPA) {
    if (termos.test(base)) sugestoes.forEach((s) => set.add(s));
  }
  if (set.size === 0) PADRAO.forEach((s) => set.add(s));

  // remove o que o usuário já listou
  const jaTem = new Set(data.habilidades.map((h) => h.toLowerCase()));
  return [...set].filter((s) => !jaTem.has(s.toLowerCase())).slice(0, 6);
}
