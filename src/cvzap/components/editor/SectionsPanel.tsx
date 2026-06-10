import { X } from 'lucide-react';
import type { SectionsConfig } from '../../design/types';
import { SECOES } from '../../design/types';

interface Props {
  sections: SectionsConfig;
  onChange: (s: SectionsConfig) => void;
  onClose: () => void;
}

export default function SectionsPanel({ sections, onChange, onClose }: Props) {
  const toggle = (key: keyof SectionsConfig) => onChange({ ...sections, [key]: !sections[key] });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Gerenciar seções</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <p className="mb-2 mt-1 text-xs text-slate-400">Ative ou desative as seções do seu currículo.</p>
        {SECOES.map((s) => {
          const on = sections[s.key];
          return (
            <div key={s.key} className="flex items-center justify-between border-b border-slate-100 py-3 dark:border-slate-800">
              <span className="text-sm text-slate-700 dark:text-slate-200">{s.label}</span>
              <button onClick={() => toggle(s.key)}
                className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          );
        })}
        <p className="mt-3 text-xs text-slate-400">Em breve: Projetos, Voluntariado, Pontos Fortes, Informática, Prêmios e reordenação por arrastar.</p>
      </div>
    </div>
  );
}
