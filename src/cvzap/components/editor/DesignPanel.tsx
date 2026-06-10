import { X } from 'lucide-react';
import type { DesignConfig } from '../../design/types';
import { FONTES, CORES_DESTAQUE, CORES_SIDEBAR } from '../../design/presets';

interface Props {
  design: DesignConfig;
  onChange: (d: DesignConfig) => void;
  onClose: () => void;
}

function Linha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 dark:border-slate-800">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Swatches({ cores, valor, onPick }: { cores: string[]; valor: string; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {cores.map((c) => (
        <button key={c} onClick={() => onPick(c)} title={c}
          className={`h-6 w-6 rounded-full border transition ${valor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-indigo-500 ring-offset-1' : 'border-slate-300'}`}
          style={{ background: c }} />
      ))}
    </div>
  );
}

export default function DesignPanel({ design, onChange, onClose }: Props) {
  const set = (p: Partial<DesignConfig>) => onChange({ ...design, ...p });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Configurações de design</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <Linha label="Layout">
          <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs dark:border-slate-700">
            {(['dual', 'single'] as const).map((l) => (
              <button key={l} onClick={() => set({ layout: l })}
                className={`px-3 py-1.5 ${design.layout === l ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                {l === 'dual' ? 'Dupla coluna' : 'Coluna única'}
              </button>
            ))}
          </div>
        </Linha>

        {design.layout === 'dual' && (
          <Linha label="Lado da coluna">
            <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs dark:border-slate-700">
              {(['left', 'right'] as const).map((l) => (
                <button key={l} onClick={() => set({ sidebarLado: l })}
                  className={`px-3 py-1.5 ${design.sidebarLado === l ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                  {l === 'left' ? 'Esquerda' : 'Direita'}
                </button>
              ))}
            </div>
          </Linha>
        )}

        <Linha label="Fonte">
          <select value={design.font} onChange={(e) => set({ font: e.target.value as DesignConfig['font'] })}
            className="rounded-lg border border-slate-200 bg-transparent px-2 py-1.5 text-sm dark:border-slate-700">
            {FONTES.map((f) => <option key={f.key} value={f.key}>{f.nome}</option>)}
          </select>
        </Linha>

        <Linha label={`Tamanho da fonte (${design.fontSizePt}pt)`}>
          <input type="range" min={8} max={12} step={0.5} value={design.fontSizePt}
            onChange={(e) => set({ fontSizePt: +e.target.value })} className="w-28 accent-indigo-600" />
        </Linha>

        <Linha label={`Tamanho do nome (${design.nameScale.toFixed(1)}x)`}>
          <input type="range" min={1.5} max={3.5} step={0.1} value={design.nameScale}
            onChange={(e) => set({ nameScale: +e.target.value })} className="w-28 accent-indigo-600" />
        </Linha>

        <Linha label={`Tamanho da foto (${design.fotoTamanho ?? 116}px)`}>
          <input type="range" min={72} max={180} step={4} value={design.fotoTamanho ?? 116}
            onChange={(e) => set({ fotoTamanho: +e.target.value })} className="w-28 accent-indigo-600" />
        </Linha>

        <Linha label="Cor de destaque"><Swatches cores={CORES_DESTAQUE} valor={design.accent} onPick={(c) => set({ accent: c })} /></Linha>
        {design.layout === 'dual' && (
          <Linha label="Cor lateral"><Swatches cores={CORES_SIDEBAR} valor={design.sidebarBg} onPick={(c) => set({ sidebarBg: c })} /></Linha>
        )}

        <Linha label="Borda dos cabeçalhos">
          <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs dark:border-slate-700">
            {(['line', 'none'] as const).map((b) => (
              <button key={b} onClick={() => set({ headerBorder: b })}
                className={`px-3 py-1.5 ${design.headerBorder === b ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                {b === 'line' ? 'Linha' : 'Sem'}
              </button>
            ))}
          </div>
        </Linha>

        <Linha label="Ícones de contato">
          <button onClick={() => set({ contactIcons: !design.contactIcons })}
            className={`relative h-6 w-11 rounded-full transition ${design.contactIcons ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${design.contactIcons ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </Linha>

        <Linha label="Recuo dos marcadores">
          <button onClick={() => set({ bulletIndent: !design.bulletIndent })}
            className={`relative h-6 w-11 rounded-full transition ${design.bulletIndent ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${design.bulletIndent ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </Linha>
      </div>
    </div>
  );
}
