import { useState } from 'react';
import { Check, Mail, MessageSquareText, Wand2, ShieldCheck } from 'lucide-react';
import { INDIGO, SiteHeader, SiteFooter, SitePagina } from './SiteShell';

interface Props {
  pagina: SitePagina;
  onIniciar: () => void;
  onHome: () => void;
  onNavegar: (p: SitePagina) => void;
  dark: boolean;
  onToggleDark: () => void;
}

export default function SitePages({ pagina, onIniciar, onHome, onNavegar, dark, onToggleDark }: Props) {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-800 dark:bg-[#0b1020] dark:text-slate-100">
      <SiteHeader onIniciar={onIniciar} onHome={onHome} onNavegar={onNavegar} dark={dark} onToggleDark={onToggleDark} />
      <main className="mx-auto max-w-4xl px-5 py-14">
        {pagina === 'precos' && <Precos onIniciar={onIniciar} />}
        {pagina === 'contato' && <Contato />}
        {pagina === 'sobre' && <Sobre onIniciar={onIniciar} />}
        {pagina === 'termos' && <Termos />}
        {pagina === 'privacidade' && <Privacidade />}
      </main>
      <SiteFooter onHome={onHome} onNavegar={onNavegar} />
    </div>
  );
}

function Titulo({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{children}</h1>
      {sub && <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">{sub}</p>}
    </div>
  );
}

function Precos({ onIniciar }: { onIniciar: () => void }) {
  const planos = [
    {
      nome: 'Gratuito', preco: 'R$ 0', desc: 'Tudo que você precisa para começar.',
      itens: ['Editor completo na tela', 'Assistente por chat', 'Todos os modelos', 'Download em PDF', 'Salvo no seu navegador'],
      destaque: false, cta: 'Começar grátis',
    },
    {
      nome: 'Pro', preco: 'Em breve', desc: 'Recursos avançados com IA.',
      itens: ['Tudo do Gratuito', 'Melhorar com IA avançada', 'Adaptar à vaga', 'Tradução automática', 'Currículos na nuvem'],
      destaque: true, cta: 'Avise-me',
    },
  ];
  return (
    <>
      <Titulo sub="Comece de graça. Recursos com IA chegam em breve.">Planos simples e transparentes</Titulo>
      <div className="grid gap-6 sm:grid-cols-2">
        {planos.map((p) => (
          <div key={p.nome} className={`rounded-2xl border p-7 ${p.destaque ? 'border-2 shadow-lg' : 'border-slate-200 dark:border-white/10'}`} style={p.destaque ? { borderColor: INDIGO } : undefined}>
            <h2 className="text-lg font-bold">{p.nome}</h2>
            <div className="mt-2 text-3xl font-extrabold" style={{ color: p.destaque ? INDIGO : undefined }}>{p.preco}</div>
            <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {p.itens.map((it) => (
                <li key={it} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: INDIGO }} /> {it}</li>
              ))}
            </ul>
            <button onClick={onIniciar} className={`mt-6 w-full rounded-xl py-3 font-semibold transition ${p.destaque ? 'text-white hover:opacity-90' : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200'}`} style={p.destaque ? { background: INDIGO } : undefined}>
              {p.cta}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function Contato() {
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', msg: '' });
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const corpo = encodeURIComponent(`Nome: ${form.nome}\nE-mail: ${form.email}\n\n${form.msg}`);
    window.location.href = `mailto:contato@curriculou.com.br?subject=Contato%20Curriculou&body=${corpo}`;
    setEnviado(true);
  };
  const inp = 'w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/15';
  return (
    <>
      <Titulo sub="Tem alguma dúvida ou sugestão? Fale com a gente.">Contato</Titulo>
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <Mail className="h-5 w-5" style={{ color: INDIGO }} />
            <div>
              <p className="font-semibold">E-mail</p>
              <p className="text-sm text-slate-500">contato@curriculou.com.br</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <MessageSquareText className="h-5 w-5" style={{ color: INDIGO }} />
            <div>
              <p className="font-semibold">Assistente Camila</p>
              <p className="text-sm text-slate-500">Dúvidas sobre como montar? Use o chat dentro do editor.</p>
            </div>
          </div>
        </div>
        <form onSubmit={enviar} className="space-y-3">
          <input className={inp} placeholder="Seu nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <input className={inp} type="email" placeholder="Seu e-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <textarea className={inp} rows={4} placeholder="Sua mensagem" value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} required />
          <button type="submit" className="w-full rounded-xl py-3 font-semibold text-white" style={{ background: INDIGO }}>Enviar mensagem</button>
          {enviado && <p className="text-center text-sm text-green-600">Abrindo seu e-mail... obrigado pelo contato!</p>}
        </form>
      </div>
    </>
  );
}

function Sobre({ onIniciar }: { onIniciar: () => void }) {
  return (
    <>
      <Titulo sub="Acreditamos que todo mundo merece um currículo bonito — sem complicação.">Sobre o Curriculou</Titulo>
      <div className="prose-sm mx-auto max-w-2xl space-y-4 text-slate-600 dark:text-slate-300">
        <p>O Curriculou nasceu para resolver um problema simples: criar um currículo profissional costuma ser chato, confuso e demorado. Muita gente trava na formatação, no que escrever ou em deixar o documento com cara de profissional.</p>
        <p>Por aqui você só precisa preencher — ou conversar. Nosso editor formata os campos enquanto você digita, corrige erros comuns, sugere habilidades e transforma descrições simples em texto profissional. E se preferir, a assistente Camila monta tudo por você no chat.</p>
        <p>O resultado é um currículo limpo, moderno e pronto para baixar em PDF, em poucos minutos.</p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {[
          { i: <Wand2 className="h-6 w-6" />, t: 'Simples', d: 'Sem formulários intermináveis.' },
          { i: <MessageSquareText className="h-6 w-6" />, t: 'Inteligente', d: 'Corrige e melhora seus textos.' },
          { i: <ShieldCheck className="h-6 w-6" />, t: 'Seguro', d: 'Seus dados ficam no seu navegador.' },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 p-6 dark:border-white/10">
            <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: '#ecf1fd', color: INDIGO }}>{f.i}</div>
            <h3 className="mt-4 font-bold">{f.t}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <button onClick={onIniciar} className="rounded-xl px-7 py-3.5 font-semibold text-white" style={{ background: INDIGO }}>Criar meu currículo</button>
      </div>
    </>
  );
}

function Doc({ titulo, paras }: { titulo: string; paras: Array<{ h?: string; p: string }> }) {
  return (
    <>
      <Titulo>{titulo}</Titulo>
      <div className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <p className="text-xs text-slate-400">Última atualização: junho de 2026.</p>
        {paras.map((x, i) => (
          <div key={i}>
            {x.h && <h2 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">{x.h}</h2>}
            <p>{x.p}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function Termos() {
  return <Doc titulo="Termos de Uso" paras={[
    { p: 'Ao usar o Curriculou, você concorda com estes termos. O serviço permite criar, editar e baixar currículos de forma gratuita.' },
    { h: '1. Uso do serviço', p: 'Você é responsável pelas informações que insere no seu currículo. O Curriculou apenas organiza e formata esses dados — não verificamos a veracidade do conteúdo informado.' },
    { h: '2. Conta e dados', p: 'No modo atual, os dados do seu currículo ficam armazenados localmente no seu navegador. Limpar os dados do navegador pode apagar o currículo em andamento.' },
    { h: '3. Propriedade', p: 'O currículo gerado é seu. A plataforma, os modelos e o código do Curriculou são de nossa propriedade e não podem ser revendidos sem autorização.' },
    { h: '4. Limitação de responsabilidade', p: 'O Curriculou é fornecido "como está". Não garantimos contratações ou resultados específicos a partir do uso do serviço.' },
    { h: '5. Alterações', p: 'Podemos atualizar estes termos a qualquer momento. O uso contínuo após mudanças significa concordância com a nova versão.' },
  ]} />;
}

function Privacidade() {
  return <Doc titulo="Política de Privacidade" paras={[
    { p: 'Sua privacidade é importante para nós. Esta política explica como tratamos suas informações no Curriculou.' },
    { h: '1. Dados que coletamos', p: 'No modo local, os dados do currículo (nome, contato, experiências etc.) são salvos apenas no seu navegador (localStorage) e não são enviados aos nossos servidores.' },
    { h: '2. Como usamos', p: 'As informações são usadas exclusivamente para montar e exibir o seu currículo na tela e gerar o PDF.' },
    { h: '3. Compartilhamento', p: 'Não vendemos nem compartilhamos seus dados pessoais com terceiros.' },
    { h: '4. Foto', p: 'A foto que você adiciona é processada no próprio navegador e armazenada localmente, junto ao currículo.' },
    { h: '5. Contato', p: 'Em caso de dúvidas sobre privacidade, escreva para contato@curriculou.com.br.' },
  ]} />;
}
