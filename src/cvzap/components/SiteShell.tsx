import { useState } from 'react';
import { Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { LogoMarca, LogoIcon } from './Logo';
import type { Usuario } from '../lib/auth';
import { ADMIN_EMAIL } from '../lib/track';

export const INDIGO = '#4b4ff2';
export type SitePagina = 'precos' | 'contato' | 'sobre' | 'termos' | 'privacidade';

interface HeaderProps {
  onIniciar: () => void;
  onHome: () => void;
  onNavegar: (p: SitePagina) => void;
  dark: boolean;
  onToggleDark: () => void;
  usuario?: Usuario | null;
  onEntrar?: () => void;
  onSair?: () => void;
  onMeusCurriculos?: () => void;
  onAdmin?: () => void;
}

export function SiteHeader({ onIniciar, onHome, onNavegar, dark, onToggleDark, usuario, onEntrar, onSair, onMeusCurriculos, onAdmin }: HeaderProps) {
  const [menu, setMenu] = useState(false);
  const fechar = () => setMenu(false);
  const linkM = 'rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10';
  const isAdmin = !!usuario && usuario.email.toLowerCase() === ADMIN_EMAIL;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#0b1020]/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <button onClick={() => { onHome(); fechar(); }} className="flex items-center" aria-label="Curriculou — início">
          <LogoMarca icon="h-9 w-9" text="text-xl" />
        </button>

        {/* navegação (desktop) */}
        <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <button onClick={onHome} className="hover:text-slate-900 dark:hover:text-white">Início</button>
          <button onClick={() => onNavegar('precos')} className="hover:text-slate-900 dark:hover:text-white">Preços</button>
          <button onClick={() => onNavegar('sobre')} className="hover:text-slate-900 dark:hover:text-white">Sobre</button>
          <button onClick={() => onNavegar('contato')} className="hover:text-slate-900 dark:hover:text-white">Contato</button>
        </div>

        {/* ações (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          <button onClick={onToggleDark} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {usuario ? (
            <div className="flex items-center gap-1">
              {isAdmin && <button onClick={onAdmin} className="rounded-full px-3 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10">Admin</button>}
              <button onClick={onMeusCurriculos} className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Meus currículos</button>
              {onSair && <button onClick={onSair} title="Sair" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><LogOut className="h-5 w-5" /></button>}
            </div>
          ) : (
            onEntrar && <button onClick={onEntrar} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10">Entrar</button>
          )}
          <button onClick={onIniciar} className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ background: INDIGO }}>
            Criar meu currículo
          </button>
        </div>

        {/* hambúrguer (mobile) */}
        <button onClick={() => setMenu((v) => !v)} aria-label="Menu" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-200 dark:hover:bg-white/10">
          {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* painel (mobile) */}
      {menu && (
        <div className="border-t border-slate-100 px-4 py-3 md:hidden dark:border-white/10">
          <div className="flex flex-col gap-1">
            <button className={linkM} onClick={() => { onHome(); fechar(); }}>Início</button>
            <button className={linkM} onClick={() => { onNavegar('precos'); fechar(); }}>Preços</button>
            <button className={linkM} onClick={() => { onNavegar('sobre'); fechar(); }}>Sobre</button>
            <button className={linkM} onClick={() => { onNavegar('contato'); fechar(); }}>Contato</button>
            <div className="my-1 border-t border-slate-100 dark:border-white/10" />
            {usuario ? (
              <>
                {isAdmin && <button className={`${linkM} font-bold text-indigo-600`} onClick={() => { onAdmin?.(); fechar(); }}>Painel admin</button>}
                <button className={linkM} onClick={() => { onMeusCurriculos?.(); fechar(); }}>Meus currículos</button>
                {onSair && <button className={linkM} onClick={() => { onSair(); fechar(); }}>Sair ({usuario.nome.split(' ')[0]})</button>}
              </>
            ) : (
              onEntrar && <button className={linkM} onClick={() => { onEntrar(); fechar(); }}>Entrar</button>
            )}
            <button className={linkM} onClick={onToggleDark}>{dark ? 'Tema claro' : 'Tema escuro'}</button>
            <button onClick={() => { onIniciar(); fechar(); }} className="mt-1 rounded-xl px-4 py-3 text-center text-sm font-semibold text-white" style={{ background: INDIGO }}>
              Criar meu currículo
            </button>
          </div>
        </div>
      )}
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
            <LogoIcon className="h-7 w-7" /> Curriculou
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
