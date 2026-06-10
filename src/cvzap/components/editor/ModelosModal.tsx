import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { MODELOS, CATEGORIAS } from '../../design/presets';
import { SECOES_PADRAO } from '../../design/types';
import { documentoHTML } from '../../design/render';
import { AMOSTRA } from '../../templates/shared';
import type { DesignConfig } from '../../design/types';

interface Props {
  designAtual: DesignConfig;
  onEscolher: (d: DesignConfig, id: string) => void;
  onClose: () => void;
}

const THUMB_W = 320;
const A4_W = 794;
const ESCALA = THUMB_W / A4_W;

export default function ModelosModal({ designAtual, onEscolher, onClose }: Props) {
  const [cat, setCat] = useState<string>('Todos');
  const lista = cat === 'Todos' ? MODELOS : MODELOS.filter((m) => m.categoria === cat);

  const mesmoDesign = (d: DesignConfig) =>
    d.layout === designAtual.layout && d.accent === designAtual.accent && d.sidebarBg === designAtual.sidebarBg && d.font === designAtual.font;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Escolher um modelo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex min-h-0 flex-1">
          {/* categorias */}
          <aside className="hidden w-44 shrink-0 border-r border-slate-200 p-3 sm:block dark:border-slate-700">
            {CATEGORIAS.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${cat === c ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                {c}
              </button>
            ))}
          </aside>
          {/* grade */}
          <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((m) => {
              const ativo = mesmoDesign(m.design);
              return (
                <button key={m.id} onClick={() => onEscolher(m.design, m.id)}
                  className={`group relative overflow-hidden rounded-xl border-2 bg-white text-left transition hover:shadow-lg ${ativo ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="pointer-events-none relative overflow-hidden bg-white" style={{ height: A4_W * 1.414 * ESCALA }}>
                    <iframe title={m.nome} srcDoc={documentoHTML(AMOSTRA, m.design, SECOES_PADRAO)} sandbox="allow-same-origin" scrolling="no" tabIndex={-1}
                      style={{ width: A4_W, height: A4_W * 1.414, border: 0, transform: `scale(${ESCALA})`, transformOrigin: 'top left' }} />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{m.nome}</span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">{m.categoria}</span>
                  </div>
                  {ativo && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-indigo-500 text-white"><Check className="h-3.5 w-3.5" /></span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
