// ── Tipos e utilidades compartilhadas entre os modelos de currículo ──────────
import type { CurriculoData } from '../types';

export interface TemplateOpts {
  foto?: string; // dataURL opcional
}

export interface TemplateDef {
  id: string;
  nome: string;
  descricao: string;
  temFoto: boolean;
  css: string;
  render: (data: CurriculoData, opts?: TemplateOpts) => string; // HTML do <body>
}

export function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escMulti(s: string): string {
  return esc(s).replace(/\n/g, '<br/>');
}

export function periodo(inicio: string, fim: string, atual: boolean): string {
  const f = atual ? 'Atual' : esc(fim);
  if (!inicio && !f) return '';
  return `${esc(inicio)}${inicio || f ? ' – ' : ''}${f}`;
}

export function cidadeUF(d: CurriculoData): string {
  return [d.cidade, d.estado].filter(Boolean).join(' - ');
}

export function enderecoCompleto(d: CurriculoData): string {
  const linha1 = [d.endereco, d.numero].filter(Boolean).join(', ');
  const partes = [linha1, d.complemento, d.bairro, cidadeUF(d), d.cep].filter(Boolean);
  return partes.join(' • ');
}

/** Lista de contatos prontos (label + valor) para cabeçalhos. */
export function contatos(d: CurriculoData): Array<{ icon: string; valor: string }> {
  const out: Array<{ icon: string; valor: string }> = [];
  if (d.telefone) out.push({ icon: ICON.phone, valor: d.telefone });
  if (d.email) out.push({ icon: ICON.mail, valor: d.email });
  const end = enderecoCompleto(d) || cidadeUF(d);
  if (end) out.push({ icon: ICON.pin, valor: end });
  return out;
}

// ── Ícones SVG (currentColor, traço fino) ─────────────────────────────────────
const svg = (p: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

export const ICON = {
  phone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
  pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  cake: svg('<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s1-1 3-1 3 2 5 2 3-2 5-2 3 1 3 1"/><path d="M2 21h20"/><path d="M7 8v3M12 8v3M17 8v3"/>'),
  ring: svg('<circle cx="12" cy="14" r="6"/><path d="m9 8 1.5-4h3L15 8"/>'),
  flag: svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22V4"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  briefcase: svg('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>'),
  cap: svg('<path d="m22 9-10-4L2 9l10 4 10-4z"/><path d="M6 10.5V16c0 1 2.5 3 6 3s6-2 6-3v-5.5"/>'),
  star: svg('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'),
  book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
};

/** Monta o documento HTML completo para impressão/preview. */
export function documentoCompleto(tpl: TemplateDef, data: CurriculoData, opts?: TemplateOpts): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Currículo - ${esc(data.nome || 'Curriculou')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700;800&family=Lora:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  svg { width: 1em; height: 1em; display: inline-block; vertical-align: -0.12em; }
  ${tpl.css}
</style></head><body>${tpl.render(data, opts)}</body></html>`;
}

// ── Dados de amostra (para thumbnails dos modelos) ────────────────────────────
export const AMOSTRA: CurriculoData = {
  nome: 'Mariana Oliveira Costa',
  dataNascimento: '15/08/1996',
  idade: '29',
  estadoCivil: 'Solteira',
  nacionalidade: 'Brasileira',
  telefone: '(11) 98765-4321',
  email: 'mariana.costa@email.com',
  cep: '01310-000',
  endereco: 'Av. Paulista',
  numero: '1500',
  complemento: '',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  linkedin: 'linkedin.com/in/mariana',
  perfilProfissional:
    'Profissional com experiência em 2 empresas na função de analista administrativa, com foco na área administrativa. Tem como pontos fortes organização, comunicação e atendimento ao cliente. Formação: Ensino Superior Completo.',
  objetivo: 'Analista Administrativa',
  area: 'Administrativa',
  experiencias: [
    { id: 'a', empresa: 'Tech Solutions Ltda', cargo: 'Analista Administrativa', inicio: '03/2021', fim: '', atual: true, atividades: 'Organização de documentos, atendimento interno e suporte às rotinas administrativas.' },
    { id: 'b', empresa: 'Comercial Aurora', cargo: 'Auxiliar Administrativo', inicio: '01/2019', fim: '02/2021', atual: false, atividades: 'Controle de planilhas, emissão de notas e apoio ao setor financeiro.' },
  ],
  formacoes: [
    { id: 'c', escolaridade: 'Ensino Superior Completo', curso: 'Administração', instituicao: 'Universidade de São Paulo', anoConclusao: '2019' },
  ],
  outrasInfoEscolaridade: '',
  cursos: [
    { id: 'd', nome: 'Excel Avançado', instituicao: 'Senac', cargaHoraria: '40h' },
    { id: 'e', nome: 'Inglês Intermediário', instituicao: 'CCAA', cargaHoraria: '' },
  ],
  habilidades: ['Organização', 'Comunicação', 'Atendimento ao Cliente', 'Excel', 'Trabalho em Equipe'],
  idiomas: ['Inglês - Intermediário', 'Espanhol - Básico'],
  qualificacoes: 'Disponibilidade para início imediato e para trabalhar em equipe. Possui CNH categoria B.',
};
