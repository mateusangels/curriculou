import { Sparkles, Target, Languages, LayoutGrid, Palette, SlidersHorizontal, Download, Undo2, Redo2, MessageSquareText, Moon, Sun, ArrowLeft } from 'lucide-react';

interface Props {
  onVoltar?: () => void;
  dark: boolean;
  onToggleDark: () => void;
  onModelos: () => void;
  onDesign: () => void;
  onSecoes: () => void;
  onBaixar: () => void;
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

export default function EditorToolbar(p: Props) {
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
      {p.onVoltar && (
        <button onClick={p.onVoltar} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Início"><ArrowLeft className="h-5 w-5" /></button>
      )}
      <div className="mr-1 grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-xs font-bold text-white">CV</div>

      <Btn onClick={() => p.emBreve('Importar currículo')} title="Importar de um arquivo (em breve)"><span>Importar</span></Btn>
      <Btn onClick={p.onMelhorarIA} title="Melhorar textos automaticamente"><Sparkles className="h-4 w-4 text-violet-500" /> Melhorar com IA</Btn>
      <Btn onClick={() => p.emBreve('Adaptar à vaga')}><Target className="h-4 w-4 text-indigo-500" /> Adaptar à vaga</Btn>
      <Btn onClick={() => p.emBreve('Traduzir')}><Languages className="h-4 w-4 text-fuchsia-500" /> Traduzir</Btn>

      <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />

      <Btn onClick={p.onSecoes}><SlidersHorizontal className="h-4 w-4" /> Seções</Btn>
      <Btn onClick={p.onDesign}><Palette className="h-4 w-4" /> Design</Btn>
      <Btn onClick={p.onModelos}><LayoutGrid className="h-4 w-4" /> Modelos</Btn>

      <div className="ml-auto flex items-center gap-2">
        <Btn onClick={p.onUndo} disabled={!p.podeUndo} title="Desfazer"><Undo2 className="h-4 w-4" /></Btn>
        <Btn onClick={p.onRedo} disabled={!p.podeRedo} title="Refazer"><Redo2 className="h-4 w-4" /></Btn>
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
    </header>
  );
}
