// ── Modelos (presets de design) ──────────────────────────────────────────────
import type { DesignConfig } from './types';

export interface Modelo {
  id: string;
  nome: string;
  categoria: 'Criativo' | 'Moderno' | 'Minimalista' | 'Simples' | 'ATS';
  design: DesignConfig;
}

const base: DesignConfig = {
  layout: 'dual',
  sidebarLado: 'left',
  font: 'inter',
  accent: '#2563a8',
  sidebarBg: '#f1f3f5',
  bgColor: '#ffffff',
  fontSizePt: 10,
  nameScale: 2.6,
  headerBorder: 'line',
  contactIcons: true,
  bulletIndent: true,
};

export const MODELOS: Modelo[] = [
  // ── dual com sidebar à ESQUERDA ──────────────────────────────────────────
  { id: 'aura', nome: 'Aura', categoria: 'Criativo', design: { ...base, sidebarBg: '#0e6e5c', accent: '#0e6e5c' } },
  { id: 'crest', nome: 'Crest', categoria: 'Moderno', design: { ...base, sidebarBg: '#f1f3f5', accent: '#1f3a5f' } },
  { id: 'azur', nome: 'Azur', categoria: 'Moderno', design: { ...base, sidebarBg: '#1d4e89', accent: '#1d4e89' } },
  { id: 'ametista', nome: 'Ametista', categoria: 'Criativo', design: { ...base, sidebarBg: '#5b21b6', accent: '#6d28d9' } },
  // ── dual com sidebar à DIREITA ───────────────────────────────────────────
  { id: 'grafite', nome: 'Grafite', categoria: 'Moderno', design: { ...base, sidebarLado: 'right', sidebarBg: '#2b2f38', accent: '#2b2f38' } },
  { id: 'verde-claro', nome: 'Sálvia', categoria: 'Criativo', design: { ...base, sidebarLado: 'right', sidebarBg: '#e7f0ec', accent: '#0e8a73' } },
  { id: 'rose', nome: 'Rosé', categoria: 'Criativo', design: { ...base, sidebarLado: 'right', sidebarBg: '#fce7f3', accent: '#be185d' } },
  // ── faixa no TOPO (header colorido) ──────────────────────────────────────
  { id: 'coral', nome: 'Coral', categoria: 'Criativo', design: { ...base, layout: 'topo', sidebarBg: '#c0392b', accent: '#c0392b' } },
  { id: 'oceano', nome: 'Oceano', categoria: 'Moderno', design: { ...base, layout: 'topo', sidebarBg: '#0b6e99', accent: '#0b6e99' } },
  { id: 'petroleo', nome: 'Petróleo', categoria: 'Moderno', design: { ...base, layout: 'topo', sidebarBg: '#0f3d3e', accent: '#0f766e' } },
  { id: 'esmeralda', nome: 'Esmeralda', categoria: 'Moderno', design: { ...base, layout: 'topo', sidebarBg: '#065f46', accent: '#059669' } },
  { id: 'vinho', nome: 'Bordô', categoria: 'Criativo', design: { ...base, layout: 'topo', sidebarBg: '#7d1f3a', accent: '#7d1f3a' } },
  // ── coluna única, cabeçalho à ESQUERDA ───────────────────────────────────
  { id: 'executivo', nome: 'Executivo', categoria: 'Simples', design: { ...base, layout: 'single', font: 'lora', accent: '#1f3a5f', headerBorder: 'line' } },
  { id: 'ats', nome: 'ATS Simples', categoria: 'ATS', design: { ...base, layout: 'single', font: 'georgia', accent: '#222222', headerBorder: 'line', contactIcons: false } },
  { id: 'classico', nome: 'Clássico', categoria: 'Simples', design: { ...base, layout: 'single', font: 'georgia', accent: '#1f3a5f' } },
  // ── coluna única, cabeçalho CENTRALIZADO ─────────────────────────────────
  { id: 'minimal', nome: 'Minimalista', categoria: 'Minimalista', design: { ...base, layout: 'single', headerAlign: 'center', accent: '#0f766e', headerBorder: 'none', contactIcons: false } },
  { id: 'ambar', nome: 'Âmbar', categoria: 'Criativo', design: { ...base, layout: 'single', headerAlign: 'center', font: 'lora', accent: '#b45309', headerBorder: 'none' } },
  { id: 'carvao', nome: 'Carvão', categoria: 'Minimalista', design: { ...base, layout: 'single', headerAlign: 'center', accent: '#111827', headerBorder: 'none', contactIcons: false } },
];

export const DESIGN_PADRAO: DesignConfig = MODELOS[2].design; // Azur

export const CATEGORIAS = ['Todos', 'Criativo', 'Moderno', 'Minimalista', 'Simples', 'ATS'] as const;

export const FONTES: Array<{ key: DesignConfig['font']; nome: string; css: string }> = [
  { key: 'inter', nome: 'Inter', css: "'Inter', system-ui, sans-serif" },
  { key: 'source', nome: 'Source Sans 3', css: "'Source Sans 3', 'Inter', sans-serif" },
  { key: 'lora', nome: 'Lora (serifada)', css: "'Lora', Georgia, serif" },
  { key: 'georgia', nome: 'Georgia (serifada)', css: 'Georgia, "Times New Roman", serif' },
];

export const CORES_DESTAQUE = ['#1d4e89', '#2563a8', '#0e6e5c', '#0e8a73', '#7d1f3a', '#c0392b', '#2b2f38', '#6d28d9', '#b45309', '#222222'];
export const CORES_SIDEBAR = ['#f1f3f5', '#1d4e89', '#0e6e5c', '#2b2f38', '#7d1f3a', '#e7f0ec', '#fdeeee', '#eef2ff', '#fff7ed', '#ffffff'];
