import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Plus, Trash2, Loader2, Clock } from 'lucide-react';
import { LogoMarca } from './Logo';
import { listarCurriculos, obterCurriculo, excluirCurriculo, type CurriculoResumo } from '../lib/curriculos';
import type { CvSnapshot } from '../lib/snapshot';

interface Props {
  onAbrir: (snap: CvSnapshot, id: string, titulo: string) => void;
  onNovo: () => void;
  onVoltar: () => void;
}

function quando(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function MeusCurriculos({ onAbrir, onNovo, onVoltar }: Props) {
  const [itens, setItens] = useState<CurriculoResumo[] | null>(null);
  const [abrindo, setAbrindo] = useState<string | null>(null);

  const carregar = () => listarCurriculos().then(setItens);
  useEffect(() => { carregar(); }, []);

  const abrir = async (id: string, titulo: string) => {
    setAbrindo(id);
    const c = await obterCurriculo(id);
    setAbrindo(null);
    if (c?.snapshot) onAbrir(c.snapshot, id, titulo);
    else toast.error('Não foi possível abrir este currículo.');
  };

  const excluir = async (id: string, titulo: string) => {
    if (!window.confirm(`Excluir "${titulo}"? Isso não pode ser desfeito.`)) return;
    await excluirCurriculo(id);
    setItens((l) => (l || []).filter((c) => c.id !== id));
    toast('Currículo excluído.');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0b1020]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-3.5 backdrop-blur dark:border-white/10 dark:bg-[#0b1020]/90">
        <button onClick={onVoltar} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Início
        </button>
        <LogoMarca icon="h-8 w-8" text="text-lg" />
        <button onClick={onNovo} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="text-2xl font-extrabold">Meus currículos</h1>
        <p className="mt-1 text-slate-500">Abra, edite ou baixe de novo — sem precisar de código.</p>

        {itens === null ? (
          <div className="mt-16 flex justify-center text-slate-400"><Loader2 className="h-7 w-7 animate-spin" /></div>
        ) : itens.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-white/15">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">Você ainda não salvou nenhum currículo.</p>
            <button onClick={onNovo} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Criar meu primeiro currículo
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {itens.map((c) => (
              <div key={c.id} className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{c.titulo}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" /> {quando(c.atualizado_em)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => abrir(c.id, c.titulo)} disabled={abrindo === c.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70">
                    {abrindo === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Abrir'}
                  </button>
                  <button onClick={() => excluir(c.id, c.titulo)} title="Excluir"
                    className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:border-red-300 hover:text-red-500 dark:border-white/15">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
