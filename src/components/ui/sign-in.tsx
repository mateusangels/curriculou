// ── Tela de login (preparada para a FASE DE LOGIN — ainda não conectada) ─────
// Componente de UI pronto; quando formos implementar contas (banco Hostinger
// + Google), basta renderizar <SignInPage /> e ligar os callbacks à API.
// Obs.: usa algumas classes utilitárias (text-muted-foreground, bg-primary…)
// que serão definidas quando integrarmos o tema; por ora não é renderizado.
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-500/5 transition-colors focus-within:border-indigo-400/70 focus-within:bg-indigo-500/10 dark:border-white/10">
    {children}
  </div>
);

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light tracking-tighter">Bem-vindo</span>,
  description = 'Acesse sua conta e continue criando currículos sem limite',
  heroImageSrc,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex h-[100dvh] w-[100dvw] flex-col md:flex-row">
      <section className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{title}</h1>
            <p className="text-slate-500">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div>
                <label className="text-sm font-medium text-slate-500">E-mail</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="Digite seu e-mail" className="w-full rounded-2xl bg-transparent p-4 text-sm focus:outline-none" />
                </GlassInputWrapper>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500">Senha</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Digite sua senha" className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm focus:outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" name="rememberMe" /> <span>Continuar conectado</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="text-indigo-500 transition-colors hover:underline">Esqueci a senha</a>
              </div>

              <button type="submit" className="w-full rounded-2xl bg-indigo-600 py-4 font-medium text-white transition-colors hover:bg-indigo-700">Entrar</button>
            </form>

            <div className="relative flex items-center justify-center">
              <span className="w-full border-t border-slate-200 dark:border-white/10"></span>
              <span className="absolute bg-white px-4 text-sm text-slate-400 dark:bg-slate-900">ou continue com</span>
            </div>

            <button onClick={onGoogleSignIn} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 py-4 transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
              <GoogleIcon /> Continuar com Google
            </button>

            <p className="text-center text-sm text-slate-500">
              Novo por aqui? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-indigo-500 transition-colors hover:underline">Criar conta</a>
            </p>
          </div>
        </div>
      </section>

      {heroImageSrc && (
        <section className="relative hidden flex-1 p-4 md:block">
          <div className="absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }} />
        </section>
      )}
    </div>
  );
};
