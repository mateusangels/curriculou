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
  { id: 'aura', nome: 'Aura', categoria: 'Criativo', design: { ...base, sidebarBg: '#0e6e5c', accent: '#0e6e5c' } },
  { id: 'crest', nome: 'Crest', categoria: 'Moderno', design: { ...base, sidebarBg: '#f1f3f5', accent: '#1f3a5f' } },
  { id: 'azur', nome: 'Azur', categoria: 'Moderno', design: { ...base, sidebarBg: '#1d4e89', accent: '#1d4e89' } },
  { id: 'grafite', nome: 'Grafite', categoria: 'Moderno', design: { ...base, sidebarBg: '#2b2f38', accent: '#2b2f38' } },
  { id: 'vinho', nome: 'Bordô', categoria: 'Criativo', design: { ...base, sidebarBg: '#7d1f3a', accent: '#7d1f3a' } },
  { id: 'executivo', nome: 'Executivo', categoria: 'Simples', design: { ...base, layout: 'single', font: 'lora', accent: '#1f3a5f', headerBorder: 'line' } },
  { id: 'minimal', nome: 'Minimalista', categoria: 'Minimalista', design: { ...base, layout: 'single', accent: '#0f766e', headerBorder: 'none', contactIcons: false } },
  { id: 'ats', nome: 'ATS Simples', categoria: 'ATS', design: { ...base, layout: 'single', font: 'georgia', accent: '#222222', headerBorder: 'line', contactIcons: false } },
  { id: 'verde-claro', nome: 'Sálvia', categoria: 'Criativo', design: { ...base, sidebarBg: '#e7f0ec', accent: '#0e8a73' } },
  { id: 'coral', nome: 'Coral', categoria: 'Criativo', design: { ...base, sidebarBg: '#fdeeee', accent: '#c0392b' } },
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
