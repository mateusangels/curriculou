import { CheckCheck, Mic } from 'lucide-react';
import type { ChatMessage } from '../types';

// formata *negrito* e _itálico_ simples vindos do motor
function formatar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*(.+?)\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'relative max-w-[80%] rounded-2xl px-3 py-2 shadow-sm text-[14.5px] leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-[#d9fdd3] text-slate-800 dark:bg-[#005c4b] dark:text-slate-50'
            : 'rounded-tl-sm bg-white text-slate-800 dark:bg-[#202c33] dark:text-slate-100',
        ].join(' ')}
      >
        {msg.audio && (
          <span className="mb-0.5 mr-1 inline-flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-300">
            <Mic className="h-3 w-3" /> mensagem de voz
          </span>
        )}
        <span dangerouslySetInnerHTML={{ __html: formatar(msg.text) }} />
        <span className="float-right ml-2 mt-1 inline-flex translate-y-0.5 items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-300/70">
          {msg.time}
          {isUser && <CheckCheck className="h-3 w-3 text-sky-500" />}
        </span>
      </div>
    </div>
  );
}
