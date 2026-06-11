import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Eye, UserPlus, Crown, Activity, RefreshCw } from 'lucide-react';
import { LogoMarca } from './Logo';
import { API_URL } from '../lib/pagamento';

interface Props { onVoltar: () => void }

interface Resumo { visitantes: number; pageviews: number; pv24: number; cadastros: number; assinantes: number; porTipo: Record<string, number> }
interface UsuarioAdmin { id: string; nome: string; email: string; telefone?: string; plano: string; google?: boolean; criado_em: number }
interface Evento { tipo: string; visitante?: string; user_id?: string; dados?: string; criado_em: number }

const LABEL: Record<string, string> = {
  pageview: 'Visita', cadastro: 'Cadastro', login: 'Login',
  paywall_abrir: 'Abriu o paywall', checkout_inicio: 'Iniciou pagamento',
  assinar_inicio: 'Iniciou assinatura', download: 'Baixou (pago)', download_gratis: 'Baixou (com marca)',
};
const label = (t: string) => LABEL[t] || t;

function authHeaders() {
  const t = localStorage.getItem('curriculou:token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}
async function getJSON<T>(rota: string): Promise<{ status: number; data: T | null }> {
  try {
    const r = await fetch(`${API_URL}${rota}`, { headers: { ...authHeaders() } });
    return { status: r.status, data: r.ok ? await r.json() : null };
  } catch { return { status: 0, data: null }; }
}

function quando(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `há ${s}s`;
  if (s < 3600) return `há ${Math.floor(s / 60)}min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)}h`;
  return new Date(ts).toLocaleDateString('pt-BR');
}

function Card({ icon, valor, rotulo, cor }: { icon: React.ReactNode; valor: number; rotulo: string; cor: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
      <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: cor }}>{icon}</div>
      <div className="mt-3 text-3xl font-extrabold">{valor.toLocaleString('pt-BR')}</div>
      <div className="text-sm text-slate-500">{rotulo}</div>
    </div>
  );
}

export default function Admin({ onVoltar }: Props) {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const carregar = async () => {
    const r = await getJSON<Resumo>('/api/admin/resumo');
    if (!r.data) {
      setErroMsg(
        r.status === 403 ? 'Acesso restrito: entre com a conta de administrador (angelsrequires@gmail.com).'
        : r.status === 404 ? 'O servidor ainda não tem o painel (404). Faça o Pull/Deploy na Hostinger pra atualizar.'
        : r.status === 401 ? 'Sua sessão expirou. Saia e entre de novo.'
        : r.status === 0 ? 'Sem conexão com o servidor.'
        : `Falha ao carregar (erro ${r.status}).`,
      );
      return;
    }
    setErroMsg(null);
    setResumo(r.data);
    const u = await getJSON<{ usuarios: UsuarioAdmin[] }>('/api/admin/usuarios');
    setUsuarios(u.data?.usuarios || []);
  };
  const carregarEventos = async () => {
    const e = await getJSON<{ eventos: Evento[] }>('/api/admin/eventos?limit=60');
    if (e.data) setEventos(e.data.eventos || []);
  };

  useEffect(() => { carregar(); carregarEventos(); }, []);
  // feed "ao vivo": atualiza a cada 5s
  useEffect(() => { const t = setInterval(carregarEventos, 5000); return () => clearInterval(t); }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 dark:bg-[#0b1020] dark:text-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-3.5 backdrop-blur dark:border-white/10 dark:bg-[#0b1020]/90">
        <button onClick={onVoltar} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300"><ArrowLeft className="h-4 w-4" /> Voltar</button>
        <LogoMarca icon="h-8 w-8" text="text-lg" />
        <button onClick={() => { carregar(); carregarEventos(); }} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 dark:border-white/15 dark:text-slate-300"><RefreshCw className="h-4 w-4" /> Atualizar</button>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-2xl font-extrabold">Painel do dono</h1>
        <p className="mt-1 text-slate-500">Métricas, cadastros e atividade ao vivo do Curriculou.</p>

        {erroMsg ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/30 dark:bg-red-500/10">{erroMsg}</div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
              <Card icon={<Eye className="h-5 w-5" />} valor={resumo?.visitantes ?? 0} rotulo="Visitantes únicos" cor="#4b4ff2" />
              <Card icon={<Activity className="h-5 w-5" />} valor={resumo?.pv24 ?? 0} rotulo="Visitas (24h)" cor="#0ea5e9" />
              <Card icon={<Eye className="h-5 w-5" />} valor={resumo?.pageviews ?? 0} rotulo="Visitas totais" cor="#14b8a6" />
              <Card icon={<UserPlus className="h-5 w-5" />} valor={resumo?.cadastros ?? 0} rotulo="Cadastros" cor="#f59e0b" />
              <Card icon={<Crown className="h-5 w-5" />} valor={resumo?.assinantes ?? 0} rotulo="Assinantes Pro" cor="#16a34a" />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {/* Funil / ações */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                <h2 className="font-bold">Ações dos usuários</h2>
                <p className="text-xs text-slate-400">Onde clicam e onde param (funil).</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {Object.entries(resumo?.porTipo || {}).sort((a, b) => b[1] - a[1]).map(([t, c]) => (
                    <li key={t} className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-white/10">
                      <span className="text-slate-600 dark:text-slate-300">{label(t)}</span>
                      <span className="font-bold">{c}</span>
                    </li>
                  ))}
                  {!resumo?.porTipo || Object.keys(resumo.porTipo).length === 0 ? <li className="text-slate-400">Sem eventos ainda.</li> : null}
                </ul>
              </section>

              {/* Feed ao vivo */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-white/10 dark:bg-white/5">
                <h2 className="flex items-center gap-2 font-bold"><span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Atividade ao vivo</h2>
                <p className="text-xs text-slate-400">Atualiza a cada 5 segundos.</p>
                <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto text-sm">
                  {eventos.map((e, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5 dark:border-white/10">
                      <span><b>{label(e.tipo)}</b> {e.dados && <span className="text-slate-400">· {e.dados}</span>}</span>
                      <span className="shrink-0 text-xs text-slate-400">{quando(e.criado_em)}</span>
                    </li>
                  ))}
                  {eventos.length === 0 && <li className="text-slate-400">Nenhuma atividade ainda.</li>}
                </ul>
              </section>
            </div>

            {/* Usuários */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
              <h2 className="flex items-center gap-2 font-bold"><Users className="h-4 w-4" /> Cadastros ({usuarios.length})</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr><th className="py-2 pr-3">Nome</th><th className="py-2 pr-3">E-mail</th><th className="py-2 pr-3">Telefone</th><th className="py-2 pr-3">Plano</th><th className="py-2 pr-3">Origem</th><th className="py-2 pr-3">Data</th></tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id} className="border-t border-slate-100 dark:border-white/10">
                        <td className="py-2 pr-3 font-medium">{u.nome}</td>
                        <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                        <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{u.telefone || '—'}</td>
                        <td className="py-2 pr-3">{u.plano === 'pro' ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Pro</span> : <span className="text-slate-400">Free</span>}</td>
                        <td className="py-2 pr-3 text-slate-500">{u.google ? 'Google' : 'E-mail'}</td>
                        <td className="py-2 pr-3 text-slate-400">{new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                    {usuarios.length === 0 && <tr><td colSpan={6} className="py-4 text-slate-400">Nenhum cadastro ainda.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
