// ── Resolve a configuração de design em valores de estilo concretos ──────────
import type { DesignConfig } from './types';
import { FONTES } from './presets';

function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function corClara(hex: string): boolean {
  return luminancia(hex) > 0.6;
}

export interface DesignResolvido {
  fontCss: string;
  basePx: number;
  namePx: number;
  accent: string;
  sidebarBg: string;
  bgColor: string;
  sidebarText: string;
  sidebarMuted: string;
  sidebarBorder: string;
  sidebarTitle: string;
  mainText: string;
  mainMuted: string;
  sectionTitle: string;
  sectionBorder: string;
  headerBorder: boolean;
  contactIcons: boolean;
  bulletIndent: boolean;
  layout: DesignConfig['layout'];
}

export function resolveDesign(d: DesignConfig): DesignResolvido {
  const fontCss = (FONTES.find((f) => f.key === d.font) || FONTES[0]).css;
  const basePx = Math.round(d.fontSizePt * 1.45 * 10) / 10; // pt → px aprox.
  const sideClaro = corClara(d.sidebarBg);
  return {
    fontCss,
    basePx,
    namePx: Math.round(basePx * d.nameScale * 10) / 10,
    accent: d.accent,
    sidebarBg: d.sidebarBg,
    bgColor: d.bgColor,
    sidebarText: sideClaro ? '#2d3340' : '#ffffff',
    sidebarMuted: sideClaro ? '#5b626f' : 'rgba(255,255,255,.82)',
    sidebarBorder: sideClaro ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.28)',
    sidebarTitle: sideClaro ? d.accent : '#ffffff',
    mainText: '#2d3340',
    mainMuted: '#6a7080',
    sectionTitle: d.accent,
    sectionBorder: d.headerBorder === 'line' ? d.accent : 'transparent',
    headerBorder: d.headerBorder === 'line',
    contactIcons: d.contactIcons,
    bulletIndent: d.bulletIndent,
    layout: d.layout,
  };
}

/** CSS completo do currículo, usado tanto na folha editável quanto no PDF. */
export function buildCSS(d: DesignConfig): string {
  const r = resolveDesign(d);
  const dual = r.layout === 'dual';
  // zoom geral: escala fontes E espaçamentos de forma uniforme, mantendo a largura
  // da folha (a coluna lateral continua sangrando até a borda). Reflete no PDF.
  const s = Math.max(0.6, Math.min(1.15, d.contentScale ?? 1));
  const px = (v: number) => `${Math.round(v * s * 10) / 10}px`; // espaçamento escalável
  const base = Math.round(r.basePx * s * 10) / 10;
  const name = Math.round(r.namePx * s * 10) / 10;
  return `
  .cv-root { font-family: ${r.fontCss}; font-size: ${base}px; line-height: 1.5; color: ${r.mainText}; background: ${r.bgColor}; ${dual ? `display:flex; flex-direction:${d.sidebarLado === 'right' ? 'row-reverse' : 'row'}; min-height: 1123px;` : ''} }
  .cv-root * { box-sizing: border-box; }
  .cv-root input, .cv-root textarea { font: inherit; color: inherit; line-height: inherit; background: transparent; border: 0; outline: 0; width: 100%; padding: 0; margin: 0; resize: none; }
  .cv-root .cv-ph { color: #9aa0ac; }

  .cv-side { ${dual ? `width: 34%; background: ${r.sidebarBg}; color: ${r.sidebarText}; padding: ${px(30)} ${px(22)};` : 'display:none;'} }
  .cv-main { ${dual ? 'width: 66%;' : 'width: 100%;'} padding: ${dual ? `${px(34)} ${px(32)}` : `${px(40)} ${px(46)}`}; }

  .cv-photo { width: ${d.fotoTamanho ?? 116}px; max-width: 100%; aspect-ratio: 1 / 1; border-radius: 50%; margin: 0 auto 18px; background-size: cover; background-position: center; ${r.layout === 'dual' ? `border: 3px solid ${r.sidebarBorder};` : `border: 3px solid ${r.accent}33;`} background-color: rgba(127,127,127,.12); }
  .cv-photo-ph { display:flex; align-items:center; justify-content:center; font-weight:700; font-size: ${(d.fotoTamanho ?? 116) * 0.36}px; opacity:.65; }

  .cv-name { font-size: ${name}px; font-weight: 800; letter-spacing: -.5px; line-height: 1.05; color: #1f2430; text-transform: uppercase; }
  .cv-cargo { font-size: ${base * 1.3}px; font-weight: 600; color: ${r.accent}; margin-top: ${px(2)}; }

  .cv-side h3 { font-size: ${base * 0.95}px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${r.sidebarTitle}; margin: ${px(18)} 0 ${px(9)}; ${r.headerBorder ? `border-bottom: 1px solid ${r.sidebarBorder}; padding-bottom: ${px(5)};` : ''} }
  .cv-side h3:first-child, .cv-side .cv-photo + h3 { margin-top: 0; }
  .cv-main h2 { font-size: ${base * 1.15}px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: ${r.sectionTitle}; margin: ${dual ? px(20) : px(22)} 0 ${px(10)}; ${r.headerBorder ? `border-bottom: 2px solid ${r.sectionBorder}; padding-bottom: ${px(5)};` : ''} }
  .cv-main h2:first-child { margin-top: 0; }

  .cv-contact-row { display: flex; gap: ${px(8)}; align-items: flex-start; margin-bottom: ${px(7)}; font-size: ${base * 0.95}px; word-break: break-word; color: ${dual ? r.sidebarMuted : r.mainMuted}; }
  .cv-contact-row svg { width: 1em; height: 1em; margin-top: 2px; flex-shrink: 0; opacity: .85; }
  .cv-info { font-size: ${base * 0.95}px; margin-bottom: ${px(5)}; color: ${dual ? r.sidebarMuted : r.mainMuted}; }
  .cv-info b { color: ${dual ? r.sidebarText : r.mainText}; font-weight: 600; }

  .cv-single-contact { display: flex; flex-wrap: wrap; gap: ${px(4)} ${px(18)}; margin-top: ${px(10)}; font-size: ${base * 0.95}px; color: ${r.mainMuted}; }
  .cv-single-contact .cv-contact-row { margin-bottom: 0; }

  .cv-skill { display: flex; justify-content: space-between; align-items: center; gap: ${px(10)}; margin-bottom: ${px(7)}; font-size: ${base * 0.95}px; }
  .cv-lvl { display: inline-flex; gap: 3px; flex-shrink: 0; }
  .cv-lvl i { width: 12px; height: 6px; border-radius: 3px; background: ${dual ? (corClaraSide(d) ? '#cfd4da' : 'rgba(255,255,255,.3)') : '#dde1e7'}; display:inline-block; }
  .cv-lvl i.on { background: ${dual ? (corClaraSide(d) ? r.accent : '#fff') : r.accent}; }
  .cv-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .cv-chip { border: 1px solid ${r.accent}55; color: ${r.accent}; border-radius: 4px; padding: 2px 9px; font-size: ${base * 0.92}px; }

  .cv-item { margin-bottom: ${px(12)}; ${r.layout === 'dual' ? '' : ''} }
  .cv-item .cv-top { display: flex; justify-content: space-between; align-items: baseline; gap: ${px(10)}; }
  .cv-item .cv-role { font-weight: 700; font-size: ${base * 1.08}px; color: #222; }
  .cv-item .cv-org { font-size: ${base * 0.98}px; color: ${r.accent}; font-weight: 600; }
  .cv-item .cv-per { font-size: ${base * 0.85}px; color: ${r.mainMuted}; white-space: nowrap; font-weight: 500; }
  .cv-item .cv-desc { margin-top: ${px(3)}; color: #4a5060; ${r.bulletIndent ? 'padding-left: 14px; position: relative;' : ''} }
  ${r.bulletIndent ? `.cv-item .cv-desc::before { content: "•"; position: absolute; left: 2px; color: ${r.accent}; }` : ''}

  .cv-mini-item { margin-bottom: ${px(8)}; font-size: ${base * 0.95}px; }
  .cv-mini-item b { font-weight: 600; }
  .cv-mini-item span { display: block; opacity: .82; font-size: ${base * 0.86}px; }

  /* ── layout TOPO: faixa colorida no cabeçalho ───────────────────────────── */
  .cv-topo { display: flex; align-items: center; gap: ${px(22)}; background: ${r.sidebarBg}; color: ${r.sidebarText}; padding: ${px(30)} ${px(40)}; }
  .cv-topo .cv-fotowrap, .cv-topo .cv-photo { margin: 0; flex-shrink: 0; }
  .cv-topo .cv-name { color: ${r.sidebarText}; }
  .cv-topo .cv-cargo { color: ${corClara(d.sidebarBg) ? r.accent : 'rgba(255,255,255,.92)'}; }
  .cv-topo .cv-single-contact { color: ${r.sidebarMuted}; margin-top: 8px; }
  .cv-topo .cv-single-contact svg { opacity: .85; }
  .cv-topo-info { flex: 1; min-width: 0; }
  .cv-topo-root .cv-main { padding: ${px(30)} ${px(40)}; width: 100%; }

  /* ── cabeçalho centralizado (headerAlign: center) ───────────────────────── */
  .cv-center .cv-name, .cv-center .cv-cargo { text-align: center; }
  .cv-center .cv-single-contact { justify-content: center; }
  .cv-center .cv-main > h2 { text-align: center; }
  .cv-center .cv-main > h2::after { content: ""; display: block; width: 46px; height: 2px; margin: 6px auto 0; background: ${r.accent}; }
  `;
}

function corClaraSide(d: DesignConfig): boolean {
  return corClara(d.sidebarBg);
}
