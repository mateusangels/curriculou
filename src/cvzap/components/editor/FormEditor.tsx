// ── Editor em formulário (mobile): campos grandes, fáceis de tocar ───────────
// Edita os MESMOS dados do WYSIWYG (via onChange). A folha A4 fica como prévia.
import { useState } from 'react';
import { Plus, Trash2, Upload, X, ArrowRight, Eye, Lightbulb } from 'lucide-react';
import type { CurriculoData, Experiencia, Formacao, Curso } from '../../types';
import type { SectionsConfig } from '../../design/types';
import { gerarId } from '../../engine/parsers';
import { SUG_PERFIL, SUG_QUALIFICACOES } from '../../engine/sugestoes';
import FotoCropper from './FotoCropper';

interface Props {
  data: CurriculoData;
  onChange: (d: CurriculoData) => void;
  sections: SectionsConfig;
  foto?: string;
  onFoto: (f?: string) => void;
  onVerPrevia?: () => void;
}

// text-base (16px) evita o zoom automático do iOS ao focar o campo
const INP = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

function maskTel(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskData(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{titulo}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-300 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
      <Plus className="h-4 w-4" /> {children}
    </button>
  );
}
// frases prontas que o usuário toca para inserir no campo
function Sugestoes({ opcoes, onEscolher }: { opcoes: string[]; onEscolher: (frase: string) => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setAberto((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
        <Lightbulb className="h-4 w-4" /> {aberto ? 'Ocultar sugestões' : 'Ver sugestões (toque para usar)'}
      </button>
      {aberto && (
        <div className="mt-2 space-y-1.5">
          {opcoes.map((o, i) => (
            <button key={i} type="button" onClick={() => onEscolher(o)}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500/40">
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({ onRemover, children }: { onRemover: () => void; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <button onClick={onRemover} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white" title="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
      <div className="space-y-3 pr-8">{children}</div>
    </div>
  );
}

export default function FormEditor({ data, onChange, sections: sec, foto, onFoto, onVerPrevia }: Props) {
  const set = (p: Partial<CurriculoData>) => onChange({ ...data, ...p });
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // insere uma frase de sugestão no campo (acrescenta ao que já existe)
  const inserir = (campo: 'perfilProfissional' | 'qualificacoes', frase: string) => {
    const atual = (data[campo] || '').trim();
    set({ [campo]: atual ? `${atual} ${frase}` : frase } as Partial<CurriculoData>);
  };

  const escolherFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => { if (typeof rd.result === 'string') setCropSrc(rd.result); };
    rd.readAsDataURL(file); e.target.value = '';
  };

  const setExp = (id: string, p: Partial<Experiencia>) => set({ experiencias: data.experiencias.map((x) => x.id === id ? { ...x, ...p } : x) });
  const addExp = () => set({ experiencias: [...data.experiencias, { id: gerarId('exp', data.experiencias.length + (Date.now() % 1000)), empresa: '', cargo: '', inicio: '', fim: '', atual: false, atividades: '' }] });
  const delExp = (id: string) => set({ experiencias: data.experiencias.filter((x) => x.id !== id) });

  const setEdu = (id: string, p: Partial<Formacao>) => set({ formacoes: data.formacoes.map((x) => x.id === id ? { ...x, ...p } : x) });
  const addEdu = () => set({ formacoes: [...data.formacoes, { id: gerarId('edu', data.formacoes.length + (Date.now() % 1000)), escolaridade: '', curso: '', instituicao: '', anoConclusao: '' }] });
  const delEdu = (id: string) => set({ formacoes: data.formacoes.filter((x) => x.id !== id) });

  const setCur = (id: string, p: Partial<Curso>) => set({ cursos: data.cursos.map((x) => x.id === id ? { ...x, ...p } : x) });
  const addCur = () => set({ cursos: [...data.cursos, { id: gerarId('curso', data.cursos.length + (Date.now() % 1000)), nome: '', instituicao: '', cargaHoraria: '' }] });
  const delCur = (id: string) => set({ cursos: data.cursos.filter((x) => x.id !== id) });

  const setLista = (campo: 'habilidades' | 'idiomas', i: number, v: string) => set({ [campo]: data[campo].map((x, idx) => idx === i ? v : x) } as Partial<CurriculoData>);
  const addLista = (campo: 'habilidades' | 'idiomas') => set({ [campo]: [...data[campo], ''] } as Partial<CurriculoData>);
  const delLista = (campo: 'habilidades' | 'idiomas', i: number) => set({ [campo]: data[campo].filter((_, idx) => idx !== i) } as Partial<CurriculoData>);

  return (
    <div className="space-y-4 bg-slate-100 p-4 pb-28 dark:bg-slate-950">
      {sec.foto && (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 bg-cover bg-center ring-2 ring-indigo-500/20 dark:bg-slate-800" style={{ backgroundImage: foto ? `url(${foto})` : undefined }} />
          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
              <Upload className="h-4 w-4" /> {foto ? 'Trocar foto' : 'Adicionar foto'}
              <input type="file" accept="image/*" className="hidden" onChange={escolherFoto} />
            </label>
            {foto && <button onClick={() => onFoto(undefined)} className="text-left text-sm text-red-500">Remover foto</button>}
          </div>
        </div>
      )}

      <Secao titulo="Seus dados">
        <Campo label="Nome completo"><input className={INP} value={data.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex: Maria Oliveira" /></Campo>
        {sec.cargo && <Campo label="Cargo / objetivo"><input className={INP} value={data.objetivo} onChange={(e) => set({ objetivo: e.target.value })} placeholder="Ex: Auxiliar Administrativo" /></Campo>}
        <Campo label="E-mail"><input className={INP} type="email" inputMode="email" value={data.email} onChange={(e) => set({ email: e.target.value })} placeholder="voce@email.com" /></Campo>
        <Campo label="Telefone"><input className={INP} inputMode="tel" value={data.telefone} onChange={(e) => set({ telefone: maskTel(e.target.value) })} placeholder="(11) 91234-5678" /></Campo>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><Campo label="Cidade"><input className={INP} value={data.cidade} onChange={(e) => set({ cidade: e.target.value })} placeholder="São Paulo" /></Campo></div>
          <Campo label="UF"><input className={INP} maxLength={2} value={data.estado} onChange={(e) => set({ estado: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })} placeholder="SP" /></Campo>
        </div>
        <Campo label="LinkedIn (opcional)"><input className={INP} value={data.linkedin} onChange={(e) => set({ linkedin: e.target.value.replace(/\s/g, '') })} placeholder="linkedin.com/in/voce" /></Campo>
      </Secao>

      {sec.perfil && (
        <Secao titulo="Perfil profissional">
          <textarea className={`${INP} min-h-[110px] resize-y`} value={data.perfilProfissional} onChange={(e) => set({ perfilProfissional: e.target.value })} placeholder="Resumo em 2-3 frases: suas competências e experiência." />
          <Sugestoes opcoes={SUG_PERFIL} onEscolher={(f) => inserir('perfilProfissional', f)} />
        </Secao>
      )}

      {sec.experiencia && (
        <Secao titulo="Experiência profissional">
          {data.experiencias.map((e) => (
            <ItemCard key={e.id} onRemover={() => delExp(e.id)}>
              <Campo label="Cargo"><input className={INP} value={e.cargo} onChange={(ev) => setExp(e.id, { cargo: ev.target.value })} placeholder="Ex: Vendedor" /></Campo>
              <Campo label="Empresa"><input className={INP} value={e.empresa} onChange={(ev) => setExp(e.id, { empresa: ev.target.value })} placeholder="Nome da empresa" /></Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Início"><input className={INP} value={e.inicio} onChange={(ev) => setExp(e.id, { inicio: maskData(ev.target.value) })} placeholder="mm/aaaa" inputMode="numeric" /></Campo>
                <Campo label="Fim"><input className={INP} disabled={e.atual} value={e.atual ? 'Atual' : e.fim} onChange={(ev) => setExp(e.id, { fim: maskData(ev.target.value) })} placeholder="mm/aaaa" inputMode="numeric" /></Campo>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" className="h-4 w-4" checked={e.atual} onChange={(ev) => setExp(e.id, { atual: ev.target.checked, fim: ev.target.checked ? '' : e.fim })} /> Trabalho aqui atualmente
              </label>
              <Campo label="Atividades"><textarea className={`${INP} min-h-[90px] resize-y`} value={e.atividades} onChange={(ev) => setExp(e.id, { atividades: ev.target.value })} placeholder="O que você fazia nesse cargo?" /></Campo>
            </ItemCard>
          ))}
          <AddBtn onClick={addExp}>Adicionar experiência</AddBtn>
        </Secao>
      )}

      {sec.educacao && (
        <Secao titulo="Educação">
          {data.formacoes.map((f) => (
            <ItemCard key={f.id} onRemover={() => delEdu(f.id)}>
              <Campo label="Grau / escolaridade"><input className={INP} value={f.escolaridade} onChange={(ev) => setEdu(f.id, { escolaridade: ev.target.value })} placeholder="Ex: Ensino Médio Completo" /></Campo>
              <Campo label="Instituição"><input className={INP} value={f.instituicao} onChange={(ev) => setEdu(f.id, { instituicao: ev.target.value })} placeholder="Escola / Universidade" /></Campo>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Campo label="Curso (opcional)"><input className={INP} value={f.curso} onChange={(ev) => setEdu(f.id, { curso: ev.target.value })} placeholder="Ex: Administração" /></Campo></div>
                <Campo label="Ano"><input className={INP} inputMode="numeric" value={f.anoConclusao} onChange={(ev) => setEdu(f.id, { anoConclusao: ev.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="2024" /></Campo>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={addEdu}>Adicionar formação</AddBtn>
        </Secao>
      )}

      {sec.habilidades && (
        <Secao titulo="Habilidades">
          {data.habilidades.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input className={INP} value={h} onChange={(e) => setLista('habilidades', i, e.target.value)} placeholder="Ex: Proatividade" />
              <button onClick={() => delLista('habilidades', i)} className="grid w-11 shrink-0 place-items-center rounded-xl bg-red-500 text-white"><X className="h-4 w-4" /></button>
            </div>
          ))}
          <AddBtn onClick={() => addLista('habilidades')}>Adicionar habilidade</AddBtn>
        </Secao>
      )}

      {sec.idiomas && (
        <Secao titulo="Idiomas">
          {data.idiomas.map((x, i) => (
            <div key={i} className="flex gap-2">
              <input className={INP} value={x} onChange={(e) => setLista('idiomas', i, e.target.value)} placeholder="Ex: Inglês - Intermediário" />
              <button onClick={() => delLista('idiomas', i)} className="grid w-11 shrink-0 place-items-center rounded-xl bg-red-500 text-white"><X className="h-4 w-4" /></button>
            </div>
          ))}
          <AddBtn onClick={() => addLista('idiomas')}>Adicionar idioma</AddBtn>
        </Secao>
      )}

      {sec.cursos && (
        <Secao titulo="Cursos e certificações">
          {data.cursos.map((c) => (
            <ItemCard key={c.id} onRemover={() => delCur(c.id)}>
              <Campo label="Nome do curso"><input className={INP} value={c.nome} onChange={(ev) => setCur(c.id, { nome: ev.target.value })} placeholder="Ex: Excel Avançado" /></Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Instituição"><input className={INP} value={c.instituicao} onChange={(ev) => setCur(c.id, { instituicao: ev.target.value })} placeholder="Onde fez" /></Campo>
                <Campo label="Carga horária"><input className={INP} value={c.cargaHoraria} onChange={(ev) => setCur(c.id, { cargaHoraria: ev.target.value })} placeholder="40h" /></Campo>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={addCur}>Adicionar curso</AddBtn>
        </Secao>
      )}

      {sec.dadosPessoais && (
        <Secao titulo="Dados pessoais">
          <Campo label="Nascimento"><input className={INP} inputMode="numeric" value={data.dataNascimento} onChange={(e) => set({ dataNascimento: maskData(e.target.value) })} placeholder="dd/mm/aaaa" /></Campo>
          <Campo label="Estado civil"><input className={INP} value={data.estadoCivil} onChange={(e) => set({ estadoCivil: e.target.value })} placeholder="Solteiro(a)" /></Campo>
          <Campo label="Nacionalidade"><input className={INP} value={data.nacionalidade} onChange={(e) => set({ nacionalidade: e.target.value })} placeholder="Brasileira" /></Campo>
          <Campo label="Endereço"><input className={INP} value={data.endereco} onChange={(e) => set({ endereco: e.target.value })} placeholder="Rua / Av." /></Campo>
          <div className="grid grid-cols-3 gap-3">
            <Campo label="Nº"><input className={INP} value={data.numero} onChange={(e) => set({ numero: e.target.value })} placeholder="123" /></Campo>
            <div className="col-span-2"><Campo label="Bairro"><input className={INP} value={data.bairro} onChange={(e) => set({ bairro: e.target.value })} placeholder="Centro" /></Campo></div>
          </div>
          <Campo label="CEP"><input className={INP} inputMode="numeric" value={data.cep} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 8); set({ cep: d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}` }); }} placeholder="00000-000" /></Campo>
        </Secao>
      )}

      {sec.qualificacoes && (
        <Secao titulo="Qualificações e informações adicionais">
          <textarea className={`${INP} min-h-[90px] resize-y`} value={data.qualificacoes} onChange={(e) => set({ qualificacoes: e.target.value })} placeholder="Ex: Disponibilidade imediata, CNH categoria B..." />
          <Sugestoes opcoes={SUG_QUALIFICACOES} onEscolher={(f) => inserir('qualificacoes', f)} />
        </Secao>
      )}

      {/* fim do formulário: caminho óbvio pra ver o currículo pronto */}
      {onVerPrevia && (
        <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-5 text-center dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-600 text-white"><Eye className="h-6 w-6" /></div>
          <h3 className="mt-3 text-lg font-bold">Tudo preenchido?</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Veja como seu currículo ficou e baixe em PDF.</p>
          <button onClick={onVerPrevia} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white hover:bg-indigo-700">
            Ver meu currículo <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {cropSrc && <FotoCropper src={cropSrc} onConfirm={(d) => { onFoto(d); setCropSrc(null); }} onCancel={() => setCropSrc(null)} />}
    </div>
  );
}
