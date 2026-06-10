import { useRef, useState } from 'react';
import { Plus, Trash2, Upload, X, Maximize2 } from 'lucide-react';
import type { CurriculoData, Experiencia, Formacao, Curso } from '../../types';
import { gerarId } from '../../engine/parsers';
import {
  normalizarTitulo, normalizarEmail, normalizarData,
  normalizarEstadoCivil, normalizarNacionalidade, normalizarEscolaridade,
  normalizarCurso, descreverExperiencia, detectarProfissao,
} from '../../engine/normalize';
import type { DesignConfig, SectionsConfig } from '../../design/types';
import { buildCSS, resolveDesign } from '../../design/style';
import { ICON } from '../../templates/shared';
import FotoCropper from './FotoCropper';
import AutoTxt from './AutoTxt';
import { SUG_ESTADO_CIVIL, SUG_NACIONALIDADE, SUG_HABILIDADES, SUG_IDIOMAS, SUG_CURSOS } from '../../engine/sugestoes';

// marca d'água anti-print (some apenas no PDF pago, que é gerado por outro caminho)
const WATERMARK = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='250' height='150'><text x='6' y='95' font-family='Arial, sans-serif' font-size='23' font-weight='700' fill='#4b4ff2' fill-opacity='0.11' transform='rotate(-22 125 75)'>Curriculou • amostra</text></svg>"
)}")`;

interface Props {
  data: CurriculoData;
  onChange: (d: CurriculoData) => void;
  design: DesignConfig;
  sections: SectionsConfig;
  foto?: string;
  onFoto: (f: string | undefined) => void;
  onFotoTamanho?: (px: number) => void;
}

const MINUSC = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em']);

// capitaliza preservando siglas (USP, CCAA) e conectores (de, da...)
function capWords(v: string): string {
  return v.split(/(\s+)/).map((w) => {
    if (!w.trim()) return w;
    const lw = w.toLowerCase();
    if (MINUSC.has(lw)) return lw;
    if (w.length <= 4 && w === w.toUpperCase() && /[A-ZÀ-Ý]/.test(w)) return w; // sigla
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
}
const capFrase = (v: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : v);

// ── máscaras ao vivo (a cada tecla) ───────────────────────────────────────────
function maskTel(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskDataNasc(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
function maskCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}
const liveCidadeUF = (v: string) => {
  const i = v.indexOf(',');
  if (i < 0) return capWords(v);
  return `${capWords(v.slice(0, i))},${v.slice(i + 1).toUpperCase().replace(/[^A-Z\s]/g, '').slice(0, 3)}`;
};

// ── correção pesada (ao sair do campo) ────────────────────────────────────────
const fTitulo = (v: string) => (v ? normalizarTitulo(v).valor : v);
const fEmail = (v: string) => (v ? normalizarEmail(v).valor : v);
const fData = (v: string) => (v ? normalizarData(v).valor : v);
const fCivil = (v: string) => (v ? normalizarEstadoCivil(v).valor : v);
const fNac = (v: string) => (v ? normalizarNacionalidade(v) : v);
const fEscol = (v: string) => (v ? normalizarEscolaridade(v).valor : v);
const fCurso = (v: string) => (v ? normalizarCurso(v).valor : v);
const fCargoExp = (v: string) => { if (!v) return v; const p = detectarProfissao(v); return p ? p.profissao : normalizarTitulo(v).valor; };

function Ico({ html }: { html: string }) {
  return <span className="cv-icon" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Txt({ value, onChange, ph, cls = '', style, live, fmt }: {
  value: string; onChange: (v: string) => void; ph?: string; cls?: string; style?: React.CSSProperties;
  live?: (v: string) => string; fmt?: (v: string) => string;
}) {
  return (
    <input className={`cv-edit ${cls}`} style={style} value={value} placeholder={ph}
      onChange={(e) => { const v = e.target.value; onChange(live ? live(v) : v); }}
      onBlur={() => { if (fmt) { const f = fmt(value); if (f !== value) onChange(f); } }} />
  );
}

function Area({ value, onChange, ph, cls = '', live, fmt }: {
  value: string; onChange: (v: string) => void; ph?: string; cls?: string;
  live?: (v: string) => string; fmt?: (v: string) => string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const rz = () => { const t = ref.current; if (t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; } };
  return (
    <textarea ref={ref} className={`cv-edit ${cls}`} value={value} placeholder={ph} rows={2}
      onChange={(e) => { onChange(live ? live(e.target.value) : e.target.value); rz(); }} onFocus={rz}
      onBlur={() => { if (fmt) { const f = fmt(value); if (f !== value) onChange(f); } }} />
  );
}

const EDIT_CSS = `
  .cv-edit:hover { background: rgba(79,70,229,.08); border-radius: 4px; }
  .cv-edit:focus { background: rgba(79,70,229,.14); box-shadow: 0 0 0 2px rgba(79,70,229,.55); border-radius: 4px; }
  .cv-grp { position: relative; }
  .cv-del { position: absolute; right: 2px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: #fff; display: none; place-items: center; padding: 0; line-height: 0; cursor: pointer; z-index: 8; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
  .cv-del svg { width: 11px; height: 11px; display: block; }
  .cv-grp:hover > .cv-del { display: grid; }
  /* linha em edição (com a lista de sugestões) fica acima das outras linhas */
  .cv-grp:focus-within { z-index: 50; }
  /* nas listas (habilidade/idioma/curso): X centralizado e dentro da borda, com respiro no input */
  .cv-grp.cv-skill > .cv-del, .cv-grp.cv-mini-item > .cv-del { top: 50%; transform: translateY(-50%); right: 2px; }
  .cv-grp.cv-skill .cv-edit, .cv-grp.cv-mini-item .cv-edit { padding-right: 24px; }
  .cv-grp.cv-skill, .cv-grp.cv-mini-item { margin-bottom: 10px; }
  /* botões "+ adicionar": cor herda do tema (clara em fundo escuro, escura em claro) e texto em MAIÚSCULO */
  .cv-addbtn { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: inherit; opacity: .8; cursor: pointer; border: 1px dashed currentColor; border-radius: 6px; padding: 3px 9px; margin-top: 4px; background: transparent; }
  .cv-addbtn:hover { opacity: 1; }
  .cv-secwrap { position: relative; }
  /* Experiência / Educação: cartão no editor (não afeta o PDF) */
  .cv-grp.cv-item { padding: 12px 40px 12px 14px; border: 1px solid #e8ebf2; border-radius: 12px; background: #fafbff; margin-bottom: 14px; transition: border-color .15s, box-shadow .15s; }
  .cv-grp.cv-item:hover { border-color: #c7d2fe; box-shadow: 0 2px 12px rgba(79,70,229,.10); }
  .cv-grp.cv-item > .cv-del { top: 10px; right: 10px; transform: none; }
  .cv-grp.cv-item .cv-per input.cv-edit { border-bottom: 1px dashed #cbd5e1; border-radius: 0; }
  .cv-icon svg { width: 1em; height: 1em; }
  .cv-fotowrap { position: relative; }
  .cv-fotodel { position: absolute; right: 6px; top: 2px; background: #ef4444; color:#fff; border-radius: 50%; width: 22px; height: 22px; display: none; align-items: center; justify-content: center; cursor: pointer; z-index: 6; }
  .cv-fotowrap:hover .cv-fotodel { display: flex; }
  .cv-fotowrap + h3 { margin-top: 0; }
  .cv-foto-resize { position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; border-radius: 50%; background: #4f46e5; color: #fff; display: none; align-items: center; justify-content: center; cursor: nwse-resize; z-index: 7; box-shadow: 0 1px 5px rgba(0,0,0,.35); touch-action: none; }
  .cv-fotowrap:hover .cv-foto-resize { display: flex; }
  .cv-suggest { position: absolute; top: 100%; left: 0; z-index: 60; margin-top: 2px; min-width: 180px; max-width: 280px; max-height: 220px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.16); padding: 4px; }
  .cv-suggest button { display: block; width: 100%; text-align: left; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; padding: 6px 9px; border-radius: 6px; background: transparent; border: 0; cursor: pointer; white-space: nowrap; }
  .cv-suggest button.on, .cv-suggest button:hover { background: #e0e7ff; color: #4338ca; }
`;

export default function EditorCanvas({ data, onChange, design, sections: sec, foto, onFoto, onFotoTamanho }: Props) {
  const dual = design.layout === 'dual';
  const r = resolveDesign(design);
  const set = (p: Partial<CurriculoData>) => onChange({ ...data, ...p });
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // ── redimensionar a foto arrastando a alça (direto no currículo) ───────────
  const tamFoto = design.fotoTamanho ?? 116;
  const resizeRef = useRef<{ x: number; size: number } | null>(null);
  const iniciarResize = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    resizeRef.current = { x: e.clientX, size: tamFoto };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moverResize = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const d = e.clientX - resizeRef.current.x;
    const novo = Math.max(72, Math.min(180, Math.round((resizeRef.current.size + d) / 2) * 2));
    onFotoTamanho?.(novo);
  };
  const fimResize = (e: React.PointerEvent) => {
    resizeRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  };

  const setExp = (id: string, p: Partial<Experiencia>) => set({ experiencias: data.experiencias.map((e) => e.id === id ? { ...e, ...p } : e) });
  const addExp = () => set({ experiencias: [...data.experiencias, { id: gerarId('exp', data.experiencias.length + (Date.now() % 1000)), empresa: '', cargo: '', inicio: '', fim: '', atual: false, atividades: '' }] });
  const delExp = (id: string) => set({ experiencias: data.experiencias.filter((e) => e.id !== id) });
  const setEdu = (id: string, p: Partial<Formacao>) => set({ formacoes: data.formacoes.map((f) => f.id === id ? { ...f, ...p } : f) });
  const addEdu = () => set({ formacoes: [...data.formacoes, { id: gerarId('edu', data.formacoes.length + (Date.now() % 1000)), escolaridade: '', curso: '', instituicao: '', anoConclusao: '' }] });
  const delEdu = (id: string) => set({ formacoes: data.formacoes.filter((f) => f.id !== id) });
  const setCur = (id: string, p: Partial<Curso>) => set({ cursos: data.cursos.map((c) => c.id === id ? { ...c, ...p } : c) });
  const addCur = () => set({ cursos: [...data.cursos, { id: gerarId('curso', data.cursos.length + (Date.now() % 1000)), nome: '', instituicao: '', cargaHoraria: '' }] });
  const delCur = (id: string) => set({ cursos: data.cursos.filter((c) => c.id !== id) });
  const setHab = (i: number, v: string) => set({ habilidades: data.habilidades.map((h, idx) => idx === i ? v : h) });
  const addHab = () => set({ habilidades: [...data.habilidades, ''] });
  const delHab = (i: number) => set({ habilidades: data.habilidades.filter((_, idx) => idx !== i) });
  const setIdi = (i: number, v: string) => set({ idiomas: data.idiomas.map((x, idx) => idx === i ? v : x) });
  const addIdi = () => set({ idiomas: [...data.idiomas, ''] });
  const delIdi = (i: number) => set({ idiomas: data.idiomas.filter((_, idx) => idx !== i) });

  const escolherFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => { if (typeof rd.result === 'string') setCropSrc(rd.result); };
    rd.readAsDataURL(file); e.target.value = '';
  };

  const Foto = sec.foto && (
    <div className="cv-fotowrap" style={{ width: tamFoto, maxWidth: '100%', margin: design.layout === 'topo' ? 0 : '0 auto 18px', position: 'relative' }}>
      <label className="cv-photo" style={{ width: '100%', margin: 0, cursor: 'pointer', backgroundImage: foto ? `url(${foto})` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, textAlign: 'center', fontSize: 10 }}>
        {!foto && <><Upload className="h-4 w-4" /><span style={{ opacity: .7 }}>Selecione sua foto</span></>}
        <input type="file" accept="image/*" className="hidden" onChange={escolherFoto} />
      </label>
      {foto && <span className="cv-fotodel" onClick={() => onFoto(undefined)} title="Remover foto"><X className="h-3.5 w-3.5" /></span>}
      {onFotoTamanho && (
        <span className="cv-foto-resize" title="Arraste para redimensionar a foto"
          onPointerDown={iniciarResize} onPointerMove={moverResize} onPointerUp={fimResize} onPointerCancel={fimResize}>
          <Maximize2 className="h-3 w-3" />
        </span>
      )}
    </div>
  );

  const Contato = sec.contato && (
    <>
      {dual && <h3>Contato</h3>}
      <div className={dual ? '' : 'cv-single-contact'}>
        <div className="cv-contact-row">{r.contactIcons && <Ico html={ICON.mail} />}<Txt value={data.email} onChange={(v) => set({ email: v })} ph="email@exemplo.com" live={(v) => v.replace(/\s/g, '').toLowerCase()} fmt={fEmail} /></div>
        <div className="cv-contact-row">{r.contactIcons && <Ico html={ICON.phone} />}<Txt value={data.telefone} onChange={(v) => set({ telefone: v })} ph="(11) 91234-5678" live={maskTel} /></div>
        <div className="cv-contact-row">{r.contactIcons && <Ico html={ICON.pin} />}<Txt value={[data.cidade, data.estado].filter(Boolean).join(', ')} onChange={(v) => { const [c, e] = v.split(','); set({ cidade: (c || '').trim(), estado: (e || '').trim() }); }} ph="Cidade, UF" live={liveCidadeUF} /></div>
        <div className="cv-contact-row">{r.contactIcons && <Ico html={ICON.user} />}<Txt value={data.linkedin} onChange={(v) => set({ linkedin: v })} ph="linkedin.com/in/voce" live={(v) => v.replace(/\s/g, '')} /></div>
      </div>
    </>
  );

  const Dados = sec.dadosPessoais && (
    <>
      <h3>Dados Pessoais</h3>
      <div className="cv-info"><b>Nascimento:</b> <Txt value={data.dataNascimento} onChange={(v) => set({ dataNascimento: v })} ph="dd/mm/aaaa" live={maskDataNasc} fmt={fData} style={{ width: 'auto', display: 'inline' }} /></div>
      <div className="cv-info" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><b>Estado civil:</b><span style={{ flex: 1 }}><AutoTxt value={data.estadoCivil} onChange={(v) => set({ estadoCivil: v })} options={SUG_ESTADO_CIVIL} ph="Selecione..." live={capFrase} fmt={fCivil} /></span></div>
      <div className="cv-info" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><b>Nacionalidade:</b><span style={{ flex: 1 }}><AutoTxt value={data.nacionalidade} onChange={(v) => set({ nacionalidade: v })} options={SUG_NACIONALIDADE} ph="Brasileira" live={capFrase} fmt={fNac} /></span></div>
      <div className="cv-info"><b>Endereço:</b> <Txt value={data.endereco} onChange={(v) => set({ endereco: v })} ph="Rua / Av." live={capWords} /></div>
      <div className="cv-info" style={{ display: 'flex', gap: 6 }}>
        <span><b>Nº:</b> <Txt value={data.numero} onChange={(v) => set({ numero: v })} ph="123" style={{ width: 50, display: 'inline' }} /></span>
        <span style={{ flex: 1 }}><b>Bairro:</b> <Txt value={data.bairro} onChange={(v) => set({ bairro: v })} ph="Bairro" live={capWords} style={{ width: 'auto', display: 'inline' }} /></span>
      </div>
      <div className="cv-info"><b>CEP:</b> <Txt value={data.cep} onChange={(v) => set({ cep: v })} ph="00000-000" live={maskCep} style={{ width: 'auto', display: 'inline' }} /></div>
    </>
  );

  const Hab = sec.habilidades && (
    <div className="cv-secwrap">
      {dual ? <h3>Habilidades</h3> : <h2>Habilidades</h2>}
      {data.habilidades.map((h, i) => (
        <div key={i} className="cv-grp cv-skill">
          <AutoTxt value={h} onChange={(v) => setHab(i, v)} options={SUG_HABILIDADES.filter((o) => !data.habilidades.includes(o))} ph="Habilidade" live={capFrase} fmt={fTitulo} />
          <span className="cv-del" onClick={() => delHab(i)}><X className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addHab}><Plus className="h-3 w-3" /> habilidade</span>
    </div>
  );

  const Idi = sec.idiomas && (
    <div className="cv-secwrap">
      {dual ? <h3>Idiomas</h3> : <h2>Idiomas</h2>}
      {data.idiomas.map((x, i) => (
        <div key={i} className="cv-grp cv-mini-item">
          <AutoTxt value={x} onChange={(v) => setIdi(i, v)} options={SUG_IDIOMAS.filter((o) => !data.idiomas.includes(o))} ph="Ex: Inglês - Intermediário" live={capWords} />
          <span className="cv-del" onClick={() => delIdi(i)}><X className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addIdi}><Plus className="h-3 w-3" /> idioma</span>
    </div>
  );

  const Cur = sec.cursos && (
    <div className="cv-secwrap">
      {dual ? <h3>Cursos e Certificações</h3> : <h2>Cursos e Certificações</h2>}
      {data.cursos.map((c) => (
        <div key={c.id} className="cv-grp cv-mini-item">
          <AutoTxt value={c.nome} onChange={(v) => setCur(c.id, { nome: v })} options={SUG_CURSOS} ph="Nome do curso" live={capWords} fmt={fCurso} style={{ fontWeight: 600 }} />
          <Txt value={[c.instituicao, c.cargaHoraria].filter(Boolean).join(' • ')} onChange={(v) => { const [inst, ch] = v.split('•'); setCur(c.id, { instituicao: (inst || '').trim(), cargaHoraria: (ch || '').trim() }); }} ph="Instituição • carga" style={{ opacity: .82, fontSize: '.86em' }} />
          <span className="cv-del" onClick={() => delCur(c.id)}><X className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addCur}><Plus className="h-3 w-3" /> curso</span>
    </div>
  );

  const NomeCargo = (
    <>
      <Txt cls="cv-name" value={data.nome} onChange={(v) => set({ nome: v })} ph="Nome Sobrenome" live={capWords} />
      {sec.cargo && <Txt cls="cv-cargo" value={data.objetivo} onChange={(v) => set({ objetivo: v })} ph="Seu cargo" live={capWords} fmt={fTitulo} />}
    </>
  );

  const Perfil = sec.perfil && (
    <div className="cv-secwrap"><h2>Perfil</h2>
      <Area cls="cv-desc" value={data.perfilProfissional} onChange={(v) => set({ perfilProfissional: v })} ph="Digite seu resumo profissional. Destaque suas principais competências e experiência em 2-3 frases." live={capFrase} />
    </div>
  );

  const Qualif = sec.qualificacoes && (
    <div className="cv-secwrap"><h2>Qualificações e Informações Adicionais</h2>
      <Area cls="cv-desc" value={data.qualificacoes} onChange={(v) => set({ qualificacoes: v })} ph="Ex: Disponibilidade para início imediato, CNH categoria B, disponibilidade para viagens..." live={capFrase} />
    </div>
  );

  const Exp = sec.experiencia && (
    <div className="cv-secwrap"><h2>Experiência Profissional</h2>
      {data.experiencias.map((e) => (
        <div key={e.id} className="cv-grp cv-item">
          <Txt cls="cv-role" value={e.cargo} onChange={(v) => setExp(e.id, { cargo: v })} ph="Cargo" live={capWords} fmt={fCargoExp} />
          <Txt cls="cv-org" value={e.empresa} onChange={(v) => setExp(e.id, { empresa: v })} ph="Nome da Empresa" live={capWords} />
          <div className="cv-per" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Txt value={e.inicio} onChange={(v) => setExp(e.id, { inicio: v })} ph="Início" fmt={fData} style={{ width: 70 }} />
            <span>–</span>
            <Txt value={e.atual ? 'Atual' : e.fim} onChange={(v) => setExp(e.id, { fim: v })} ph="Fim" fmt={fData} style={{ width: 70 }} />
            <label style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 6 }}>
              <input type="checkbox" checked={e.atual} onChange={(ev) => setExp(e.id, { atual: ev.target.checked, fim: ev.target.checked ? '' : e.fim })} style={{ width: 'auto' }} /> atual
            </label>
          </div>
          <Area cls="cv-desc" value={e.atividades} onChange={(v) => setExp(e.id, { atividades: v })} ph="Descreva suas atividades..." live={capFrase} fmt={(v) => (v ? descreverExperiencia(v, e.cargo) : v)} />
          <span className="cv-del" onClick={() => delExp(e.id)}><Trash2 className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addExp}><Plus className="h-3 w-3" /> experiência</span>
    </div>
  );

  const Edu = sec.educacao && (
    <div className="cv-secwrap"><h2>Educação</h2>
      {data.formacoes.map((f) => (
        <div key={f.id} className="cv-grp cv-item">
          <Txt cls="cv-role" value={f.escolaridade || f.curso} onChange={(v) => setEdu(f.id, { escolaridade: v })} ph="Grau / Escolaridade" live={capFrase} fmt={fEscol} />
          <Txt cls="cv-org" value={f.instituicao} onChange={(v) => setEdu(f.id, { instituicao: v })} ph="Universidade / Instituição" live={capWords} />
          <div className="cv-per" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Txt value={f.curso} onChange={(v) => setEdu(f.id, { curso: v })} ph="Curso" live={capWords} fmt={fTitulo} style={{ width: 160 }} />
            <Txt value={f.anoConclusao} onChange={(v) => setEdu(f.id, { anoConclusao: v })} ph="Ano" live={(v) => v.replace(/\D/g, '').slice(0, 4)} style={{ width: 60 }} />
          </div>
          <span className="cv-del" onClick={() => delEdu(f.id)}><Trash2 className="h-3 w-3" /></span>
        </div>
      ))}
      <span className="cv-addbtn" onClick={addEdu}><Plus className="h-3 w-3" /> formação</span>
    </div>
  );

  return (
    <div style={{ position: 'relative', maxWidth: 794, margin: '0 auto', background: design.bgColor, boxShadow: '0 4px 24px rgba(0,0,0,.12)' }}>
      <style dangerouslySetInnerHTML={{ __html: `.cv-root svg{fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}` + buildCSS(design) + EDIT_CSS }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: WATERMARK, backgroundRepeat: 'repeat', pointerEvents: 'none', zIndex: 30 }} />
      <div className={`cv-root${design.layout === 'topo' ? ' cv-topo-root' : ''}${design.headerAlign === 'center' ? ' cv-center' : ''}`}>
        {dual ? (
          <>
            <aside className="cv-side">{Foto}{Contato}{Dados}{Hab}{Idi}{Cur}</aside>
            <main className="cv-main">{NomeCargo}{Perfil}{Exp}{Edu}{Qualif}</main>
          </>
        ) : design.layout === 'topo' ? (
          <>
            <header className="cv-topo">{Foto}<div className="cv-topo-info">{NomeCargo}{Contato}</div></header>
            <main className="cv-main">{Perfil}{Exp}{Edu}{Hab}{Idi}{Cur}{Qualif}{Dados}</main>
          </>
        ) : (
          <main className="cv-main">{NomeCargo}{Contato}{Perfil}{Exp}{Edu}{Hab}{Idi}{Cur}{Qualif}{Dados}</main>
        )}
      </div>

      {cropSrc && (
        <FotoCropper src={cropSrc} onConfirm={(d) => { onFoto(d); setCropSrc(null); }} onCancel={() => setCropSrc(null)} />
      )}
    </div>
  );
}
