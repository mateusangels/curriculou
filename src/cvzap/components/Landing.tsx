import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, MousePointerClick, MessageSquareText, FileDown, Wand2, Palette,
  LayoutGrid, ChevronDown, Star, ArrowRight,
} from 'lucide-react';
import { MODELOS } from '../design/presets';
import { SECOES_PADRAO } from '../design/types';
import { documentoHTML } from '../design/render';
import { AMOSTRA } from '../templates/shared';
import { INDIGO, SiteHeader, SiteFooter, SitePagina } from './SiteShell';
import { TestimonialsColumn, type Depoimento } from '@/components/ui/testimonials-columns';
import type { Usuario } from '../lib/auth';

interface Props {
  onIniciar: () => void;
  onNavegar: (p: SitePagina) => void;
  dark: boolean;
  onToggleDark: () => void;
  usuario?: Usuario | null;
  onEntrar?: () => void;
  onSair?: () => void;
  onMeusCurriculos?: () => void;
}

const A4_W = 794;

// palavra que gira no título do hero
function PalavraGirando() {
  const palavras = useMemo(() => ['profissional', 'moderno', 'aprovado', 'que impressiona', 'impecável'], []);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setI((p) => (p + 1) % palavras.length), 2200);
    return () => clearTimeout(t);
  }, [i, palavras]);
  return (
    <span className="relative block h-[1.15em] overflow-hidden">
      {palavras.map((p, idx) => (
        <motion.span
          key={p}
          className="absolute left-0 font-extrabold"
          style={{ color: INDIGO }}
          initial={{ opacity: 0, y: '-100%' }}
          transition={{ type: 'spring', stiffness: 50 }}
          animate={i === idx ? { y: 0, opacity: 1 } : { y: i > idx ? '-130%' : '130%', opacity: 0 }}
        >
          {p}
        </motion.span>
      ))}
    </span>
  );
}

// depoimentos (feedbacks) — contexto de quem procura emprego
const DEPOIMENTOS: Depoimento[] = [
  { text: 'Montei meu currículo em 10 minutos e me chamaram pra entrevista na semana seguinte.', image: 'https://randomuser.me/api/portraits/women/12.jpg', name: 'Juliana Alves', role: 'Auxiliar Administrativo' },
  { text: 'Eu não sabia o que escrever. O assistente perguntou tudo e deixou bonito.', image: 'https://randomuser.me/api/portraits/men/22.jpg', name: 'Marcos Pereira', role: 'Vendedor' },
  { text: 'Consegui meu primeiro emprego com o currículo daqui. Recomendo demais!', image: 'https://randomuser.me/api/portraits/women/33.jpg', name: 'Beatriz Santos', role: 'Jovem Aprendiz' },
  { text: 'Os modelos são lindos e dá pra trocar a cor. Ficou com cara de profissional.', image: 'https://randomuser.me/api/portraits/men/44.jpg', name: 'Rafael Lima', role: 'Designer' },
  { text: 'Fiz tudo pelo celular mesmo. Simples e rápido.', image: 'https://randomuser.me/api/portraits/women/55.jpg', name: 'Camila Souza', role: 'Atendente' },
  { text: 'Baixei em PDF e mandei na hora. Sem complicação.', image: 'https://randomuser.me/api/portraits/men/66.jpg', name: 'Diego Fernandes', role: 'Motorista' },
  { text: 'A correção de texto ajudou muito — meu português não é dos melhores.', image: 'https://randomuser.me/api/portraits/women/68.jpg', name: 'Patrícia Gomes', role: 'Repositora' },
  { text: 'Testei vários sites e esse foi o mais fácil de usar.', image: 'https://randomuser.me/api/portraits/men/76.jpg', name: 'Lucas Martins', role: 'Estagiário' },
  { text: 'Atualizei meu currículo pra uma vaga nova em minutos.', image: 'https://randomuser.me/api/portraits/women/82.jpg', name: 'Fernanda Rocha', role: 'Analista' },
];

function MiniModelo({ idx, escala = 0.26 }: { idx: number; escala?: number }) {
  const m = MODELOS[idx % MODELOS.length];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" style={{ width: A4_W * escala, height: A4_W * 1.414 * escala }}>
      <iframe title={m.nome} srcDoc={documentoHTML(AMOSTRA, m.design, SECOES_PADRAO)} sandbox="allow-same-origin" scrolling="no" tabIndex={-1}
        style={{ width: A4_W, height: A4_W * 1.414, border: 0, transform: `scale(${escala})`, transformOrigin: 'top left', pointerEvents: 'none' }} />
    </div>
  );
}

export default function Landing({ onIniciar, onNavegar, dark, onToggleDark, usuario, onEntrar, onSair, onMeusCurriculos }: Props) {
  const [faq, setFaq] = useState<number | null>(0);
  const [verMais, setVerMais] = useState(false);
  const idxsModelos = verMais ? MODELOS.map((_, i) => i) : [0, 1, 3, 5, 6, 8];

  return (
    <div className="min-h-[100dvh] bg-white text-slate-800 dark:bg-[#0b1020] dark:text-slate-100">
      <SiteHeader onIniciar={onIniciar} onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onNavegar={onNavegar} dark={dark} onToggleDark={onToggleDark} usuario={usuario} onEntrar={onEntrar} onSair={onSair} onMeusCurriculos={onMeusCurriculos} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-3xl" style={{ background: INDIGO }} />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#ecf1fd', color: INDIGO }}>
              <Sparkles className="h-3.5 w-3.5" /> Editor de currículo online
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl">
              Crie um currículo
              <PalavraGirando />
              <span className="block">em minutos</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-slate-600 dark:text-slate-300">
              Escolha um modelo, edite direto na tela e baixe em PDF. Sem complicação — e se preferir, a assistente Camila monta tudo por você no chat.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={onIniciar} className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:scale-[1.02]" style={{ background: INDIGO, boxShadow: '0 12px 30px -8px rgba(75,79,242,.5)' }}>
                <MousePointerClick className="h-5 w-5" /> Criar um CV do zero
              </button>
              <a href="#modelos" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">
                Ver modelos <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
              <div className="flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              <span>Modelos aprovados por recrutadores</span>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="rotate-[-4deg]"><MiniModelo idx={0} escala={0.34} /></div>
            <div className="absolute -right-2 top-10 rotate-[5deg] sm:right-6"><MiniModelo idx={3} escala={0.28} /></div>
          </div>
        </div>
      </section>

      {/* PASSOS */}
      <section id="passos" className="bg-[#f7f8ff] py-16 dark:bg-white/5">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-extrabold">Seu currículo em 4 passos</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-600 dark:text-slate-300">Rápido, simples e sem precisar de experiência.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: 1, t: 'Escolha um modelo', d: 'Selecione entre vários designs profissionais.' },
              { n: 2, t: 'Preencha os dados', d: 'Edite na tela ou deixe a Camila perguntar no chat.' },
              { n: 3, t: 'Personalize o design', d: 'Cores, fontes, colunas e seções do seu jeito.' },
              { n: 4, t: 'Baixe em PDF', d: 'Pronto para enviar para qualquer vaga.' },
            ].map((p) => (
              <div key={p.n} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="grid h-10 w-10 place-items-center rounded-xl text-lg font-bold text-white" style={{ background: INDIGO }}>{p.n}</div>
                <h3 className="mt-4 font-bold">{p.t}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-extrabold">Por que criar com o Curriculou</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: <LayoutGrid className="h-6 w-6" />, t: 'Modelos profissionais', d: 'Designs limpos e aprovados, prontos para impressionar.' },
              { i: <MousePointerClick className="h-6 w-6" />, t: 'Edição na tela', d: 'Clique em qualquer campo e edite — WYSIWYG de verdade.' },
              { i: <MessageSquareText className="h-6 w-6" />, t: 'Assistente por chat', d: 'A Camila pergunta e preenche o currículo por você.' },
              { i: <Wand2 className="h-6 w-6" />, t: 'Correção automática', d: 'Formata nome, telefone, datas e melhora o português.' },
              { i: <Palette className="h-6 w-6" />, t: 'Design flexível', d: 'Cores, fontes, colunas e seções personalizáveis.' },
              { i: <FileDown className="h-6 w-6" />, t: 'PDF na hora', d: 'Baixe seu currículo pronto em segundos.' },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 p-6 transition hover:shadow-md dark:border-white/10">
                <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: '#ecf1fd', color: INDIGO }}>{f.i}</div>
                <h3 className="mt-4 font-bold">{f.t}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODELOS */}
      <section id="modelos" className="bg-[#f7f8ff] py-16 dark:bg-white/5">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-extrabold">Modelos para todas as profissões</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-600 dark:text-slate-300">Escolha o seu favorito e comece agora.</p>
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {idxsModelos.map((idx) => (
              <button key={idx} onClick={onIniciar} className="group relative transition hover:-translate-y-1" title={`Usar o modelo ${MODELOS[idx].nome}`}>
                <MiniModelo idx={idx} escala={0.3} />
                <span className="mt-2 block text-center text-sm font-medium text-slate-500 dark:text-slate-400">{MODELOS[idx].nome}</span>
              </button>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => setVerMais((v) => !v)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-white dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">
              {verMais ? 'Ver menos modelos' : `Ver mais modelos (${MODELOS.length})`}
              <ChevronDown className={`h-4 w-4 transition ${verMais ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={onIniciar} className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-semibold text-white shadow-lg" style={{ background: INDIGO }}>
              Usar um modelo <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <span className="rounded-lg border border-slate-200 px-4 py-1 text-sm font-medium text-slate-500 dark:border-white/15 dark:text-slate-300">Depoimentos</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">O que dizem quem já usou</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Gente real que conquistou a vaga com o Curriculou.</p>
          </div>
          <div className="mt-10 flex max-h-[640px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
            <TestimonialsColumn testimonials={DEPOIMENTOS.slice(0, 3)} duration={15} />
            <TestimonialsColumn testimonials={DEPOIMENTOS.slice(3, 6)} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={DEPOIMENTOS.slice(6, 9)} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-center text-3xl font-extrabold">Dúvidas frequentes</h2>
          <div className="mt-10 space-y-3">
            {[
              { q: 'O Curriculou é gratuito?', a: 'Sim, você monta e visualiza seu currículo gratuitamente. Tudo fica salvo no seu navegador.' },
              { q: 'Preciso saber escrever bem?', a: 'Não. O sistema corrige a formatação, ajusta datas e telefones e ainda melhora a descrição das suas experiências.' },
              { q: 'Posso montar pelo celular?', a: 'Sim, o editor funciona em desktop e celular. No celular você também pode usar o assistente por chat.' },
              { q: 'Como baixo em PDF?', a: 'Basta clicar em "Baixar" no editor. O currículo sai exatamente como você vê na tela.' },
              { q: 'Dá pra escolher cores e modelos?', a: 'Sim! Você troca de modelo, cor, fonte, colunas e liga/desliga seções quando quiser.' },
            ].map((item, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                <button onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold">
                  {item.q}
                  <ChevronDown className={`h-5 w-5 shrink-0 transition ${faq === i ? 'rotate-180' : ''}`} />
                </button>
                {faq === i && <p className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-400">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl px-8 py-14 text-center text-white" style={{ background: `linear-gradient(135deg, ${INDIGO}, #0e2053)` }}>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Pronto para conquistar a vaga?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">Crie seu currículo profissional agora — leva poucos minutos.</p>
          <button onClick={onIniciar} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold" style={{ color: INDIGO }}>
            <MousePointerClick className="h-5 w-5" /> Começar agora
          </button>
        </div>
      </section>

      <SiteFooter onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onNavegar={onNavegar} />
    </div>
  );
}
