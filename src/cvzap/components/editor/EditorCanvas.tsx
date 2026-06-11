import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Upload, X, Maximize2, Sparkles, AlertTriangle } from 'lucide-react';
import type { CurriculoData, Experiencia, Formacao, Curso } from '../../types';
import { gerarId } from '../../engine/parsers';
import {
  normalizarTitulo, normalizarEmail,
  normalizarEstadoCivil, normalizarNacionalidade, normalizarEscolaridade,
  normalizarCurso, descreverExperiencia,
} from '../../engine/normalize';
import type { DesignConfig, SectionsConfig, SectionKey } from '../../design/types';
import { buildCSS, resolveDesign } from '../../design/style';
import { ICON } from '../../templates/shared';
import FotoCropper from './FotoCropper';
import AutoTxt from './AutoTxt';
import CampoData from './CampoData';
import { SUG_ESTADO_CIVIL, SUG_NACIONALIDADE, SUG_HABILIDADES, SUG_IDIOMAS, SUG_CURSOS } from '../../engine/sugestoes';

// marca d'água anti-print (some apenas no PDF pago, que é gerado por outro caminho)
const WATERMARK = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='250' height='150'><text x='6' y='95' font-family='Arial, sans-serif' font-size='23' font-weight='700' fill='#4b4ff2' fill-opacity='0.11' transform='rotate(-22 125 75)'>Curriculou • amostra</text></svg>"
)}")`;

interface Props {
  data: CurriculoData;
  onChange: (d: CurriculoData) => void;
  design: DesignConfig;
  sections: SectionsConfig;
  foto?: string;
  onFoto: (f: string | undefined) => void;
  onFotoTamanho?: (px: number) => void;
  onContentScale?: (scale: number) => void;
  onSectionScale?: (key: SectionKey, scale: number) => void;
}

const MINUSC = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em']);

// capitaliza preservando siglas (USP, CCAA) e conectores (de, da...)
function capWords(v: string): string {
  return v.split(/(\s+)/).map((w) => {
    if (!w.trim()) return w;
    const lw = w.toLowerCase();
    if (MINUSC.has(lw)) return lw;
    if (w.length <= 4 && w === w.toUpperCase() && /[A-ZÀ-Ý]/.test(w)) return w; // sigla
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
}
const capFrase = (v: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : v);

// ── máscaras ao vivo (a cada tecla) ───────────────────────────────────────────
function maskTel(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}
const liveCidadeUF = (v: string) => {
  const i = v.indexOf(',');
  if (i < 0) return capWords(v);
  return `${capWords(v.slice(0, i))},${v.slice(i + 1).toUpperCase().replace(/[^A-Z\s]/g, '').slice(0, 3)}`;
};

// ── correção pesada (ao sair do campo) ────────────────────────────────────────
const fTitulo = (v: string) => (v ? normalizarTitulo(v).valor : v);
const fEmail = (v: string) => (v ? normalizarEmail(v).valor : v);
const fCivil = (v: string) => (v ? normalizarEstadoCivil(v).valor : v);
const fNac = (v: string) => (v ? normalizarNacionalidade(v) : v);
const fEscol = (v: string) => (v ? normalizarEscolaridade(v).valor : v);
const fCurso = (v: string) => (v ? normalizarCurso(v).valor : v);

function Ico({ html }: { html: string }) {
  return <span className="cv-icon" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Txt({ value, onChange, ph, cls = '', style, live, fmt }: {
  value: string; onChange: (v: string) => void; ph?: string; cls?: string; style?: React.CSSProperties;
  live?: (v: string) => string; fmt?: (v: string) => string;
}) {
  return (
    <input className={`cv-edit ${cls}`} style={style} value={value} placeholder={ph}
      onChange={(e) => { const v = e.target.value; onChange(live ? live(v) : v); }}
      onBlur={() => { if (fmt) { const f = fmt(value); if (f !== value) onChange(f); } }} />
  );
}

// Campo livre que NÃO altera o texto sozinho: só oferece uma sugestão (clicável)
// quando há uma versão melhor. O usuário digita o que quiser.
function TxtSugestao({ value, onChange, ph, cls = '', style, live, sugerir }: {
  value: string; onChange: (v: string) => void; ph?: string; cls?: string; style?: React.CSSProperties;
  live?: (v: string) => string; sugerir?: (v: string) => string;
}) {
  const [foco, setFoco] = useState(false);
  const sug = value && sugerir ? sugerir(value) : '';
  const mostrar = foco && sug && sug !== value;
  return (
    <span style={{ position: 'relative', display: 'block', width: style?.width ?? '100%' }}>
      <input className={`cv-edit ${cls}`} style={style} value={value} placeholder={ph}
        onChange={(e) => { const v = e.target.value; onChange(live ? live(v) : v); }}
        onFocus={() => setFoco(true)}
        onBlur={() => window.setTimeout(() => setFoco(false), 160)} />
      {mostrar && (
        <button type="button" className="cv-sugfix" title="Clique para usar esta sugestão"
          onMouseDown={(e) => { e.preventDefault(); onChange(sug); }}>
          <Sparkles className="h-3 w-3" /> Sugestão: {sug}
        </button>
      )}
    </span>
  );
}

function Area({ value, onChange, ph, cls = '', live, fmt }: {
  value: string; onChange: (v: string) => void; ph?: string; cls?: string;
  live?: (v: string) => string; fmt?: (v: string) => string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const rz = () => { const t = ref.current; if (t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; } };
  return (
    <textarea ref={ref} className={`cv-edit ${cls}`} value={value} placeholder={ph} rows={2}
      onChange={(e) => { onChange(live ? live(e.target.value) : e.target.value); rz(); }} onFocus={rz}
      onBlur={() => { if (fmt) { const f = fmt(value); if (f !== value) onChange(f); } }} />
  );
}

// Embrulha um tópico/seção: aplica `zoom` (uniforme, dentro da A4) e mostra
// uma alça pra arrastar e aumentar/diminuir só aquele tópico.
function SecaoZoom({ scale, onScale, children }: { scale: number; onScale?: (s: number) => void; children: React.ReactNode }) {
  const ref = useRef<{ x: number; y: number; s: number } | null>(null);
  const ini = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    ref.current = { x: e.clientX, y: e.clientY, s: scale };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const mov = (e: React.PointerEvent) => {
    if (!ref.current) return;
    const d = (e.clientX - ref.current.x) + (e.clientY - ref.current.y);
    onScale?.(Math.max(0.6, Math.min(1.4, Math.round((ref.current.s + d / 500) * 100) / 100)));
  };
  const fim = (e: React.PointerEvent) => {
    ref.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  };
  const ativo = scale !== 1;
  return (
    <div className="cv-secz">
      <div style={{ zoom: scale } as React.CSSProperties}>{children}</div>
      {onScale && (
        <span className={`cv-secz-handle${ativo ? ' on' : ''}`} title="Arraste para aumentar ou diminuir este tópico"
          onPointerDown={ini} onPointerMove={mov} onPointerUp={fim} onPointerCancel={fim}>
          <Maximize2 className="h-3 w-3" />{ativo ? ` ${Math.round(scale * 100)}%` : ''}
        </span>
      )}
    </div>
  );
}

const EDIT_CSS = `
  .cv-edit:hover { background: rgba(79,70,229,.08); border-radius: 4px; }
  .cv-edit:focus { background: rgba(79,70,229,.14); box-shadow: 0 0 0 2px rgba(79,70,229,.55); border-radius: 4px; }
  .cv-grp { position: relative; }
  .cv-del { position: absolute; right: 2px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: #fff; display: none; place-items: center; padding: 0; line-height: 0; cursor: pointer; z-index: 8; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
  .cv-del svg { width: 11px; height: 11px; display: block; }
  .cv-grp:hover > .cv-del { display: grid; }
  /* linha em edição (com a lista de sugestões) fica acima das outras linhas */
  .cv-grp:focus-within { z-index: 50; }
  /* nas listas (habilidade/idioma/curso): X centralizado e dentro da borda, com respiro no input */
  .cv-grp.cv-skill > .cv-del, .cv-grp.cv-mini-item > .cv-del { top: 50%; transform: translateY(-50%); right: 2px; }
  .cv-grp.cv-skill .cv-edit, .cv-grp.cv-mini-item .cv-edit { padding-right: 24px; }
  .cv-grp.cv-skill, .cv-grp.cv-mini-item { margin-bottom: 10px; }
  /* botões "+ adicionar": cor herda do tema (clara em fundo escuro, escura em claro) e texto em MAIÚSCULO */
  .cv-addbtn { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: inherit; opacity: .8; cursor: pointer; border: 1px dashed currentColor; border-radius: 6px; padding: 3px 9px; margin-top: 4px; background: transparent; }
  .cv-addbtn:hover { opacity: 1; }
  .cv-secwrap { position: relative; }
  /* Experiência / Educação: cartão no editor (não afeta o PDF) */
  .cv-grp.cv-item { padding: 12px 40px 12px 14px; border: 1px solid #e8ebf2; border-radius: 12px; background: #fafbff; margin-bottom: 14px; transition: border-color .15s, box-shadow .15s; }
  .cv-grp.cv-item:hover { border-color: #c7d2fe; box-shadow: 0 2px 12px rgba(79,70,229,.10); }
  .cv-grp.cv-item > .cv-del { top: 10px; right: 10px; transform: none; }
  .cv-grp.cv-item .cv-per input.cv-edit { border-bottom: 1px dashed #cbd5e1; border-radius: 0; }
  .cv-icon svg { width: 1em; height: 1em; }
  .cv-fotowrap { position: relative; }
  .cv-fotodel { position: absolute; right: 6px; top: 2px; background: #ef4444; color:#fff; border-radius: 50%; width: 22px; height: 22px; display: none; align-items: center; justify-content: center; cursor: pointer; z-index: 6; }
  .cv-fotowrap:hover .cv-fotodel { display: flex; }
  .cv-fotowrap + h3 { margin-top: 0; }
  .cv-foto-resize { position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; border-radius: 50%; background: #4f46e5; color: #fff; display: none; align-items: center; justify-content: center; cursor: nwse-resize; z-index: 7; box-shadow: 0 1px 5px rgba(0,0,0,.35); touch-action: none; }
  .cv-fotowrap:hover .cv-foto-resize { display: flex; }
  .cv-suggest { position: absolute; top: 100%; left: 0; z-index: 60; margin-top: 2px; min-width: 180px; max-width: 280px; max-height: 220px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.16); padding: 4px; }
  .cv-suggest button { display: block; width: 100%; text-align: left; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; padding: 6px 9px; border-radius: 6px; background: transparent; border: 0; cursor: pointer; white-space: nowrap; }
  .cv-suggest button.on, .cv-suggest button:hover { background: #e0e7ff; color: #4338ca; }
  /* sugestão opcional (não altera o texto sozinho — o usuário clica se quiser) */
  .cv-sugfix { position: absolute; top: 100%; left: 0; z-index: 60; margin-top: 3px; display: inline-flex; align-items: center; gap: 5px; max-width: 280px; padding: 3px 9px; border-radius: 7px; background: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca; font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 600; line-height: 1.2; cursor: pointer; box-shadow: 0 4px 14px rgba(79,70,229,.16); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cv-sugfix:hover { background: #e0e7ff; }
  .cv-sugfix svg { flex-shrink: 0; stroke: #6366f1; }

  /* ── alça de zoom geral do currículo ────────────────────────────────────── */
  .cv-zoom-handle { position: absolute; right: 10px; top: 10px; z-index: 40; display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 999px; background: #4f46e5; color: #fff; font-size: 11px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: nwse-resize; box-shadow: 0 2px 8px rgba(79,70,229,.4); user-select: none; touch-action: none; opacity: .82; }
  .cv-zoom-handle:hover { opacity: 1; }
  .cv-zoom-handle svg { width: 12px; height: 12px; stroke: currentColor; }

  /* ── aviso e linha de quebra de página (passou da folha A4) ─────────────── */
  .cv-pagewarn { position: absolute; right: 10px; top: 44px; z-index: 41; display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; background: #fff7ed; border: 1px solid #fdba74; color: #b45309; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
  .cv-pagewarn svg { stroke: currentColor; }
  .cv-pagebreak { position: absolute; left: 0; right: 0; z-index: 31; pointer-events: none; border-top: 2px dashed #f59e0b; box-shadow: 0 -10px 16px -10px rgba(245,158,11,.5); }
  .cv-pagebreak-label { position: absolute; right: 0; top: 0; transform: translateY(-50%); background: #f59e0b; color: #fff; font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 700; padding: 2px 9px; border-radius: 999px; box-shadow: 0 1px 4px rgba(0,0,0,.25); }

  /* ── alça de zoom por tópico/seção ──────────────────────────────────────── */
  .cv-secz { position: relative; }
  .cv-secz-handle { position: absolute; right: 2px; top: 2px; z-index: 35; display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 999px; background: #6366f1; color: #fff; font-size: 10px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: nwse-resize; box-shadow: 0 1px 5px rgba(79,70,229,.4); user-select: none; touch-action: none; opacity: 0; transition: opacity .15s; }
  .cv-secz:hover > .cv-secz-handle, .cv-secz-handle.on { opacity: .9; }
  .cv-secz-handle:hover { opacity: 1 !important; }
  .cv-secz-handle svg { width: 11px; height: 11px; stroke: currentColor; }
  /* o wrapper de zoom troca quem é :first-child — restauramos o respiro entre tópicos */
  .cv-main > .cv-secz > div > .cv-secwrap > h2 { margin-top: 22px; }
  .cv-side > .cv-secz > div > h3, .cv-side > .cv-secz > div > .cv-secwrap > h3 { margin-top: 18px; }
  .cv-side > .cv-secz:first-of-type > div > h3, .cv-side > .cv-secz:first-of-type > div > .cv-secwrap > h3 { margin-top: 0; }

  /* ── campo de data com calendário ───────────────────────────────────────── */
  .cvcal { vertical-align: middle; }
  .cvcal-inp { padding-right: 16px !important; }
  .cvcal-btn { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; display: grid; place-items: center; padding: 0; background: transparent; border: 0; color: #94a3b8; cursor: pointer; z-index: 2; }
  .cvcal-btn:hover { color: #4f46e5; }
  .cvcal-btn svg { width: 13px; height: 13px; }
  .cvcal-pop { position: absolute; top: calc(100% + 4px); left: 0; z-index: 70; width: 212px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 10px 30px rgba(15,23,42,.18); padding: 8px; font-family: 'Inter', sans-serif; }
  .cvcal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .cvcal-head span { font-size: 13px; font-weight: 700; color: #1e293b; }
  .cvcal-head button { width: 24px; height: 24px; border: 0; background: #f1f5f9; border-radius: 6px; color: #475569; font-size: 16px; line-height: 1; cursor: pointer; }
  .cvcal-head button:hover { background: #e0e7ff; color: #4338ca; }
  .cvcal-head .cvcal-ano { flex: 1; width: auto; height: auto; background: transparent; color: #1e293b; font-size: 12.5px; font-weight: 700; padding: 4px 6px; }
  .cvcal-head .cvcal-ano:hover { background: #e0e7ff; color: #4338ca; }
  .cvcal-anos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; max-height: 152px; overflow-y: auto; }
  .cvcal-anos button { padding: 6px 0; border: 0; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #334155; cursor: pointer; }
  .cvcal-anos button:hover { background: #e0e7ff; color: #4338ca; }
  .cvcal-anos button.on { background: #4f46e5; color: #fff; font-weight: 700; }
  .cvcal-meses { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .cvcal-meses button { padding: 7px 0; border: 0; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #334155; cursor: pointer; }
  .cvcal-meses button:hover { background: #e0e7ff; color: #4338ca; }
  .cvcal-meses button.on, .cvcal-dias button.on { background: #4f46e5; color: #fff; font-weight: 700; }
  .cvcal-sem { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 2px; }
  .cvcal-sem span { text-align: center; font-size: 10px; font-weight: 700; color: #94a3b8; }
  .cvcal-dias { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .cvcal-dias button { padding: 5px 0; border: 0; background: transparent; border-radius: 6px; font-size: 11.5px; color: #334155; cursor: pointer; }
  .cvcal-dias button:hover { background: #e0e7ff; color: #4338ca; }
`;

export default function EditorCanvas({ data, onChange, design, sections: sec, foto, onFoto, onFotoTamanho, onContentScale, onSectionScale }: Props) {
  const dual = design.layout === 'dual';
  const r = resolveDesign(design);
  const set = (p: Partial<CurriculoData>) => onChange({ ...data, ...p });
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // zoom por tópico: cada seção tem sua escala e sua alça de arraste
  const secScale = (k: SectionKey) => design.sectionScale?.[k] ?? 1;
  const wrapSec = (k: SectionKey, node: React.ReactNode) => (
    <SecaoZoom scale={secScale(k)} onScale={onSectionScale ? (s) => onSectionScale(k, s) : undefined}>{node}</SecaoZoom>
  );

  // ── redimensionar a foto arrastando a alça (direto no currículo) ───────────
  const tamFoto = design.fotoTamanho ?? 116;
  const resizeRef = useRef<{ x: number; size: number } | null>(null);
  const iniciarResize = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    resizeRef.current = { x: e.clientX, size: tamFoto };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moverResize = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const d = e.clientX - resizeRef.current.x;
    const novo = Math.max(72, Math.min(180, Math.round((resizeRef.current.size + d) / 2) * 2));
    onFotoTamanho?.(novo);
  };
  const fimResize = (e: React.PointerEvent) => {
    resizeRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  };

  // ── zoom geral do currículo arrastando a alça (encolhe/aumenta tudo) ────────
  const escalaConteudo = design.contentScale ?? 1;
  const scaleRef = useRef<{ x: number; y: number; s: number } | null>(null);
  const iniciarScale = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    scaleRef.current = { x: e.clientX, y: e.clientY, s: escalaConteudo };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moverScale = (e: React.PointerEvent) => {
    if (!scaleRef.current) return;
    const d = (e.clientX - scaleRef.current.x) + (e.clientY - scaleRef.current.y);
    const novo = Math.max(0.6, Math.min(1.15, Math.round((scaleRef.current.s + d / 500) * 100) / 100));
    onContentScale?.(novo);
  };
  const fimScale = (e: React.PointerEvent) => {
    scaleRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  };

  // ── detectar quebra de página (folha A4 = 794×1123px) ───────────────────────
  const PAGE_H = 1123;
  const sheetRef = useRef<HTMLDivElement>(null);
  const [altura, setAltura] = useState(0);
  useEffect(() => {
    const el = sheetRef.current; if (!el) return;
    const medir = () => setAltura(el.offsetHeight);
    const ro = new ResizeObserver(medir);
    ro.observe(el); medir();
    return () => ro.disconnect();
  }, []);
  const paginas = altura ? Math.max(1, Math.ceil((altura - 6) / PAGE_H)) : 1;

  const setExp = (id: string, p: Partial<Experiencia>) => set({ experiencias: data.experiencias.map((e) => e.id === id ? { ...e, ...p } : e) });
  const addExp = () => set({ experiencias: [...data.experiencias, { id: gerarId('exp', data.experiencias.length + (Date.now() % 1000)), empresa: '', cargo: '', inicio: '', fim: '', atual: false, atividades: '' }] });
  const delExp = (id: string) => set({ experiencias: data.experiencias.filter((e) => e.id !== id) });
  const setEdu = (id: string, p: Partial<Formacao>) => set({ formacoes: data.formacoes.map((f) => f.id === id ? { ...f, ...p } : f) });
  const addEdu = () => set({ formacoes: [...data.formacoes, { id: gerarId('edu', data.formacoes.length + (Date.now() % 1000)), escolaridade: '', curso: '', instituicao: '', anoConclusao: '' }] });
  const delEdu = (id: string) => set({ formacoes: data.formacoes.filter((f) => f.id !== id) });
  const setCur = (id: string, p: Partial<Curso>) => set({ cursos: data.cursos.map((c) => c.id === id ? { ...c, ...p } : c) });
  const addCur = () => set({ cursos: [...data.cursos, { id: gerarId('curso', data.cursos.length + (Date.now() % 1000)), nome: '', instituicao: '', cargaHoraria: '' }] });
  const delCur = (id: string) => set({ cursos: data.cursos.filter((c) => c.id !== id) });
  const setHab = (i: number, v: string) => set({ habilidades: data.habilidades.map((h, idx) => idx === i ? v : h) });
  const addHab = () => set({ habilidades: [...data.habilidades, ''] });
  const delHab = (i: number) => set({ habilidades: data.habilidades.filter((_, idx) => idx !== i) });
  const setIdi = (i: number, v: string) => set({ idiomas: data.idiomas.map((x, idx) => idx === i ? v : x) });
  const addIdi = () => set({ idiomas: [...data.idiomas, ''] });
  const delIdi = (i: number) => set({ idiomas: data.idiomas.filter((_, idx) => idx !== i) });

  const escolherFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => { if (typeof rd.result === 'string') setCropSrc(rd.result); };
    rd.readAsDataURL(file); e.target.value = '';
  };

  const Foto = sec.foto && (
    <div className="cv-fotowrap" style={{ width: tamFoto, maxWidth: '100%', margin: design.layout === 'topo' ? 0 : '0 auto 18px', position: 'relative' }}>
      <label className="cv-photo" style={{ width: '100%', margin: 0, cursor: 'pointer', backgroundImage: foto ? `url(${foto})` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, textAlign: 'center', fontSize: 10 }}>
        {!foto && <><Upload className="h-4 w-4" /><span style={{ opacity: .7 }}>Selecione sua foto</span></>}
        <input type="file" accept="image/*" className="hidden" onChange={escolherFoto} />
      </label>
      {foto && <span className="cv-fotodel" onClick={() => onFoto(undefined)} title="Remover foto"><X className="h-3.5 w-3.5" /></span>}
      {onFotoTamanho && (
        <span className="cv-foto-resize" title="Arraste para redimensionar a foto"
          onPointerDown={iniciarResize} onPointerMove={moverResize} onPointerUp={fimResize} onPointerCancel={fimResize}>
          <Maximize2 className="h-3 w-3" />
        </span>
      )}
    </div>
  );

  const Contato = sec.contato && wrapSec('contato', (
    <>
      {dual && <h3>Contato</h3>}
      <div className={dual ? '' : 'cv-single-contact'}>
        <div className="cv-contact-row">{r.contactIcons && <Ico html={ICON.mail} />}<Txt value={data.email} onChange={(v) => set({ email: v })} ph="email@exemplo.com" live={(v) => v.replace(/\s/g, '').toLowerCase()} fmt={fEmail} /></div>
        <div className="cv-contact-row">{r.contactIcons && <Ico html={ICON.phone} />}<Txt value={data.telefone} onChange={(v) => set({ telefone: v })} ph="(11) 91234-5678" live={maskTel} /></div>
        <div className="cv-contact-row">{r.contactIcons && <Ico html={ICON.pin} />}<Txt value={[data.cidade, data.estado].filter(Boolean).join(', ')} onChange={(v) => { const [c, e] = v.split(','); set({ cidade: (c || '').trim(), estado: (e || '').trim() }); }} ph="Cidade, UF" live={liveCidadeUF} /></div>
        <div className="cv-contact-row">{r.contactIcons && <Ico html={ICON.user} />}<Txt value={data.linkedin} onChange={(v) => set({ linkedin: v })} ph="linkedin.com/in/voce" live={(v) => v.replace(/\s/g, '')} /></div>
      </div>
    </>
  ));

  const Dados = sec.dadosPessoais && wrapSec('dadosPessoais', (
    <>
      <h3>Dados Pessoais</h3>
      <div className="cv-info" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><b>Nascimento:</b> <CampoData value={data.dataNascimento} onChange={(v) => set({ dataNascimento: v })} modo="completo" ph="dd/mm/aaaa" /></div>
      <div className="cv-info" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><b>Estado civil:</b><span style={{ flex: 1 }}><AutoTxt value={data.estadoCivil} onChange={(v) => set({ estadoCivil: v })} options={SUG_ESTADO_CIVIL} ph="Selecione..." live={capFrase} fmt={fCivil} /></span></div>
      <div className="cv-info" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><b>Nacionalidade:</b><span style={{ flex: 1 }}><AutoTxt value={data.nacionalidade} onChange={(v) => set({ nacionalidade: v })} options={SUG_NACIONALIDADE} ph="Brasileira" live={capFrase} fmt={fNac} /></span></div>
      <div className="cv-info"><b>Endereço:</b> <Txt value={data.endereco} onChange={(v) => set({ endereco: v })} ph="Rua / Av." live={capWords} /></div>
      <div className="cv-info" style={{ display: 'flex', gap: 6 }}>
        <span><b>Nº:</b> <Txt value={data.numero} onChange={(v) => set({ numero: v })} ph="123" style={{ width: 50, display: 'inline' }} /></span>
        <span style={{ flex: 1 }}><b>Bairro:</b> <Txt value={data.bairro} onChange={(v) => set({ bairro: v })} ph="Bairro" live={capWords} style={{ width: 'auto', display: 'inline' }} /></span>
      </div>
      <div className="cv-info"><b>CEP:</b> <Txt value={data.cep} onChange={(v) => set({ cep: v })} ph="00000-000" live={maskCep} style={{ width: 'auto', display: 'inline' }} /></div>
    </>
  ));

  const Hab = sec.habilidades && wrapSec('habilidades', (
    <div className="cv-secwrap">
      {dual ? <h3>Habilidades</h3> : <h2>Habilidades</h2>}
      {data.habilidades.map((h, i) => (
        <div key={i} className="cv-grp cv-skill">
          <AutoTxt value={h} onChange={(v) => setHab(i, v)} options={SUG_HABILIDADES.filter((o) => !data.habilidades.includes(o))} ph="Habilidade" live={capFrase} fmt={fTitulo} />
          <span className="cv-del" onClick={() => delHab(i)}><X className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addHab}><Plus className="h-3 w-3" /> habilidade</span>
    </div>
  ));

  const Idi = sec.idiomas && wrapSec('idiomas', (
    <div className="cv-secwrap">
      {dual ? <h3>Idiomas</h3> : <h2>Idiomas</h2>}
      {data.idiomas.map((x, i) => (
        <div key={i} className="cv-grp cv-mini-item">
          <AutoTxt value={x} onChange={(v) => setIdi(i, v)} options={SUG_IDIOMAS.filter((o) => !data.idiomas.includes(o))} ph="Ex: Inglês - Intermediário" live={capWords} />
          <span className="cv-del" onClick={() => delIdi(i)}><X className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addIdi}><Plus className="h-3 w-3" /> idioma</span>
    </div>
  ));

  const Cur = sec.cursos && wrapSec('cursos', (
    <div className="cv-secwrap">
      {dual ? <h3>Cursos e Certificações</h3> : <h2>Cursos e Certificações</h2>}
      {data.cursos.map((c) => (
        <div key={c.id} className="cv-grp cv-mini-item">
          <AutoTxt value={c.nome} onChange={(v) => setCur(c.id, { nome: v })} options={SUG_CURSOS} ph="Nome do curso" live={capWords} fmt={fCurso} style={{ fontWeight: 600 }} />
          <Txt value={[c.instituicao, c.cargaHoraria].filter(Boolean).join(' • ')} onChange={(v) => { const [inst, ch] = v.split('•'); setCur(c.id, { instituicao: (inst || '').trim(), cargaHoraria: (ch || '').trim() }); }} ph="Instituição • carga" style={{ opacity: .82, fontSize: '.86em' }} />
          <span className="cv-del" onClick={() => delCur(c.id)}><X className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addCur}><Plus className="h-3 w-3" /> curso</span>
    </div>
  ));

  const NomeCargo = (
    <>
      <Txt cls="cv-name" value={data.nome} onChange={(v) => set({ nome: v })} ph="Nome Sobrenome" live={capWords} />
      {sec.cargo && <Txt cls="cv-cargo" value={data.objetivo} onChange={(v) => set({ objetivo: v })} ph="Seu cargo" live={capWords} fmt={fTitulo} />}
    </>
  );

  const Perfil = sec.perfil && wrapSec('perfil', (
    <div className="cv-secwrap"><h2>Perfil</h2>
      <Area cls="cv-desc" value={data.perfilProfissional} onChange={(v) => set({ perfilProfissional: v })} ph="Digite seu resumo profissional. Destaque suas principais competências e experiência em 2-3 frases." live={capFrase} />
    </div>
  ));

  const Qualif = sec.qualificacoes && wrapSec('qualificacoes', (
    <div className="cv-secwrap"><h2>Qualificações e Informações Adicionais</h2>
      <Area cls="cv-desc" value={data.qualificacoes} onChange={(v) => set({ qualificacoes: v })} ph="Ex: Disponibilidade para início imediato, CNH categoria B, disponibilidade para viagens..." live={capFrase} />
    </div>
  ));

  const Exp = sec.experiencia && wrapSec('experiencia', (
    <div className="cv-secwrap"><h2>Experiência Profissional</h2>
      {data.experiencias.map((e) => (
        <div key={e.id} className="cv-grp cv-item">
          <TxtSugestao cls="cv-role" value={e.cargo} onChange={(v) => setExp(e.id, { cargo: v })} ph="Cargo" live={capWords} sugerir={fTitulo} />
          <Txt cls="cv-org" value={e.empresa} onChange={(v) => setExp(e.id, { empresa: v })} ph="Nome da Empresa" live={capWords} />
          <div className="cv-per" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <CampoData value={e.inicio} onChange={(v) => setExp(e.id, { inicio: v })} modo="mesAno" ph="Início" width={88} />
            <span>–</span>
            <CampoData value={e.atual ? 'Atual' : e.fim} onChange={(v) => setExp(e.id, { fim: v })} modo="mesAno" ph="Fim" width={88} disabled={e.atual} />
            <label style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 6 }}>
              <input type="checkbox" checked={e.atual} onChange={(ev) => setExp(e.id, { atual: ev.target.checked, fim: ev.target.checked ? '' : e.fim })} style={{ width: 'auto' }} /> atual
            </label>
          </div>
          <Area cls="cv-desc" value={e.atividades} onChange={(v) => setExp(e.id, { atividades: v })} ph="Descreva suas atividades..." live={capFrase} fmt={(v) => (v ? descreverExperiencia(v, e.cargo) : v)} />
          <span className="cv-del" onClick={() => delExp(e.id)}><Trash2 className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addExp}><Plus className="h-3 w-3" /> experiência</span>
    </div>
  ));

  const Edu = sec.educacao && wrapSec('educacao', (
    <div className="cv-secwrap"><h2>Educação</h2>
      {data.formacoes.map((f) => (
        <div key={f.id} className="cv-grp cv-item">
          <Txt cls="cv-role" value={f.escolaridade || f.curso} onChange={(v) => setEdu(f.id, { escolaridade: v })} ph="Grau / Escolaridade" live={capFrase} fmt={fEscol} />
          <Txt cls="cv-org" value={f.instituicao} onChange={(v) => setEdu(f.id, { instituicao: v })} ph="Universidade / Instituição" live={capWords} />
          <div className="cv-per" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Txt value={f.curso} onChange={(v) => setEdu(f.id, { curso: v })} ph="Curso" live={capWords} fmt={fTitulo} style={{ width: 160 }} />
            <CampoData value={f.anoConclusao} onChange={(v) => setEdu(f.id, { anoConclusao: v })} modo="mesAno" ph="Conclusão" width={92} />
          </div>
          <span className="cv-del" onClick={() => delEdu(f.id)}><Trash2 className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addEdu}><Plus className="h-3 w-3" /> formação</span>
    </div>
  ));

  return (
    <div ref={sheetRef} style={{ position: 'relative', maxWidth: 794, margin: '0 auto', background: design.bgColor, boxShadow: '0 4px 24px rgba(0,0,0,.12)' }}>
      <style dangerouslySetInnerHTML={{ __html: `.cv-root svg{fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}` + buildCSS(design) + EDIT_CSS }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: WATERMARK, backgroundRepeat: 'repeat', pointerEvents: 'none', zIndex: 30 }} />
      {onContentScale && (
        <div className="cv-zoom-handle" title="Arraste para diminuir ou aumentar todo o currículo (ou use o painel de Design)"
          onPointerDown={iniciarScale} onPointerMove={moverScale} onPointerUp={fimScale} onPointerCancel={fimScale}>
          <Maximize2 className="h-3 w-3" /> {Math.round(escalaConteudo * 100)}%
        </div>
      )}

      {/* aviso: o conteúdo passou de 1 folha A4 */}
      {paginas > 1 && (
        <div className="cv-pagewarn">
          <AlertTriangle className="h-3.5 w-3.5" /> Ocupa {paginas} páginas
        </div>
      )}
      {/* linha(s) de quebra de página */}
      {paginas > 1 && Array.from({ length: paginas - 1 }).map((_, i) => (
        <div key={i} className="cv-pagebreak" style={{ top: (i + 1) * PAGE_H }} aria-hidden>
          <span className="cv-pagebreak-label">✂ Página {i + 2}</span>
        </div>
      ))}
      <div className={`cv-root${design.layout === 'topo' ? ' cv-topo-root' : ''}${design.headerAlign === 'center' ? ' cv-center' : ''}`}>
        {dual ? (
          <>
            <aside className="cv-side">{Foto}{Contato}{Dados}{Hab}{Idi}{Cur}</aside>
            <main className="cv-main">{NomeCargo}{Perfil}{Exp}{Edu}{Qualif}</main>
          </>
        ) : design.layout === 'topo' ? (
          <>
            <header className="cv-topo">{Foto}<div className="cv-topo-info">{NomeCargo}{Contato}</div></header>
            <main className="cv-main">{Perfil}{Exp}{Edu}{Hab}{Idi}{Cur}{Qualif}{Dados}</main>
          </>
        ) : (
          <main className="cv-main">{NomeCargo}{Contato}{Perfil}{Exp}{Edu}{Hab}{Idi}{Cur}{Qualif}{Dados}</main>
        )}
      </div>

      {cropSrc && (
        <FotoCropper src={cropSrc} onConfirm={(d) => { onFoto(d); setCropSrc(null); }} onCancel={() => setCropSrc(null)} />
      )}
    </div>
  );
}
