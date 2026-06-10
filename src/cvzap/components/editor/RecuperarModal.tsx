import { useState } from 'react';
import { X, Loader2, FileDown, Search, ShieldCheck } from 'lucide-react';
import { buscarPedido, ULTIMO_PEDIDO_KEY } from '../../lib/pagamento';
import { baixarDeSnapshot } from '../../lib/snapshot';
import { baixarCurriculoSalvo } from '../../lib/baixarSalvo';

interface Props { onClose: () => void }

const MP_BLUE = '#009ee3';
type Estado = 'form' | 'buscando';

export default function RecuperarModal({ onClose }: Props) {
  const [codigo, setCodigo] = useState<string>(() => {
    try { return localStorage.getItem(ULTIMO_PEDIDO_KEY) || ''; } catch { return ''; }
  });
  const [estado, setEstado] = useState<Estado>('form');
  const [erro, setErro] = useState<string | null>(null);

  const recuperar = async () => {
    const id = codigo.trim();
    if (!id) { setErro('Cole o código do seu pedido (começa com "cv_").'); return; }
    setErro(null);
    setEstado('buscando');
    const { pago, snapshot } = await buscarPedido(id);
    if (pago) {
      if (snapshot) baixarDeSnapshot(snapshot);
      else baixarCurriculoSalvo(); // currículo antigo, sem snapshot no servidor
      onClose();
      return;
    }
    setEstado('form');
    setErro('Não encontramos um pagamento aprovado com esse código. Confira se digitou certo — se acabou de pagar, aguarde 1 minuto e tente de novo.');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4" style={{ color: MP_BLUE }} /> Recuperar currículo já pago
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-5">
          <h2 className="text-xl font-bold">Já paguei — quero baixar de novo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cole o código do pedido (ele aparece depois do pagamento e começa com <b>cv_</b>). Funciona em qualquer celular ou computador.
          </p>

          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') recuperar(); }}
            placeholder="cv_xxxxxxxxxxxx"
            autoFocus
            className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-800"
          />

          {erro && <p className="mt-2 text-sm text-red-500">{erro}</p>}

          <button
            onClick={recuperar}
            disabled={estado === 'buscando'}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white disabled:opacity-70"
            style={{ background: MP_BLUE }}
          >
            {estado === 'buscando'
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Procurando...</>
              : <><Search className="h-5 w-5" /> Baixar meu currículo</>}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <FileDown className="h-3.5 w-3.5" /> O download não custa nada de novo — você já pagou.
          </p>
        </div>
      </div>
    </div>
  );
}
