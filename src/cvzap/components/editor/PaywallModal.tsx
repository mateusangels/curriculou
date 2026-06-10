import { useState } from 'react';
import { X, Check, Loader2, FileDown, Gift, ShieldCheck } from 'lucide-react';
import { PRECO_COM_FOTO, PRECO_SEM_FOTO, PRECO_PROMO, formatarBRL, cobrar } from '../../lib/pagamento';

interface Props {
  comFoto: boolean;
  onPago: () => void; // dispara o download do PDF
  onClose: () => void;
}

const MP_BLUE = '#009ee3';
type Etapa = 'oferta' | 'promo' | 'processando' | 'sucesso';

export default function PaywallModal({ comFoto, onPago, onClose }: Props) {
  const precoCheio = comFoto ? PRECO_COM_FOTO : PRECO_SEM_FOTO;
  const [etapa, setEtapa] = useState<Etapa>('oferta');
  const [valorPago, setValorPago] = useState(precoCheio);

  const pagar = async (valor: number) => {
    setValorPago(valor);
    setEtapa('processando');
    const r = await cobrar('Currículo Curriculou', valor);
    if (r.ok) {
      setEtapa('sucesso');
      setTimeout(() => { onPago(); }, 900);
    } else {
      setEtapa('oferta');
    }
  };

  // ao tentar fechar: primeiro mostra promo; só fecha de fato na 2ª tentativa
  const tentarFechar = () => {
    if (etapa === 'oferta') setEtapa('promo');
    else if (etapa === 'promo') onClose();
  };

  const Beneficios = (
    <ul className="mt-4 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
      {['Download em PDF de alta qualidade', 'Sem marca d’água', comFoto ? 'Com a sua foto' : 'Layout limpo sem foto', 'Use em quantas vagas quiser'].map((b) => (
        <li key={b} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> {b}</li>
      ))}
    </ul>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={tentarFechar}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        {/* topo */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4" style={{ color: MP_BLUE }} /> Pagamento seguro via Mercado Pago
          </div>
          <button onClick={tentarFechar} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        {etapa === 'sucesso' ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
              <Check className="h-9 w-9" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Pagamento aprovado!</h2>
            <p className="mt-1 text-slate-500">Baixando seu currículo...</p>
          </div>
        ) : etapa === 'processando' ? (
          <div className="px-6 py-12 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin" style={{ color: MP_BLUE }} />
            <p className="mt-4 font-medium text-slate-600 dark:text-slate-300">Processando {formatarBRL(valorPago)}...</p>
          </div>
        ) : etapa === 'promo' ? (
          <div className="px-6 py-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600">
              <Gift className="h-7 w-7" />
            </div>
            <h2 className="mt-3 text-xl font-extrabold">Espera! 🎁 Oferta só agora</h2>
            <p className="mt-1 text-slate-500">Leve seu currículo com desconto especial:</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-lg text-slate-400 line-through">{formatarBRL(precoCheio)}</span>
              <span className="text-3xl font-extrabold text-green-600">{formatarBRL(PRECO_PROMO)}</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                -{Math.round((1 - PRECO_PROMO / precoCheio) * 100)}%
              </span>
            </div>
            <button onClick={() => pagar(PRECO_PROMO)} className="mt-5 w-full rounded-xl py-3.5 font-bold text-white" style={{ background: MP_BLUE }}>
              Aproveitar e baixar por {formatarBRL(PRECO_PROMO)}
            </button>
            <button onClick={onClose} className="mt-2 w-full text-sm text-slate-400 hover:text-slate-600">Não, obrigado</button>
          </div>
        ) : (
          <div className="px-6 py-5">
            <h2 className="text-xl font-bold">Baixar currículo em PDF</h2>
            <p className="text-sm text-slate-500">{comFoto ? 'Versão com foto' : 'Versão sem foto'}</p>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-extrabold" style={{ color: MP_BLUE }}>{formatarBRL(precoCheio)}</span>
              <span className="pb-1 text-sm text-slate-400">pagamento único</span>
            </div>
            {comFoto && (
              <p className="mt-1 text-xs text-slate-400">Sem foto sai por {formatarBRL(PRECO_SEM_FOTO)} — remova a foto no editor.</p>
            )}

            {Beneficios}

            <button onClick={() => pagar(precoCheio)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white" style={{ background: MP_BLUE }}>
              <FileDown className="h-5 w-5" /> Pagar e baixar
            </button>
            <button onClick={tentarFechar} className="mt-2 w-full text-sm text-slate-400 hover:text-slate-600">Agora não</button>
          </div>
        )}
      </div>
    </div>
  );
}
