import { useEffect, useRef } from 'react';
import { X, RotateCcw } from 'lucide-react';
import type { ChatMessage } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';

interface Props {
  messages: ChatMessage[];
  typing: boolean;
  iniciado: boolean;
  onIniciar: () => void;
  onEnviar: (texto: string, audio?: boolean) => void;
  onReiniciar: () => void;
  onClose: () => void;
}

export default function ChatPanel({ messages, typing, iniciado, onIniciar, onEnviar, onReiniciar, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!iniciado) onIniciar(); }, [iniciado, onIniciar]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  return (
    <div className="flex h-full w-full flex-col bg-slate-100 dark:bg-[#111b21]">
      <header className="flex items-center gap-3 border-b border-black/5 bg-[#f0f2f5] px-3 py-2.5 dark:border-white/5 dark:bg-[#202c33]">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-bold text-white">CV</div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800 dark:text-slate-100">Camila · Assistente Curriculou</p>
          <p className="truncate text-xs text-teal-600 dark:text-teal-400">{typing ? 'digitando...' : 'online'}</p>
        </div>
        <button onClick={onReiniciar} className="rounded-full p-2 text-slate-500 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10" title="Recomeçar conversa">
          <RotateCcw className="h-5 w-5" />
        </button>
        <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10" title="Fechar">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div ref={scrollRef} className="cvzap-chat-bg flex-1 space-y-2 overflow-y-auto px-3 py-4">
        <div className="mx-auto mb-3 w-fit rounded-lg bg-white/80 px-3 py-1 text-center text-[11px] text-slate-500 shadow-sm dark:bg-black/30 dark:text-slate-300">
          🔒 Tudo fica no seu navegador. O que você responder aqui aparece no editor.
        </div>
        {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
        {typing && <TypingIndicator />}
      </div>

      <ChatInput onSend={onEnviar} disabled={typing} />
    </div>
  );
}
