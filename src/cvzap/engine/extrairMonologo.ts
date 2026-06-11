// ── Extração de currículo a partir de um monólogo (fala corrida) ─────────────
// Versão GRÁTIS/offline: reaproveita os parsers locais para transformar um texto
// falado ("meu nome é..., tenho X anos, trabalhei como... na empresa...") num
// CurriculoData completo, e aponta o que ficou faltando. Sem IA externa/chave.
import { curriculoVazio, type CurriculoData, type Experiencia } from '../types';
import {
  validarNome, normalizarData, normalizarEstadoCivil, normalizarNacionalidade,
  normalizarLocal, normalizarTelefone, normalizarEmail, normalizarTitulo,
  detectarProfissao, normalizarHabilidades, detectarCursos, normalizarEscolaridade,
  gerarPerfilProfissional,
} from './normalize';
import { calcularIdade, gerarId } from './parsers';

export interface ResultadoExtracao {
  data: CurriculoData;
  capturado: string[]; // rótulos do que foi preenchido (pra mostrar pro usuário)
  faltando: string[];  // campos importantes que faltaram
}

const LANGS: Record<string, string> = {
  ingles: 'Inglês', inglês: 'Inglês', espanhol: 'Espanhol', frances: 'Francês', francês: 'Francês',
  alemao: 'Alemão', alemão: 'Alemão', italiano: 'Italiano', mandarim: 'Mandarim', japones: 'Japonês', japonês: 'Japonês',
};
// stems de nível (ordem só importa pro mapeamento, não pra prioridade)
const NIVEIS_STEM: Array<[RegExp, string]> = [
  [/nativ/, 'Nativo'], [/fluen/, 'Fluente'], [/avan[çc]|profission/, 'Avançado'],
  [/interm/, 'Intermediário'], [/b[áa]sic/, 'Básico'],
];

const MINUS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);
const cap1 = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
// title-case "cru" (sem corrigir grafia — preserva nomes próprios/empresas)
function tc(s: string): string {
  return s.replace(/\s+/g, ' ').trim().split(' ').map((w, i) => {
    const l = w.toLowerCase();
    if (i > 0 && MINUS.has(l)) return l;
    return l.charAt(0).toUpperCase() + l.slice(1);
  }).join(' ');
}
// remove gaguejos ("de de" -> "de", "que que" -> "que")
const semRepetir = (s: string) => s.replace(/\b([a-zà-ÿ]+)\s+\1\b/gi, '$1');

// extrai todas as datas (dd/mm/aaaa, mm/aaaa, "março de 2023", aaaa) de um trecho
function acharDatas(trecho: string): string[] {
  const re = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{4}|(?:janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+\d{4}|(?:19|20)\d{2})\b/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(trecho))) { const v = normalizarData(m[0]).valor; if (v) out.push(v); }
  return out;
}

// monta uma experiência a partir de um bloco de frases que descreve um trabalho
function experienciaDoBloco(bloco: string, idx: number): Experiencia | null {
  const baixa = bloco.toLowerCase();
  const atual = /\b(atual|atualmente|até hoje|ate hoje|até agora|ate agora|no momento|presente|hoje em dia)\b/.test(baixa);
  const datas = acharDatas(bloco);

  // cargo: depois do verbo de trabalho ("trabalhei na portaria", "atuei como vendedor", "fui caixa")
  let cargo = '';
  const mc = baixa.match(/\b(?:trabalh\w+|atu\w+|fui|estagi\w+|exerc\w+)\s+(?:como|de|na|no|num|numa|com)?\s*([a-zà-ÿ][a-zà-ÿ\s]{2,30}?)(?=\s*[,.;]|\s+(?:na empresa|empresa|durante|por|de\s|onde)|$)/);
  if (mc) {
    const termo = mc[1].trim();
    if (!/^empresa$/.test(termo)) { const p = detectarProfissao(termo); cargo = p ? p.profissao : tc(termo); }
  }

  // empresa: depois de "empresa" (aceita minúsculas — nomes próprios não passam por correção de grafia)
  let empresa = '';
  const me = baixa.match(/\bempresa\s+([a-zà-ÿ0-9][a-zà-ÿ0-9&\- ]{1,40}?)(?=\s*[,.;]|\s+(?:durante|por|de\s|onde|atualmente)|$)/);
  if (me) empresa = tc(me[1].replace(/[.,;]+$/, '').trim());
  if (!empresa) {
    const me2 = bloco.match(/\b(?:na|no|da|do|pela|pelo)\s+([A-ZÀ-Ý][\wÀ-ÿ&.\-]*(?:\s+[A-ZÀ-Ý0-9][\wÀ-ÿ&.\-]*){0,3})/);
    if (me2 && !/portaria|cozinha|loja|setor/i.test(me2[1])) empresa = me2[1].replace(/[.,;]$/, '').trim();
  }

  // atividades
  let atividades = '';
  const ma = bloco.match(/\b(?:respons[áa]vel por|fazia|minhas fun[çc][õo]es (?:eram|era|incluíam)?|cuidava (?:de|da|do)|atividades?:?)\s+(.{4,200})/i);
  if (ma) atividades = cap1(ma[1].replace(/\s+/g, ' ').trim().replace(/[.;]+$/, '')) + '.';

  if (!cargo && !empresa && !datas.length) return null;
  return { id: gerarId('exp', idx), cargo, empresa, inicio: datas[0] || '', fim: atual ? '' : (datas[1] || ''), atual, atividades };
}

// nível de um idioma: procura o stem de nível na janela após a citação, mas sem
// cruzar para a menção do próximo idioma (evita "herdar" o nível do outro).
function nivelIdioma(janela: string): string {
  let melhor = 'Básico'; let menorIdx = Infinity;
  for (const [re, nome] of NIVEIS_STEM) {
    const m = janela.match(re);
    if (m && m.index !== undefined && m.index < menorIdx) { menorIdx = m.index; melhor = nome; }
  }
  return melhor;
}

export function extrairCurriculoDeMonologo(texto: string, base?: CurriculoData): ResultadoExtracao {
  const d: CurriculoData = { ...curriculoVazio(), ...(base || {}) };
  const t = ' ' + texto.replace(/\s+/g, ' ').trim() + ' ';
  const baixa = t.toLowerCase();
  const cap: string[] = [];

  // nome
  const mn = t.match(/\b(?:meu nome (?:completo )?(?:é|e)|me chamo|eu sou(?:\s+(?:o|a))?|sou(?:\s+(?:o|a))?)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\s]{1,55}?)(?=\s*[,.;]|\s+(?:tenho|nasci|sou|moro|tel|whats|email|e-?mail|trabalh|estud|formad|solteir|casad)|$)/i);
  if (mn) { const v = validarNome(mn[1]); if (v.valido) { d.nome = v.valor; cap.push('Nome'); } }

  // nascimento + idade
  const mNasc = baixa.match(/nasc\w*\s+(?:em|no dia|dia)?\s*([^,.;]{4,30})/);
  if (mNasc) {
    const dt = normalizarData(mNasc[1]);
    if (dt.valor.length === 10) { d.dataNascimento = dt.valor; const i = calcularIdade(dt.valor); if (i) d.idade = i; cap.push('Nascimento'); }
  }
  if (!d.idade) {
    const mi = baixa.match(/\b(\d{1,2})\s*anos?\b/);
    if (mi && +mi[1] >= 14 && +mi[1] <= 90) { d.idade = mi[1]; if (!d.dataNascimento) cap.push('Idade'); }
  }

  // estado civil
  const mCivil = baixa.match(/\b(solteir[oa]|casad[oa]|divorciad[oa]|vi[úu]v[oa]|separad[oa]|uni[ãa]o est[áa]vel|amasiad[oa])\b/);
  if (mCivil) { d.estadoCivil = normalizarEstadoCivil(mCivil[1]).valor; cap.push('Estado civil'); }

  // nacionalidade
  const mNac = baixa.match(/\b(brasileir[oa]|estrangeir[oa]|portugu[êe]s[ae]?)\b/);
  if (mNac) d.nacionalidade = normalizarNacionalidade(mNac[1]);

  // cidade / estado (pega a cidade e o segmento seguinte, que costuma ser o estado)
  const mLoc = t.match(/\b(?:moro em|moro na|moro no|sou de|resido em|na cidade de|cidade de)\s+([^,.;]{2,40})(?:\s*,\s*([^,.;]{2,30}))?/i);
  if (mLoc) {
    let loc = mLoc[1];
    if (mLoc[2] && !/bairro|endere|rua|av\b|setor|lote|quadra|casa|n[uú]mero/i.test(mLoc[2])) loc += ' ' + mLoc[2];
    loc = loc.replace(/goi[áa]is|goi[áa]s/gi, 'goias'); // erro comum de fala
    const r = normalizarLocal(loc);
    if (r.valor.cidade) d.cidade = r.valor.cidade;
    if (r.valor.estado) d.estado = r.valor.estado;
    if (d.cidade || d.estado) cap.push('Cidade/UF');
  }

  // bairro
  const mBairro = baixa.match(/\bbairro\s+([a-zà-ÿ0-9][a-zà-ÿ0-9\s]{1,28}?)(?=\s*(?:[,.;]|no\s|na\s|endere|cep|$))/);
  if (mBairro) { d.bairro = tc(mBairro[1]); cap.push('Bairro'); }

  // endereço + número/lote
  const mEnd = baixa.match(/\b(?:endere[çc]o(?:\s+(?:é|e|fica))?|moro (?:no|na)|fica (?:no|na))\s+([a-zà-ÿ0-9][a-zà-ÿ0-9\s.]{2,45}?)(?=\s*(?:[,.;]|cep|bairro|n[uú]mero|lote|$))/);
  if (mEnd && !/^(bairro|cidade)/.test(mEnd[1])) { d.endereco = tc(mEnd[1].replace(/\.$/, '')); if (d.endereco) cap.push('Endereço'); }
  const mNum = baixa.match(/\b(?:n[uú]mero|lote|casa|n[ºo°.]+)\s*(\d{1,5})/);
  if (mNum) d.numero = mNum[1];

  // telefone (lida com "61. 998221210", "(61) 99822-1210", etc.)
  const mTelTrig = baixa.match(/(?:telefone|celular|whats\w*|contato|n[uú]mero|fone)\D{0,6}([\d().\-\s]{8,22})/);
  let telBruto = mTelTrig ? mTelTrig[1] : '';
  if (telBruto.replace(/\D/g, '').length < 10) { const m = t.match(/(?:\(?\d{2}\)?[\s.\-]*)?\d{4,5}[\s.\-]?\d{4}/); telBruto = m ? m[0] : telBruto; }
  const dig = telBruto.replace(/\D/g, '');
  if (dig.length >= 10 && dig.length <= 11) { const r = normalizarTelefone(dig); if (r.valor) { d.telefone = r.valor; cap.push('Telefone'); } }

  // e-mail ("fulano arroba gmail ponto com")
  const txtEmail = t.replace(/\s+arroba\s+/gi, '@').replace(/\s+ponto\s+/gi, '.');
  const mEmail = txtEmail.match(/[^\s,;]+@[^\s,;]+\.[a-z]{2,}/i);
  if (mEmail) { const r = normalizarEmail(mEmail[0]); if (r.confianca >= 0.6) { d.email = r.valor; cap.push('E-mail'); } }

  // cargo desejado / objetivo (preserva o que a pessoa disse — não troca por profissão canônica)
  const mObj = baixa.match(/\b(?:desejo (?:trabalhar )?(?:como|de|no cargo de|na [áa]rea de)|quero (?:trabalhar |atuar |uma vaga )?(?:como|de|no cargo de|na [áa]rea de)|vaga de|cargo de|objetivo\s+(?:é|e)?|busco (?:vaga|emprego)(?:\s+(?:como|de))?|pretendo ser|gostaria de (?:ser|trabalhar como))\s+([a-zà-ÿ][a-zà-ÿ\s]{2,45}?)(?=\s*[,.;]|\s+(?:porque|pois)|$)/);
  if (mObj) { d.objetivo = tc(semRepetir(mObj[1].trim())); if (d.objetivo) cap.push('Cargo desejado'); }

  // idiomas — posição de cada idioma para janelas que não se sobrepõem
  const posLang = Object.keys(LANGS).map((k) => ({ at: baixa.indexOf(k), nome: LANGS[k] })).filter((x) => x.at >= 0).sort((a, b) => a.at - b.at);
  const idiomas: string[] = [];
  posLang.forEach((p, i) => {
    const ini = p.at;
    const fim = Math.min(ini + 48, i + 1 < posLang.length ? posLang[i + 1].at : baixa.length);
    const nivel = nivelIdioma(baixa.slice(ini, fim));
    if (!idiomas.some((x) => x.startsWith(p.nome))) idiomas.push(`${p.nome} - ${nivel}`);
  });
  if (idiomas.length) { d.idiomas = idiomas; cap.push('Idiomas'); }

  // cursos — primeiro a enumeração explícita ("fiz curso de X, Y e Z"); senão, dicionário
  const cursosNomes: string[] = [];
  const reCurso = /\bcursos?\s+(?:de|em)\s+([^.;!?]{3,180})/gi;
  let mcu: RegExpExecArray | null;
  while ((mcu = reCurso.exec(t))) {
    mcu[1].split(/\s*(?:,|;|\be\b)\s*/i).forEach((p) => {
      const limpo = p.toLowerCase().replace(/^(também|tambem|já|ja|tenho|tive|fiz|o|a|um|uma)\s+/g, '').trim();
      // mantém só as palavras iniciais "de curso", parando em palavras de preenchimento da fala
      const STOP = new Set(['é', 'e', 'meu', 'minha', 'seu', 'sua', 'eu', 'falo', 'sei', 'moro', 'também', 'tambem', 'que', 'tenho', 'tive']);
      const keep: string[] = [];
      for (const w of limpo.split(/\s+/)) { if (STOP.has(w)) break; keep.push(w); if (keep.length >= 4) break; }
      const v = keep.join(' ').trim();
      if (v.length >= 2 && v.length <= 40 && !cursosNomes.some((c) => c.toLowerCase() === tc(v).toLowerCase())) cursosNomes.push(tc(v));
    });
  }
  if (!cursosNomes.length) { detectarCursos(t).forEach((c) => { if (!Object.values(LANGS).some((l) => c.includes(l))) cursosNomes.push(c); }); }
  if (cursosNomes.length) { d.cursos = cursosNomes.slice(0, 8).map((nome, i) => ({ id: gerarId('curso', i), nome, instituicao: '', cargaHoraria: '' })); cap.push('Cursos'); }

  // escolaridade / formação
  const mEsc = baixa.match(/\b(ensino fundamental|ensino m[ée]dio|ensino superior|superior completo|superior incompleto|t[ée]cnico|tecn[óo]logo|gradua[çc][ãa]o|p[óo]s[\- ]?gradua[çc][ãa]o|mestrado|doutorado|faculdade|formad[oa] em)\b/);
  if (mEsc) { const esc = normalizarEscolaridade(mEsc[1]).valor; if (esc) { d.formacoes = [{ id: gerarId('edu', 0), escolaridade: esc, curso: '', instituicao: '', anoConclusao: '' }]; cap.push('Formação'); } }

  // habilidades (só com gatilho explícito)
  const mHab = baixa.match(/\b(?:minhas habilidades (?:s[ãa]o|incluem)|sei (?:fazer|mexer|trabalhar com|usar|lidar com)|tenho habilidade (?:em|com)|pontos fortes (?:s[ãa]o)?|sou bom (?:em|com)|sou boa (?:em|com)|domino)\s+(.{3,120}?)(?=[.;!?]|$)/);
  if (mHab) {
    const r = normalizarHabilidades(mHab[1]);
    if (!r.usouPadrao && r.lista.length) { d.habilidades = r.lista.slice(0, 8); cap.push('Habilidades'); }
  }

  // experiências — quebra em frases, ignora frases de objetivo e junta blocos do mesmo trabalho
  const frases = t.split(/(?<=[.;!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const VERBO = /\b(trabalh\w+|atu\w+|fui|estagi\w+|exerc\w+)\b/;
  const OBJ = /\b(desejo|quero|gostaria|pretendo|busco|objetivo|vaga|pretens)/;
  const CONT = /\b(empresa|durante|por\s+\w+\s+(?:ano|anos|m[êe]s|meses|semana)|onde|fazia|era respons|respons[áa]vel|de\s+\d|\d{4}|atualmente|at[ée]\s+hoje)/;
  const blocos: string[] = [];
  let buf = '';
  for (const f of frases) {
    const low = f.toLowerCase();
    if (OBJ.test(low)) { if (buf) { blocos.push(buf); buf = ''; } continue; } // objetivo nunca vira experiência
    if (VERBO.test(low)) { if (buf) blocos.push(buf); buf = f; }            // novo trabalho
    else if (CONT.test(low) && buf) { buf += ' ' + f; }                     // continuação do trabalho atual
    else if (buf) { blocos.push(buf); buf = ''; }
  }
  if (buf) blocos.push(buf);
  const exps: Experiencia[] = [];
  blocos.forEach((b, i) => { const e = experienciaDoBloco(b, i); if (e && exps.length < 8) exps.push(e); });
  if (exps.length) { d.experiencias = exps; cap.push(`Experiência (${exps.length})`); }

  // perfil profissional automático
  if (!d.perfilProfissional) { const p = gerarPerfilProfissional(d); if (p) { d.perfilProfissional = p; cap.push('Perfil'); } }

  // ── o que ficou faltando ───────────────────────────────────────────────────
  const faltando: string[] = [];
  if (!d.nome) faltando.push('Nome completo');
  if (!d.telefone && !d.email) faltando.push('Contato (telefone ou e-mail)');
  if (!d.cidade && !d.estado) faltando.push('Cidade e estado');
  if (!d.objetivo) faltando.push('Cargo desejado');
  if (!d.experiencias.length) faltando.push('Experiência profissional');
  if (!d.formacoes.length) faltando.push('Escolaridade');

  return { data: d, capturado: cap, faltando };
}
