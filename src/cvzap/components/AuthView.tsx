import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { SignInPage } from '@/components/ui/sign-in';
import { LogoMarca } from './Logo';
import { registrar, login, loginComGoogle, type Usuario } from '../lib/auth';

interface Props { onLogado: (u: Usuario) => void; onVoltar: () => void }

const HERO = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80';

export default function AuthView({ onLogado, onVoltar }: Props) {
  const [modo, setModo] = useState<'login' | 'registrar'>('login');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCarregando(true);
    try {
      const { usuario } = await login(String(fd.get('email') || ''), String(fd.get('password') || ''));
      toast.success(`Bem-vindo de volta, ${usuario.nome.split(' ')[0]}!`);
      onLogado(usuario);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  };

  const criarConta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCarregando(true);
    try {
      const { usuario } = await registrar(String(fd.get('nome') || ''), String(fd.get('email') || ''), String(fd.get('senha') || ''));
      toast.success('Conta criada! 🎉');
      onLogado(usuario);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setCarregando(false);
    }
  };

  const entrarGoogle = async () => {
    try {
      const { usuario } = await loginComGoogle();
      toast.success(`Bem-vindo, ${usuario.nome.split(' ')[0]}!`);
      onLogado(usuario);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
      console.error('Google login falhou:', code || err, err);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return; // o usuário fechou
      const ajuda: Record<string, string> = {
        'auth/operation-not-allowed': 'Ative o provedor Google no Firebase (Authentication → Sign-in method).',
        'auth/configuration-not-found': 'Habilite o Authentication e o provedor Google no console do Firebase.',
        'auth/unauthorized-domain': 'Adicione este domínio em Authentication → Settings → Authorized domains.',
        'auth/popup-blocked': 'Seu navegador bloqueou o pop-up. Permita pop-ups e tente de novo.',
      };
      toast.error(ajuda[code] || (code ? `Erro do Google: ${code}` : 'Não foi possível entrar com o Google.'), { duration: 9000 });
    }
  };

  return (
    <div className="relative">
      <button onClick={onVoltar} className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur hover:bg-white dark:bg-slate-800/80 dark:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {modo === 'login' ? (
        <SignInPage
          title={<LogoMarca icon="h-9 w-9" text="text-2xl" />}
          description="Entre para baixar sem limite e salvar seus currículos."
          heroImageSrc={HERO}
          onSignIn={entrar}
          onGoogleSignIn={entrarGoogle}
          onResetPassword={() => toast('Recuperação de senha em breve.')}
          onCreateAccount={() => setModo('registrar')}
        />
      ) : (
        <div className="flex min-h-[100dvh] items-center justify-center p-6">
          <form onSubmit={criarConta} className="w-full max-w-md">
            <div className="mb-6"><LogoMarca icon="h-10 w-10" text="text-2xl" /></div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Criar conta</h1>
            <p className="mt-1 text-slate-500">Grátis. Leva menos de um minuto.</p>

            <div className="mt-6 space-y-4">
              <Campo label="Nome">
                <input name="nome" required placeholder="Seu nome" className="w-full rounded-xl border border-slate-200 bg-transparent p-3.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-700" />
              </Campo>
              <Campo label="E-mail">
                <input name="email" type="email" required placeholder="voce@email.com" className="w-full rounded-xl border border-slate-200 bg-transparent p-3.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-700" />
              </Campo>
              <Campo label="Senha (mín. 6 caracteres)">
                <div className="relative">
                  <input name="senha" type={mostrarSenha ? 'text' : 'password'} required minLength={6} placeholder="Crie uma senha" className="w-full rounded-xl border border-slate-200 bg-transparent p-3.5 pr-12 text-sm outline-none focus:border-indigo-400 dark:border-slate-700" />
                  <button type="button" onClick={() => setMostrarSenha((v) => !v)} className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </Campo>
            </div>

            <button type="submit" disabled={carregando} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-70">
              {carregando && <Loader2 className="h-4 w-4 animate-spin" />} Criar minha conta
            </button>
            <p className="mt-4 text-center text-sm text-slate-500">
              Já tem conta? <button type="button" onClick={() => setModo('login')} className="font-medium text-indigo-600 hover:underline">Entrar</button>
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
