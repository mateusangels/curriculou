// ── Configuração de design e seções do editor de currículo ───────────────────

export type LayoutTipo = 'dual' | 'single' | 'topo';
export type FonteKey = 'inter' | 'source' | 'lora' | 'georgia';
export type BordaCabecalho = 'line' | 'none';

export interface DesignConfig {
  layout: LayoutTipo;
  sidebarLado: 'left' | 'right';
  font: FonteKey;
  accent: string; // cor de destaque (títulos, links)
  sidebarBg: string; // cor de preenchimento lateral (layout dual/topo)
  bgColor: string; // cor de fundo da folha
  fontSizePt: number; // 8–12
  nameScale: number; // 1.5–3.5
  fotoTamanho?: number; // diâmetro da foto em px (padrão 116)
  headerAlign?: 'left' | 'center'; // alinhamento do nome/contato (layout single)
  headerBorder: BordaCabecalho;
  contactIcons: boolean;
  bulletIndent: boolean;
}

export type SectionKey =
  | 'foto' | 'cargo' | 'contato' | 'dadosPessoais'
  | 'perfil' | 'experiencia' | 'educacao'
  | 'habilidades' | 'cursos' | 'idiomas' | 'qualificacoes';

export interface SectionDef {
  key: SectionKey;
  label: string;
  fixaSidebar?: boolean; // sempre na lateral no layout dual
}

// Ordem/labels das seções gerenciáveis (v1 — essenciais)
export const SECOES: SectionDef[] = [
  { key: 'foto', label: 'Foto de Perfil', fixaSidebar: true },
  { key: 'cargo', label: 'Cargo' },
  { key: 'contato', label: 'Contato', fixaSidebar: true },
  { key: 'dadosPessoais', label: 'Dados Pessoais', fixaSidebar: true },
  { key: 'perfil', label: 'Perfil' },
  { key: 'experiencia', label: 'Experiência Profissional' },
  { key: 'educacao', label: 'Educação' },
  { key: 'habilidades', label: 'Habilidades', fixaSidebar: true },
  { key: 'idiomas', label: 'Idiomas', fixaSidebar: true },
  { key: 'cursos', label: 'Cursos e Certificações', fixaSidebar: true },
  { key: 'qualificacoes', label: 'Qualificações e Inf. Adicionais' },
];

export type SectionsConfig = Record<SectionKey, boolean>;

export const SECOES_PADRAO: SectionsConfig = {
  foto: true, cargo: true, contato: true, dadosPessoais: true,
  perfil: true, experiencia: true, educacao: true,
  habilidades: true, cursos: true, idiomas: true, qualificacoes: true,
};
