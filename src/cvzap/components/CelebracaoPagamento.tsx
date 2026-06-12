import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Heart } from 'lucide-react';

interface Props {
  nome?: string;        // primeiro nome do usuário, se houver
  onClose: () => void;  // fecha a comemoração
}

const CONFETE_CORES = ['#4b4ff2', '#009ee3', '#22c55e', '#f59e0b', '#ec4899', '#a855f7'];
const BALAO_CORES = ['#4b4ff2', '#009ee3', '#22c55e', '#f59e0b', '#ec4899'];

/**
 * Tela de comemoração exibida quando o pagamento é confirmado: balões subindo,
 * confete caindo e uma mensagem de parabéns. É um overlay fixo (z acima do
 * paywall) — pode ser renderizado em qualquer ponto da árvore.
 */
export default function CelebracaoPagamento({ nome, onClose }: Props) {
  // gerados uma única vez para não "pular" a cada re-render
  const confetes = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2.5,
        dur: 2.5 + Math.random() * 2,
        cor: CONFETE_CORES[i % CONFETE_CORES.length],
        size: 6 + Math.random() * 8,
        rot: Math.random() * 360,
      })),
    [],
  );
  const baloes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: 4 + Math.random() * 92,
        delay: Math.random() * 2,
        dur: 5 + Math.random() * 3,
        cor: BALAO_CORES[i % BALAO_CORES.length],
        size: 34 + Math.random() * 26,
        sway: 14 + Math.random() * 20,
      })),
    [],
  );

  // fecha no ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const primeiroNome = nome ? nome.trim().split(/\s+/)[0] : '';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-slate-900/70 p-4 backdrop-blur-sm">
      {/* balões subindo */}
      {baloes.map((b) => (
        <motion.div
          key={`b-${b.id}`}
          className="pointer-events-none absolute bottom-0"
          style={{ left: `${b.x}%` }}
          initial={{ y: '20vh', opacity: 0 }}
          animate={{ y: '-120vh', opacity: [0, 1, 1, 0.9], x: [0, b.sway, -b.sway, 0] }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Balao cor={b.cor} size={b.size} />
        </motion.div>
      ))}

      {/* confete caindo */}
      {confetes.map((c) => (
        <motion.div
          key={`c-${c.id}`}
          className="pointer-events-none absolute top-0"
          style={{ left: `${c.x}%`, width: c.size, height: c.size * 0.6, background: c.cor, borderRadius: 2 }}
          initial={{ y: '-10vh', opacity: 0, rotate: c.rot }}
          animate={{ y: '110vh', opacity: [0, 1, 1, 1], rotate: c.rot + 360 }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* card central */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="relative z-10 w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 14 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-full"
          style={{ background: 'linear-gradient(135deg,#4b4ff2,#009ee3)' }}
        >
          <PartyPopper className="h-10 w-10 text-white" />
        </motion.div>

        <h2 className="mt-5 text-3xl font-extrabold text-slate-900 dark:text-white">
          Parabéns{primeiroNome ? `, ${primeiroNome}` : ''}! 🎉
        </h2>
        <p className="mt-2 text-base font-medium text-slate-600 dark:text-slate-300">
          Seu currículo profissional está pronto e o download já começou.
        </p>
        <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-sm text-slate-500">
          Esperamos que você conquiste a vaga que deseja
          <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl py-3.5 font-bold text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#4b4ff2,#009ee3)' }}
        >
          Continuar
        </button>
      </motion.div>
    </div>
  );
}

// balão simples desenhado com divs (sem depender de fontes de emoji)
function Balao({ cor, size }: { cor: string; size: number }) {
  return (
    <div className="relative" style={{ width: size, height: size * 1.25 }}>
      <div
        className="rounded-full"
        style={{ width: size, height: size * 1.2, background: cor, boxShadow: 'inset -6px -8px 0 rgba(0,0,0,0.08)' }}
      />
      <div
        className="absolute left-1/2 top-full -translate-x-1/2"
        style={{ width: 1, height: size * 0.5, background: 'rgba(255,255,255,0.55)' }}
      />
    </div>
  );
}
