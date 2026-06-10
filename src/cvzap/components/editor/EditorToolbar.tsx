import { useState } from 'react';
import { Sparkles, Target, Languages, LayoutGrid, Palette, SlidersHorizontal, Download, Undo2, Redo2, MessageSquareText, Moon, Sun, ArrowLeft, Save, FolderOpen, Menu, X } from 'lucide-react';
import { LogoIcon } from '../Logo';

interface Props {
  onVoltar?: () => void;
  dark: boolean;
  onToggleDark: () => void;
  onModelos: () => void;
  onDesign: () => void;
  onSecoes: () => void;
  onBaixar: () => void;
  onSalvar?: () => void;
  onMeusCurriculos?: () => void;
  onMelhorarIA: () => void;
  onChat: () => void;
  onUndo: () => void;
  onRedo: () => void;
  podeUndo: boolean;
  podeRedo: boolean;
  emBreve: (q: string) => void;
}

function Btn({ children, onClick, title, disabled }: { children: React.ReactNode; onClick?: () => void; title?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
      {children}
    </button>
  );
}

// item do menu mobile (largura total, ícone + rótulo)
function MenuItem({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
      {children}
    </button>
  );
}

export default function EditorToolbar(p: Props) {
  const [menu, setMenu] = useState(false);
  const fechar = () => setMenu(false);
  const fechando = (fn?: () => void) => () => { fn?.(); fechar(); };

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 px-3 py-2.5">
        {p.onVoltar && (
          <button onClick={p.onVoltar} className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Início"><ArrowLeft className="h-5 w-5" /></button>
        )}
        <LogoIcon className="mr-1 h-8 w-8 shrink-0" />

        {/* DESKTOP: tudo em linha */}
        <div className="hidden flex-1 flex-wrap items-center gap-2 md:flex">
          <Btn onClick={() => p.emBreve('Importar currículo')} title="Importar de um arquivo (em breve)"><span>Importar</span></Btn>
          <Btn onClick={p.onMelhorarIA} title="Melhorar textos automaticamente"><Sparkles className="h-4 w-4 text-violet-500" /> Melhorar com IA</Btn>
          <Btn onClick={() => p.emBreve('Adaptar à vaga')}><Target className="h-4 w-4 text-indigo-500" /> Adaptar à vaga</Btn>
          <Btn onClick={() => p.emBreve('Traduzir')}><Languages className="h-4 w-4 text-fuchsia-500" /> Traduzir</Btn>
          <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <Btn onClick={p.onSecoes}><SlidersHorizontal className="h-4 w-4" /> Seções</Btn>
          <Btn onClick={p.onDesign}><Palette className="h-4 w-4" /> Design</Btn>
          <Btn onClick={p.onModelos}><LayoutGrid className="h-4 w-4" /> Modelos</Btn>
          {p.onMeusCurriculos && <Btn onClick={p.onMeusCurriculos} title="Meus currículos"><FolderOpen className="h-4 w-4" /> Meus CVs</Btn>}
          <div className="ml-auto flex items-center gap-2">
            <Btn onClick={p.onUndo} disabled={!p.podeUndo} title="Desfazer"><Undo2 className="h-4 w-4" /></Btn>
            <Btn onClick={p.onRedo} disabled={!p.podeRedo} title="Refazer"><Redo2 className="h-4 w-4" /></Btn>
            {p.onSalvar && (
              <button onClick={p.onSalvar} title="Salvar na minha conta"
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Save className="h-4 w-4" /> Salvar
              </button>
            )}
            <button onClick={p.onChat} title="Assistente (chat)"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95">
              <MessageSquareText className="h-4 w-4" /> Assistente
            </button>
            <button onClick={p.onBaixar} title="Baixar PDF"
              className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-bold text-amber-950 hover:bg-amber-300">
              <Download className="h-4 w-4" /> Baixar
            </button>
            <button onClick={p.onToggleDark} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Tema">
              {p.dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE: ações principais + menu */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button onClick={p.onChat} title="Assistente" className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <MessageSquareText className="h-5 w-5" />
          </button>
          <button onClick={p.onBaixar} className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950">
            <Download className="h-4 w-4" /> Baixar
          </button>
          <button onClick={() => setMenu((v) => !v)} aria-label="Mais opções" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200">
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE (grade de ferramentas) */}
      {menu && (
        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 px-3 py-3 md:hidden dark:border-slate-700">
          <MenuItem onClick={fechando(p.onModelos)}><LayoutGrid className="h-4 w-4" /> Modelos</MenuItem>
          <MenuItem onClick={fechando(p.onDesign)}><Palette className="h-4 w-4" /> Design</MenuItem>
          <MenuItem onClick={fechando(p.onSecoes)}><SlidersHorizontal className="h-4 w-4" /> Seções</MenuItem>
          <MenuItem onClick={fechando(p.onMelhorarIA)}><Sparkles className="h-4 w-4 text-violet-500" /> Melhorar com IA</MenuItem>
          {p.onSalvar && <MenuItem onClick={fechando(p.onSalvar)}><Save className="h-4 w-4 text-indigo-600" /> Salvar</MenuItem>}
          {p.onMeusCurriculos && <MenuItem onClick={fechando(p.onMeusCurriculos)}><FolderOpen className="h-4 w-4" /> Meus CVs</MenuItem>}
          <MenuItem onClick={fechando(() => p.emBreve('Adaptar à vaga'))}><Target className="h-4 w-4 text-indigo-500" /> Adaptar à vaga</MenuItem>
          <MenuItem onClick={fechando(() => p.emBreve('Traduzir'))}><Languages className="h-4 w-4 text-fuchsia-500" /> Traduzir</MenuItem>
          <MenuItem onClick={fechando(() => p.emBreve('Importar currículo'))}><span className="w-4" /> Importar</MenuItem>
          <MenuItem onClick={p.onUndo} disabled={!p.podeUndo}><Undo2 className="h-4 w-4" /> Desfazer</MenuItem>
          <MenuItem onClick={p.onRedo} disabled={!p.podeRedo}><Redo2 className="h-4 w-4" /> Refazer</MenuItem>
          <MenuItem onClick={p.onToggleDark}>{p.dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {p.dark ? 'Tema claro' : 'Tema escuro'}</MenuItem>
        </div>
      )}
    </header>
  );
}
