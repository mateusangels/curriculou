import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { X, Check, Loader2, FileDown, Crown, ShieldCheck, Sparkles, Clock, Mail } from 'lucide-react';
import { PRECO_INDIVIDUAL, PRECO_PRO_MES, PRECO_RETENCAO, formatarBRL, cobrar, iniciarCheckout, iniciarAssinatura, type Plano } from '../../lib/pagamento';
import { track } from '../../lib/track';

interface Props {
  comFoto: boolean;
  onPago: () => void;          // download limpo (pago) — usado no fallback local
  onBaixarGratis: () => void;  // download grátis com marca d'água
  onClose: () => void;
  onJaPaguei?: () => void;     // abre a recuperação de currículo já pago
  logado?: boolean;
  onPrecisaLogin?: () => void; // assinar exige conta
}

const MP_BLUE = '#009ee3';
const INDIGO = '#4b4ff2';
type Etapa = 'planos' | 'email' | 'processando' | 'sucesso' | 'motivo' | 'retencao';
const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

const MOTIVOS = [
  { key: 'caro', label: 'Está caro' },
  { key: 'so_um', label: 'Só precisava de um currículo' },
  { key: 'testando', label: 'Ainda estou testando' },
  { key: 'depois', label: 'Vou voltar depois' },
];

export default function PaywallModal({ comFoto, onPago, onBaixarGratis, onClose, onJaPaguei, logado, onPrecisaLogin }: Props) {
  const [etapa, setEtapa] = useState<Etapa>('planos');
  const [valorPago, setValorPago] = useState(PRECO_INDIVIDUAL);
  const [email, setEmail] = useState('');
  const [planoSel, setPlanoSel] = useState<{ plano: Plano; valor: number }>({ plano: 'individual', valor: PRECO_INDIVIDUAL });
  const [restante, setRestante] = useState(600); // 10 min de urgência na retenção

  // contador regressivo da oferta de retenção
  useEffect(() => {
    if (etapa !== 'retencao') return;
    const t = window.setInterval(() => setRestante((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [etapa]);
  const mmss = `${String(Math.floor(restante / 60)).padStart(2, '0')}:${String(restante % 60).padStart(2, '0')}`;

  // antes de pagar, pede o e-mail (opcional) para enviar o currículo/código.
  const irParaEmail = (plano: Plano, valor: number) => {
    setPlanoSel({ plano, valor });
    setValorPago(valor);
    setEtapa('email');
  };

  const pagar = async (plano: Plano, valor: number, emailArg?: string) => {
    track('checkout_inicio', plano);
    setValorPago(valor);
    setEtapa('processando');
    try {
      await iniciarCheckout(plano, emailArg); // redireciona ao Mercado Pago (sai daqui)
      return;
    } catch {
      // sem backend/token (ambiente local) → modo demonstração
      const r = await cobrar('Currículo Curriculou', valor);
      if (r.ok) { setEtapa('sucesso'); setTimeout(() => onPago(), 900); }
      else setEtapa('planos');
    }
  };

  const baixarGratis = () => { onBaixarGratis(); onClose(); };

  const assinarPro = async () => {
    if (!logado) {
      toast('Crie sua conta para assinar o Profissional. 🙂');
      onPrecisaLogin?.();
      return;
    }
    track('assinar_inicio');
    setEtapa('processando');
    setValorPago(PRECO_PRO_MES);
    try {
      await iniciarAssinatura(); // redireciona ao Mercado Pago (sai daqui)
    } catch {
      toast.error('Não foi possível iniciar a assinatura agora.');
      setEtapa('planos');
    }
  };

  // tentar fechar (X / fora) → vira tela de cancelamento (pergunta o motivo)
  const tentarFechar = () => {
    if (etapa === 'planos') setEtapa('motivo');
    else onClose();
  };
  const escolherMotivo = (key: string) => { if (key === 'caro') setEtapa('retencao'); else onClose(); };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 sm:p-4" onClick={tentarFechar}>
      <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        {/* topo */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 pt-4 pb-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4" style={{ color: MP_BLUE }} /> Pagamento seguro via Mercado Pago
          </div>
          <button onClick={tentarFechar} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        {etapa === 'sucesso' ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600"><Check className="h-9 w-9" /></div>
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Pagamento aprovado!</h2>
            <p className="mt-1 text-slate-500">Baixando seu currículo...</p>
          </div>
        ) : etapa === 'email' ? (
          <div className="px-6 py-8">
            <div className="mx-auto max-w-sm text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: 'rgba(75,79,242,0.12)', color: INDIGO }}>
                <Mail className="h-7 w-7" />
              </div>
              <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">Pra onde enviamos seu currículo?</h2>
              <p className="mt-1 text-sm text-slate-500">
                Assim que o pagamento confirmar (o Pix pode levar alguns minutos), mandamos seu currículo e o código de recuperação por e-mail — assim você nunca perde o acesso.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && emailValido(email)) pagar(planoSel.plano, planoSel.valor, email); }}
                placeholder="seu@email.com"
                autoFocus
                className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={() => pagar(planoSel.plano, planoSel.valor, email)}
                disabled={!emailValido(email)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: MP_BLUE }}
              >
                <ShieldCheck className="h-4 w-4" /> Ir para o pagamento — {formatarBRL(planoSel.valor)}
              </button>
              <button onClick={() => pagar(planoSel.plano, planoSel.valor)} className="mt-3 text-sm text-slate-400 hover:text-slate-600">
                Prefiro não informar e-mail
              </button>
            </div>
          </div>
        ) : etapa === 'processando' ? (
          <div className="px-6 py-12 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin" style={{ color: MP_BLUE }} />
            <p className="mt-4 font-medium text-slate-600 dark:text-slate-300">Processando {formatarBRL(valorPago)}...</p>
          </div>
        ) : etapa === 'motivo' ? (
          <div className="px-6 py-6 text-center">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Antes de sair...</h2>
            <p className="mt-1 text-slate-500">O que fez você desistir agora?</p>
            <div className="mx-auto mt-5 grid max-w-sm gap-2">
              {MOTIVOS.map((m) => (
                <button key={m.key} onClick={() => escolherMotivo(m.key)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-400 hover:bg-sky-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  {m.label}
                </button>
              ))}
            </div>
            <button onClick={() => setEtapa('planos')} className="mt-4 text-sm text-slate-400 hover:text-slate-600">Voltar aos planos</button>
          </div>
        ) : etapa === 'retencao' ? (
          <div className="px-6 py-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600"><Crown className="h-7 w-7" /></div>
            <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">Oferta exclusiva para continuar sua busca</h2>
            <p className="mt-1 text-slate-500">Plano Profissional com desconto pelos próximos 30 dias:</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-lg text-slate-400 line-through">{formatarBRL(PRECO_PRO_MES)}/mês</span>
              <span className="text-3xl font-extrabold text-green-600">{formatarBRL(PRECO_RETENCAO)}</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">-{Math.round((1 - PRECO_RETENCAO / PRECO_PRO_MES) * 100)}%</span>
            </div>
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600 dark:bg-red-500/10">
              <Clock className="h-4 w-4" /> Oferta expira em {mmss}
            </div>
            <button onClick={() => irParaEmail('retencao', PRECO_RETENCAO)} className="mt-5 w-full rounded-xl py-3.5 font-bold text-white" style={{ background: INDIGO }}>
              Aproveitar por {formatarBRL(PRECO_RETENCAO)}
            </button>
            <button onClick={onClose} className="mt-2 w-full text-sm text-slate-400 hover:text-slate-600">Não, obrigado</button>
          </div>
        ) : (
          // ── PLANOS ──────────────────────────────────────────────────────────
          <div className="px-5 py-5 sm:px-6">
            <h2 className="text-center text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">Baixe seu currículo profissional</h2>
            <p className="mt-1 text-center text-sm text-slate-500">Escolha como quer baixar</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {/* Gratuito */}
              <div className="flex flex-col rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">Gratuito</h3>
                <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">R$ 0</div>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {['Criar e editar', 'Visualizar na tela', 'Todos os modelos'].map((b) => <Item key={b}>{b}</Item>)}
                  <li className="flex items-center gap-2 text-amber-600"><Check className="h-4 w-4" /> Download com marca d'água</li>
                </ul>
                <button onClick={baixarGratis} className="mt-4 w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                  Baixar com marca d'água
                </button>
              </div>

              {/* Individual */}
              <div className="flex flex-col rounded-2xl border-2 p-5" style={{ borderColor: MP_BLUE }}>
                <h3 className="font-bold text-slate-900 dark:text-white">Individual</h3>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-2xl font-extrabold" style={{ color: MP_BLUE }}>{formatarBRL(PRECO_INDIVIDUAL)}</span>
                  <span className="pb-0.5 text-xs text-slate-400">único</span>
                </div>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {['1 download em PDF', 'Sem marca d\'água', comFoto ? 'Com a sua foto' : 'Foto incluída', 'Currículo ATS Friendly'].map((b) => <Item key={b}>{b}</Item>)}
                </ul>
                <button onClick={() => irParaEmail('individual', PRECO_INDIVIDUAL)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white" style={{ background: MP_BLUE }}>
                  <FileDown className="h-4 w-4" /> Pagar e baixar
                </button>
              </div>

              {/* Profissional */}
              <div className="relative flex flex-col rounded-2xl border-2 p-5" style={{ borderColor: INDIGO }}>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold text-white" style={{ background: INDIGO }}>Mais Popular</span>
                <h3 className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white"><Crown className="h-4 w-4 text-amber-500" /> Profissional</h3>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-2xl font-extrabold" style={{ color: INDIGO }}>{formatarBRL(PRECO_PRO_MES)}</span>
                  <span className="pb-0.5 text-xs text-slate-400">/mês</span>
                </div>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {['Currículos ilimitados', 'Downloads ilimitados', 'Edições ilimitadas', 'Melhorias por IA', 'Novos modelos', 'Atualizações futuras'].map((b) => <Item key={b}>{b}</Item>)}
                </ul>
                <button onClick={assinarPro} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white" style={{ background: INDIGO }}>
                  <Sparkles className="h-4 w-4" /> Assinar
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-1">
              <button onClick={tentarFechar} className="text-sm text-slate-400 hover:text-slate-600">Agora não</button>
              {onJaPaguei && (
                <button onClick={onJaPaguei} className="text-sm font-medium text-sky-600 hover:underline">Já paguei — quero baixar de novo</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-green-500" /> {children}</li>;
}
