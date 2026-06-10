// ── Motor do chat: orquestra mensagens, dados, digitação e persistência ──────
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, CurriculoData } from '../types';
import { curriculoVazio } from '../types';
import {
  FlowCtx, ConfirmReq, getStep, globalExtract, resolverProximo,
  STEP_INICIAL, STEP_FINAL,
} from '../engine/flow';
import { ehNegativa } from '../engine/normalize';
import { calcularProgresso, progressoTotal } from '../engine/progress';

const STORAGE_KEY = 'cvzap:estado:v1';

interface EstadoPersistido {
  messages: ChatMessage[];
  data: CurriculoData;
  stepId: string;
  contador: number;
}

function horaAgora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

let idSeq = 0;
function novoId(): string {
  idSeq += 1;
  return `m${Date.now()}_${idSeq}`;
}

function asArray(v: string | string[]): string[] {
  return Array.isArray(v) ? v : [v];
}

export function useRecruiter() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [data, setData] = useState<CurriculoData>(curriculoVazio);
  const [stepId, setStepId] = useState<string>(STEP_INICIAL);
  const [typing, setTyping] = useState(false);
  const [iniciado, setIniciado] = useState(false);

  const ctxRef = useRef<FlowCtx>({ data: curriculoVazio(), draftExp: {}, draftEdu: {}, draftCurso: {}, contador: 0 });
  const timers = useRef<number[]>([]);
  const stepIdRef = useRef(stepId);
  useEffect(() => { stepIdRef.current = stepId; }, [stepId]);
  // confirmação pendente (transiente — não persistida)
  const confirmRef = useRef<{ reverter: ConfirmReq['reverter']; proximoId: string } | null>(null);

  // ── persistência ────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const e: EstadoPersistido = JSON.parse(raw);
        // mescla com os defaults p/ garantir campos novos (idiomas, linkedin, arrays...)
        const d: CurriculoData = { ...curriculoVazio(), ...(e.data || {}) };
        setMessages(e.messages || []);
        setData(d);
        setStepId(e.stepId || STEP_INICIAL);
        ctxRef.current = { data: d, draftExp: {}, draftEdu: {}, draftCurso: {}, contador: e.contador || 0 };
        if ((e.messages || []).length) setIniciado(true);
      }
    } catch { /* ignora estado corrompido */ }
  }, []);

  const persistir = useCallback((msgs: ChatMessage[], d: CurriculoData, sId: string) => {
    try {
      const e: EstadoPersistido = { messages: msgs, data: d, stepId: sId, contador: ctxRef.current.contador };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(e));
    } catch { /* quota cheia: ignora */ }
  }, []);

  // ── emite mensagens da recrutadora com delay de digitação ─────────────────────
  const emitirBot = useCallback((textos: string[], onFim?: () => void) => {
    const enviarUma = (idx: number) => {
      if (idx >= textos.length) {
        setTyping(false);
        onFim?.();
        return;
      }
      setTyping(true);
      const delay = Math.min(1600, 500 + textos[idx].length * 18);
      const t = window.setTimeout(() => {
        const msg: ChatMessage = { id: novoId(), role: 'bot', text: textos[idx], time: horaAgora() };
        setMessages((prev) => {
          const novo = [...prev, msg];
          persistir(novo, ctxRef.current.data, stepIdRef.current);
          return novo;
        });
        enviarUma(idx + 1);
      }, delay);
      timers.current.push(t);
    };
    enviarUma(0);
  }, [persistir]);

  // ── inicia a conversa ─────────────────────────────────────────────────────────
  const iniciar = useCallback(() => {
    if (iniciado) return;
    setIniciado(true);
    const primeiro = getStep(STEP_INICIAL);
    const textos = asArray(primeiro.ask(ctxRef.current));
    emitirBot(textos);
  }, [iniciado, emitirBot]);

  // ── envia mensagem do usuário ─────────────────────────────────────────────────
  const enviar = useCallback((texto: string, viaAudio = false) => {
    const limpo = texto.trim();
    if (!limpo || typing) return;

    const msgUser: ChatMessage = { id: novoId(), role: 'user', text: limpo, time: horaAgora(), audio: viaAudio };
    setMessages((prev) => {
      const novo = [...prev, msgUser];
      persistir(novo, ctxRef.current.data, stepIdRef.current);
      return novo;
    });

    const ctx = ctxRef.current;

    // ── resposta a uma confirmação pendente ────────────────────────────────────
    if (confirmRef.current) {
      const { reverter, proximoId } = confirmRef.current;
      confirmRef.current = null;
      const negou = ehNegativa(limpo);
      if (negou) reverter(ctx);
      const ack = negou ? 'Sem problema, mantive como você escreveu. 👍' : 'Perfeito! ✅';
      const proximoStep = getStep(proximoId);
      const bolhas = [ack, ...asArray(proximoStep.ask(ctx))];
      setData({ ...ctx.data });
      setStepId(proximoId);
      stepIdRef.current = proximoId;
      emitirBot(bolhas, () => { persistir([], ctx.data, proximoId); setData({ ...ctx.data }); });
      return;
    }

    // ── processamento normal do passo ──────────────────────────────────────────
    globalExtract(limpo, ctx.data);
    const stepAtual = getStep(stepIdRef.current);
    const resultado = stepAtual.handle(limpo, ctx);
    const proximoId = resolverProximo(resultado.next, ctx.data);

    // pedido de confirmação por baixa confiança → não avança ainda
    if (resultado.confirm) {
      confirmRef.current = { reverter: resultado.confirm.reverter, proximoId };
      const bolhas: string[] = [];
      if (resultado.ack) bolhas.push(resultado.ack);
      bolhas.push(resultado.confirm.pergunta);
      setData({ ...ctx.data });
      emitirBot(bolhas, () => { persistir([], ctx.data, stepIdRef.current); setData({ ...ctx.data }); });
      return;
    }

    const proximoStep = getStep(proximoId);
    const bolhas: string[] = [];
    if (resultado.ack) bolhas.push(resultado.ack);
    bolhas.push(...asArray(proximoStep.ask(ctx)));

    setData({ ...ctx.data });
    setStepId(proximoId);
    stepIdRef.current = proximoId;

    emitirBot(bolhas, () => {
      persistir([], ctx.data, proximoId);
      setData({ ...ctx.data });
    });
  }, [typing, emitirBot, persistir]);

  // ── reinicia tudo ─────────────────────────────────────────────────────────────
  const reiniciar = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    localStorage.removeItem(STORAGE_KEY);
    const vazio = curriculoVazio();
    ctxRef.current = { data: vazio, draftExp: {}, draftEdu: {}, draftCurso: {}, contador: 0 };
    setMessages([]);
    setData(vazio);
    setStepId(STEP_INICIAL);
    setTyping(false);
    setIniciado(false);
  }, []);

  // edição manual dos dados a partir do painel de prévia
  const atualizarDados = useCallback((novo: CurriculoData) => {
    ctxRef.current.data = novo;
    setData(novo);
    persistir(messages, novo, stepIdRef.current);
  }, [messages, persistir]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const secoes = calcularProgresso(data);
  const total = progressoTotal(secoes);
  const concluido = stepId === STEP_FINAL;

  return {
    messages, data, typing, iniciado, secoes, total, concluido,
    iniciar, enviar, reiniciar, atualizarDados,
  };
}
