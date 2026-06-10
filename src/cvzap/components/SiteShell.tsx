import { Moon, Sun } from 'lucide-react';

export const INDIGO = '#4b4ff2';
export type SitePagina = 'precos' | 'contato' | 'sobre' | 'termos' | 'privacidade';

interface HeaderProps {
  onIniciar: () => void;
  onHome: () => void;
  onNavegar: (p: SitePagina) => void;
  dark: boolean;
  onToggleDark: () => void;
}

export function SiteHeader({ onIniciar, onHome, onNavegar, dark, onToggleDark }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#0b1020]/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <button onClick={onHome} className="flex items-center gap-2 text-xl font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: INDIGO }}>CV</span>
          <span>Curriculou</span>
        </button>
        <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <button onClick={onHome} className="hover:text-slate-900 dark:hover:text-white">Início</button>
          <button onClick={() => onNavegar('precos')} className="hover:text-slate-900 dark:hover:text-white">Preços</button>
          <button onClick={() => onNavegar('sobre')} className="hover:text-slate-900 dark:hover:text-white">Sobre</button>
          <button onClick={() => onNavegar('contato')} className="hover:text-slate-900 dark:hover:text-white">Contato</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleDark} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={onIniciar} className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ background: INDIGO }}>
            Criar meu currículo
          </button>
        </div>
      </nav>
    </header>
  );
}

interface FooterProps {
  onHome: () => void;
  onNavegar: (p: SitePagina) => void;
}

export function SiteFooter({ onHome, onNavegar }: FooterProps) {
  const link = 'text-left text-slate-500 hover:text-slate-800 dark:hover:text-slate-200';
  return (
    <footer className="border-t border-slate-100 bg-[#f7f8ff] py-10 dark:border-white/10 dark:bg-white/5">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
            <span className="grid h-7 w-7 place-items-center rounded-lg text-xs text-white" style={{ background: INDIGO }}>CV</span> Curriculou
          </div>
          <p className="mt-3 text-sm text-slate-500">Currículo profissional em minutos, do seu jeito.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Produto</span>
          <button onClick={onHome} className={link}>Início</button>
          <button onClick={() => onNavegar('precos')} className={link}>Preços</button>
          <button onClick={() => onNavegar('sobre')} className={link}>Sobre</button>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Suporte</span>
          <button onClick={() => onNavegar('contato')} className={link}>Contato</button>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Legal</span>
          <button onClick={() => onNavegar('termos')} className={link}>Termos de uso</button>
          <button onClick={() => onNavegar('privacidade')} className={link}>Privacidade</button>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-5 text-sm text-slate-400">© 2026 Curriculou. Todos os direitos reservados.</p>
    </footer>
  );
}
