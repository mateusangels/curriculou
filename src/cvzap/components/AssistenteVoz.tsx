import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, Square, Sparkles, Check, AlertTriangle, Moon, Sun, Pencil, RotateCcw } from 'lucide-react';
import { LogoMarca } from './Logo';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { extrairCurriculoDeMonologo, type ResultadoExtracao } from '../engine/extrairMonologo';
import type { CurriculoData } from '../types';
import { track } from '../lib/track';

interface Props {
  onConcluir: (data: CurriculoData) => void;
  onVoltar: () => void;
  dark: boolean;
  onToggleDark: () => void;
}

const ROTEIRO = [
  'Seu nome completo',
  'Idade ou data de nascimento, estado civil',
  'Cidade e estado onde mora',
  'Telefone e e-mail',
  'O cargo que você deseja',
  'Suas experiências: cargo, empresa, período e o que fazia',
  'Sua escolaridade e cursos',
  'Idiomas e habilidades',
];

const EXEMPLO =
  'Ex.: "Meu nome é Ana Paula Ribeiro, tenho 28 anos, sou casada, moro em Uberlândia, Minas Gerais. ' +
  'Meu telefone é (34) 98765-4321, e-mail ana.ribeiro arroba gmail ponto com. Quero trabalhar como vendedora. ' +
  'Trabalhei como auxiliar de vendas na empresa Loja Rede de 2019 a 2022, era responsável pelo atendimento e pela organização do estoque. ' +
  'Tenho ensino superior completo, fiz curso de vendas e de Excel, falo inglês básico. Sei trabalhar com informática e tenho boa comunicação."';

export default function AssistenteVoz({ onConcluir, onVoltar, dark, onToggleDark }: Props) {
  const { supported, listening, transcript, start, stop, reset } = useSpeechRecognition();
  const [texto, setTexto] = useState('');
  const [etapa, setEtapa] = useState<'falar' | 'revisao'>('falar');
  const [resultado, setResultado] = useState<ResultadoExtracao | null>(null);
  const baseRef = useRef('');

  // enquanto grava, vai jogando a transcrição (somada ao que já existia) no campo
  useEffect(() => {
    if (listening) setTexto(((baseRef.current ? baseRef.current + ' ' : '') + transcript).trimStart());
  }, [transcript, listening]);

  const alternarGravacao = () => {
    if (listening) { stop(); return; }
    baseRef.current = texto.trim();
    reset();
    start();
    track('ia_voz_gravar');
  };

  const montar = () => {
    if (listening) stop();
    const r = extrairCurriculoDeMonologo(texto);
    setResultado(r);
    setEtapa('revisao');
    track('ia_voz_montar', String(r.capturado.length));
  };

  const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0;
  const podeMontar = palavras >= 8;

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 dark:bg-[#0b1020] dark:text-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-3.5 backdrop-blur dark:border-white/10 dark:bg-[#0b1020]/90">
        <button onClick={onVoltar} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Início
        </button>
        <LogoMarca icon="h-8 w-8" text="text-lg" />
        <button onClick={onToggleDark} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" title="Tema">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" /> Currículo com IA — por voz
        </div>

        {etapa === 'falar' ? (
          <>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Monte seu currículo falando</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-300">
              Toque no microfone e fale de forma natural — a gente transcreve e monta o currículo pra você. No fim, é só revisar.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tente incluir:</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {ROTEIRO.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /> {r}
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs italic text-slate-500 dark:bg-white/5 dark:text-slate-400">{EXEMPLO}</p>
            </div>

            {/* botão de gravar */}
            {supported ? (
              <div className="mt-6 flex flex-col items-center gap-3">
                <button onClick={alternarGravacao}
                  className={`relative grid h-20 w-20 place-items-center rounded-full text-white shadow-lg transition ${listening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {listening && <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-60" />}
                  {listening ? <Square className="relative h-7 w-7" /> : <Mic className="relative h-8 w-8" />}
                </button>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
                  {listening ? 'Gravando… toque para parar' : (texto ? 'Toque para continuar falando' : 'Toque para começar a falar')}
                </span>
              </div>
            ) : (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Seu navegador não suporta gravação por voz (use o Chrome ou Edge). Sem problema — digite ou cole sua descrição no campo abaixo.
              </div>
            )}

            {/* transcrição / edição */}
            <div className="mt-5">
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Pencil className="h-3.5 w-3.5" /> Texto {supported ? '(você pode ajustar antes de montar)' : ''}
              </label>
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={7}
                placeholder="O que você falar aparece aqui. Você também pode digitar ou colar."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-relaxed text-slate-800 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100" />
              <div className="mt-1 text-right text-xs text-slate-400">{palavras} palavra(s)</div>
            </div>

            <button onClick={montar} disabled={!podeMontar}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white transition hover:bg-indigo-700 disabled:opacity-40">
              <Sparkles className="h-5 w-5" /> Montar meu currículo
            </button>
            {!podeMontar && <p className="mt-2 text-center text-xs text-slate-400">Fale ou escreva um pouco mais para eu conseguir montar.</p>}
          </>
        ) : resultado && (
          <>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Prontinho! Veja o que entendi</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-300">Você revisa e completa tudo no editor a seguir.</p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">Captei estas informações:</p>
              {resultado.capturado.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {resultado.capturado.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-300">
                      <Check className="h-3.5 w-3.5" /> {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Não consegui identificar muita coisa — tente falar mais detalhes.</p>
              )}

              {resultado.faltando.length > 0 && (
                <>
                  <p className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" /> Faltou (você completa no editor):
                  </p>
                  <ul className="mt-2 space-y-1">
                    {resultado.faltando.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" /> {f}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <button onClick={() => onConcluir(resultado.data)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white hover:bg-indigo-700">
              Abrir no editor <Sparkles className="h-5 w-5" />
            </button>
            <button onClick={() => setEtapa('falar')}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">
              <RotateCcw className="h-4 w-4" /> Voltar e falar mais
            </button>
          </>
        )}
      </main>
    </div>
  );
}
