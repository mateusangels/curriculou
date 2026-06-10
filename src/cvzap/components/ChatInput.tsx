import { useEffect, useRef, useState } from 'react';
import { Mic, Send, Square, Plus } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface Props {
  onSend: (texto: string, viaAudio?: boolean) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [texto, setTexto] = useState('');
  const { supported, listening, transcript, start, stop, reset } = useSpeechRecognition();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const eraAudio = useRef(false);

  // enquanto grava, joga a transcrição no campo
  useEffect(() => {
    if (listening) setTexto(transcript);
  }, [transcript, listening]);

  // auto-resize do textarea
  useEffect(() => {
    const ta = taRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(120, ta.scrollHeight) + 'px';
    }
  }, [texto]);

  const enviar = () => {
    const t = texto.trim();
    if (!t || disabled) return;
    onSend(t, eraAudio.current);
    setTexto('');
    eraAudio.current = false;
    reset();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const toggleMic = () => {
    if (listening) {
      stop();
      eraAudio.current = true;
    } else {
      reset();
      eraAudio.current = false;
      start();
    }
  };

  const temTexto = texto.trim().length > 0;

  return (
    <div className="border-t border-black/5 bg-[#f0f2f5] px-3 py-2.5 dark:border-white/5 dark:bg-[#202c33]">
      {listening && (
        <div className="mb-2 flex items-center gap-2 px-1 text-sm text-red-500">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          Gravando... fale agora. Toque no quadrado para parar.
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="hidden shrink-0 rounded-full p-2 text-slate-500 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10 sm:block"
          title="Anexar (em breve)"
          disabled
        >
          <Plus className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-end rounded-3xl bg-white px-4 py-1.5 shadow-sm dark:bg-[#2a3942]">
          <textarea
            ref={taRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            disabled={disabled}
            placeholder={disabled ? 'Aguarde a Camila responder...' : 'Digite uma mensagem ou grave um áudio'}
            className="max-h-[120px] w-full resize-none bg-transparent py-1.5 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-slate-100"
          />
        </div>

        {temTexto ? (
          <button
            type="button"
            onClick={enviar}
            disabled={disabled}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-600 text-white shadow-md transition hover:bg-teal-700 disabled:opacity-50"
            title="Enviar"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled || !supported}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-md transition disabled:opacity-50 ${
              listening ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-700'
            }`}
            title={supported ? (listening ? 'Parar gravação' : 'Gravar áudio') : 'Seu navegador não suporta gravação de voz'}
          >
            {listening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
      </div>
      {!supported && (
        <p className="mt-1.5 px-1 text-[11px] text-slate-400">
          Dica: para gravar áudio, use o Chrome ou Edge. Você também pode digitar normalmente. 🙂
        </p>
      )}
    </div>
  );
}
