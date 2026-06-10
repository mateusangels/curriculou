// ── Fachada da Normalização Inteligente (seções 1–13 da especificação) ───────
import { chave, melhorOpcao, similaridade, levenshtein } from './levenshtein';
import {
  CORRECOES, VOCABULARIO, CONECTORES, ESCOLARIDADE, CURSOS, PROFISSOES,
  DOMINIOS, NEGATIVAS_VAZIO, FRASES_RUINS, HABILIDADES_PADRAO,
  MESES, NUMEROS_EXTENSO, CIDADES_ACENTO,
} from './dictionary';

export interface Normalizado<T = string> {
  valor: T;
  original: string;
  confianca: number; // 0..1
  precisaConfirmar: boolean; // confianca < 0.7
}

const LIMIAR_CONFIRMA = 0.7;

function fechar<T>(valor: T, original: string, confianca: number): Normalizado<T> {
  const c = Math.max(0, Math.min(1, confianca));
  return { valor, original, confianca: c, precisaConfirmar: c < LIMIAR_CONFIRMA };
}

// ── 1) Correção ortográfica + título profissional ─────────────────────────────
export function corrigirPalavra(token: string): { valor: string; conf: number } {
  const k = chave(token);
  if (!k) return { valor: token, conf: 1 };
  if (CORRECOES[k]) return { valor: CORRECOES[k], conf: 0.98 };
  if (k.length >= 4 && !/\d/.test(k)) {
    const limiar = k.length <= 5 ? 0.8 : 0.74;
    const m = melhorOpcao(k, VOCABULARIO, limiar);
    if (m && CORRECOES[m.valor]) return { valor: CORRECOES[m.valor], conf: m.confianca };
    if (m) return { valor: capitalizar(m.valor), conf: m.confianca };
  }
  return { valor: token, conf: 1 };
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Normaliza um título/área/curso livre: corrige erros e aplica caixa correta. */
export function normalizarTitulo(texto: string): Normalizado {
  const limpo = limparPrefixos(texto).replace(/\s+/g, ' ').trim();
  if (!limpo) return fechar('', texto, 0);
  const tokens = limpo.split(' ');
  let minConf = 1;
  const out = tokens.map((tk, i) => {
    const { valor, conf } = corrigirPalavra(tk);
    minConf = Math.min(minConf, conf);
    const k = chave(valor);
    if (i > 0 && CONECTORES.has(k)) return k;
    return valor.includes(' ') ? valor : capitalizarToken(valor);
  });
  return fechar(out.join(' '), texto, minConf);
}

function capitalizarToken(s: string): string {
  if (/^[A-ZÀ-Ý]/.test(s) && s.length > 1) return s; // já corrigido/acentuado
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function limparPrefixos(texto: string): string {
  return texto
    .replace(/^(meu nome (completo )?(e|é)|me chamo|sou o?a?|eu sou|chamo[- ]?me)\s+/i, '')
    .replace(/^(é|e|sou|trabalho na|trabalhei na|trabalho como|trabalhei como|na|no|de)\s+/i, '')
    .trim();
}

// ── 2) Datas ───────────────────────────────────────────────────────────────────
export function normalizarData(texto: string): Normalizado {
  const t = chave(texto);

  // data completa com separadores: 30/11/2005, 30-11-2005, 30 11 2005
  const sep = t.match(/\b(\d{1,2})\s*[\/\-. ]\s*(\d{1,2})\s*[\/\-. ]\s*(\d{2,4})\b/);
  if (sep) {
    const dia = +sep[1], mes = +sep[2];
    if (dia <= 31 && mes <= 12) return fechar(`${pad(dia)}/${pad(mes)}/${ano4(sep[3])}`, texto, 0.95);
  }

  // 8 dígitos seguidos: DDMMYYYY
  const oito = t.match(/\b(\d{2})(\d{2})(\d{4})\b/);
  if (oito && +oito[1] <= 31 && +oito[2] <= 12) {
    return fechar(`${oito[1]}/${oito[2]}/${oito[3]}`, texto, 0.9);
  }

  // mês por nome/extenso + ano
  const ano = (t.match(/\b(19\d{2}|20\d{2})\b/) || [])[1];
  let mesNum: number | null = null;
  for (const [nome, num] of Object.entries(MESES)) {
    if (new RegExp(`\\b${nome}\\b`).test(t)) { mesNum = num; break; }
  }
  if (mesNum === null) {
    for (const [nome, num] of Object.entries(NUMEROS_EXTENSO)) {
      if (new RegExp(`\\bmes\\w*\\s+${nome}\\b|\\b${nome}\\b`).test(t) && /mes|mês|meis/.test(t)) { mesNum = num; break; }
    }
  }
  if (mesNum === null) {
    // "mes 11", "meis 11 de 2024", "6/2021"
    const mm = t.match(/\b(?:mes|mês|meis)\w*\s+(\d{1,2})\b/) || t.match(/\b(\d{1,2})\s*\/\s*(?:19|20)\d{2}\b/);
    if (mm && +mm[1] <= 12) mesNum = +mm[1];
  }
  if (mesNum !== null && ano) return fechar(`${pad(mesNum)}/${ano}`, texto, 0.85);

  // 6 dígitos: MMYYYY
  const seis = t.match(/\b(\d{2})(\d{4})\b/);
  if (seis && +seis[1] <= 12) return fechar(`${seis[1]}/${seis[2]}`, texto, 0.8);

  // só o ano
  if (ano && !mesNum) return fechar(ano, texto, 0.75);

  // não reconheceu → devolve original com baixa confiança
  return fechar(texto.trim(), texto, 0.4);
}

const pad = (n: number) => String(n).padStart(2, '0');
function ano4(a: string): string {
  if (a.length === 4) return a;
  const n = +a;
  return (n > 30 ? '19' : '20') + a.padStart(2, '0');
}

// ── 3) Telefone ──────────────────────────────────────────────────────────────
export function normalizarTelefone(texto: string): Normalizado {
  let d = texto.replace(/\D/g, '');
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);
  if (d.length === 11) return fechar(`(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`, texto, 0.95);
  if (d.length === 10) return fechar(`(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`, texto, 0.9);
  return fechar(texto.trim(), texto, 0.4);
}

// ── 4) Cidade e estado ───────────────────────────────────────────────────────
const UF_NOME: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE',
  'distrito federal': 'DF', df: 'DF', 'espirito santo': 'ES', goias: 'GO', go: 'GO',
  maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG',
  para: 'PA', paraiba: 'PB', parana: 'PR', pernambuco: 'PE', piaui: 'PI',
  'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS',
  rondonia: 'RO', roraima: 'RR', 'santa catarina': 'SC', 'sao paulo': 'SP',
  sergipe: 'SE', tocantins: 'TO',
};
const SIGLAS = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);

export function normalizarLocal(texto: string): Normalizado<{ cidade: string; estado: string }> {
  let resto = ' ' + chave(texto) + ' ';
  let estado = '';

  // sigla isolada (maiúscula no original)
  const sig = (texto.toUpperCase().match(/\b([A-Z]{2})\b/) || [])[1];
  if (sig && SIGLAS.has(sig)) estado = sig;

  // nome de estado por extenso (procura o mais longo primeiro)
  if (!estado) {
    const nomes = Object.keys(UF_NOME).sort((a, b) => b.length - a.length);
    for (const nome of nomes) {
      if (resto.includes(` ${nome} `)) { estado = UF_NOME[nome]; resto = resto.replace(` ${nome} `, ' '); break; }
    }
  } else {
    // remove a sigla do resto
    resto = resto.replace(new RegExp(`\\b${sig.toLowerCase()}\\b`), ' ');
  }

  // cidade composta conhecida tem prioridade (antes de remover conectores como "de")
  let cidade = '';
  const compostas = Object.keys(CIDADES_ACENTO).filter((c) => c.includes(' ')).sort((a, b) => b.length - a.length);
  for (const c of compostas) {
    if (resto.includes(c)) { cidade = CIDADES_ACENTO[c]; resto = resto.replace(c, ' '); break; }
  }

  const cidadeKey = resto
    .replace(/\b(moro|em|na|no|cidade de|estado de|interior de|sou de|de)\b/g, ' ')
    .replace(/[,\-\/|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cidade && cidadeKey) {
    cidade = CIDADES_ACENTO[cidadeKey] || tituloSimples(cidadeKey);
  }

  const conf = cidade && estado ? 0.9 : cidade || estado ? 0.7 : 0.4;
  return fechar({ cidade, estado }, texto, conf);
}

function tituloSimples(s: string): string {
  return s.split(' ').filter(Boolean).map((p) => (CONECTORES.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(' ');
}

// ── 5) Escolaridade ──────────────────────────────────────────────────────────
export function normalizarEscolaridade(texto: string): Normalizado {
  const k = chave(limparPrefixos(texto));
  // tenta sinônimo exato (o mais específico/longo primeiro)
  let melhor: { valor: string; conf: number; len: number } | null = null;
  for (const { valor, sin } of ESCOLARIDADE) {
    for (const s of sin) {
      if (k.includes(s) && (!melhor || s.length > melhor.len)) {
        melhor = { valor, conf: 0.9 + Math.min(0.08, s.length / 200), len: s.length };
      }
    }
  }
  if (melhor) return fechar(melhor.valor, texto, melhor.conf);
  // fuzzy contra todos os sinônimos
  const todos = ESCOLARIDADE.flatMap((e) => e.sin.map((s) => ({ s, valor: e.valor })));
  let best: { valor: string; conf: number } | null = null;
  for (const { s, valor } of todos) {
    const sim = similaridade(k, s);
    if (sim >= 0.7 && (!best || sim > best.conf)) best = { valor, conf: sim };
  }
  if (best) return fechar(best.valor, texto, best.conf);
  return fechar(normalizarTitulo(texto).valor, texto, 0.5);
}

// ── 6) Cursos ────────────────────────────────────────────────────────────────
export function detectarCursos(texto: string): string[] {
  let k = chave(texto);
  // pares (valor, sinônimo) ordenados do mais específico (longo) ao mais genérico
  const pares = CURSOS
    .flatMap((c) => c.sin.map((s) => ({ valor: c.valor, s })))
    .sort((a, b) => b.s.length - a.s.length);
  const achados: string[] = [];
  for (const { valor, s } of pares) {
    const re = new RegExp(`\\b${s.replace(/ /g, '\\s+')}\\b`);
    if (re.test(k)) {
      if (!achados.includes(valor)) achados.push(valor);
      k = k.replace(re, ' '); // consome o trecho p/ não casar genérico depois
    }
  }
  return achados;
}

/** Normaliza o nome de um curso informado (curso a curso). */
export function normalizarCurso(texto: string): Normalizado {
  const det = detectarCursos(texto);
  if (det.length) return fechar(det[0], texto, 0.9);
  return normalizarTitulo(texto);
}

// ── 7+11) Experiência: detecta profissão e gera descrição profissional ────────
export function detectarProfissao(texto: string): { profissao: string; descricao: string; conf: number } | null {
  const k = chave(texto);
  let melhor: { profissao: string; descricao: string; conf: number } | null = null;
  for (const p of PROFISSOES) {
    for (const s of p.sin) {
      if (new RegExp(`\\b${s.replace(/ /g, '\\s+')}\\b`).test(k)) {
        const conf = 0.85 + Math.min(0.1, s.length / 100);
        if (!melhor || conf > melhor.conf) melhor = { profissao: p.profissao, descricao: p.descricao, conf };
      }
    }
  }
  if (melhor) return melhor;
  // fuzzy
  const todos = PROFISSOES.flatMap((p) => p.sin.map((s) => ({ s, p })));
  let best: { profissao: string; descricao: string; conf: number } | null = null;
  for (const { s, p } of todos) {
    const sim = similaridade(k, s);
    if (sim >= 0.78 && (!best || sim > best.conf)) best = { profissao: p.profissao, descricao: p.descricao, conf: sim };
  }
  return best;
}

const SUBST_VERBOS: Array<[RegExp, string]> = [
  [/\bfazia\b/gi, 'realização de'], [/\bfaco\b/gi, 'realização de'],
  [/\batendia\b/gi, 'atendimento a'], [/\bvendia\b/gi, 'venda de'],
  [/\bajudava\b/gi, 'apoio a'], [/\borganizava\b/gi, 'organização de'],
  [/\bcuidava\b/gi, 'gestão de'], [/\bmexia\b/gi, 'operação de'],
  [/\bdirigia\b/gi, 'condução de'], [/\blimpava\b/gi, 'limpeza de'],
];

/**
 * Gera a descrição final de uma experiência. Se reconhecer a profissão,
 * usa a descrição profissional pronta; senão, reescreve o texto do usuário.
 */
export function descreverExperiencia(textoAtividades: string, cargo?: string): string {
  const base = `${cargo || ''} ${textoAtividades || ''}`.trim();
  const det = detectarProfissao(base);
  // se o usuário escreveu pouquíssimo, confia na descrição da profissão
  const poucoTexto = chave(textoAtividades).split(' ').filter(Boolean).length <= 3;
  if (det && (poucoTexto || det.conf >= 0.9)) return det.descricao;

  // reescreve o texto livre num tom profissional
  let t = textoAtividades.trim();
  if (!t) return det ? det.descricao : '';
  for (const [re, rep] of SUBST_VERBOS) t = t.replace(re, rep);
  const partes = t.split(/[,;\n]|\be\b/gi).map((p) => p.trim().toLowerCase()).filter((p) => p.length > 1);
  if (!partes.length) return capitalizarFrase(t);
  const corpo = partes.join(', ');
  const jaProf = /^(responsavel|atuacao|atendimento|venda|gestao|organizacao|operacao|apoio|realizacao|controle|limpeza|conducao)/.test(chave(corpo));
  return capitalizarFrase((jaProf ? '' : 'Responsável por ') + corpo).replace(/\.*$/, '') + '.';
}

function capitalizarFrase(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ── 8) Intenção sim/não ───────────────────────────────────────────────────────
export function ehAfirmativa(texto: string): boolean {
  const t = chave(texto);
  return /^(sim|s+|claro|isso|trabalho|trabalhei|ja trabalhei|ja|com certeza|ok|tenho|tem|quero|pode|positivo|aham|uhum)\b/.test(t);
}
export function ehNegativa(texto: string): boolean {
  const t = chave(texto);
  return /^(nao|n|nunca|jamais|nenhum\w*|negativo|nada|sem|primeiro emprego|nao tenho)\b/.test(t);
}

// ── 9) E-mail ─────────────────────────────────────────────────────────────────
export function normalizarEmail(texto: string): Normalizado {
  const m = texto.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+(\.[a-zA-Z]{2,})?/);
  if (!m) return fechar(texto.trim(), texto, 0.3);
  let email = m[0].toLowerCase().replace(/\s+/g, '');
  const at = email.split('@');
  if (at.length === 2) {
    let dominio = at[1];
    if (!dominio.includes('.')) {
      // "@gmail" → sugere gmail.com
      if (['gmail', 'hotmail', 'outlook', 'yahoo'].includes(dominio)) dominio += '.com';
    }
    if (DOMINIOS[dominio]) dominio = DOMINIOS[dominio];
    else {
      // fuzzy contra domínios conhecidos
      const conhecidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'bol.com.br', 'uol.com.br'];
      for (const c of conhecidos) {
        if (dominio !== c && levenshtein(dominio, c) <= 2) { dominio = c; break; }
      }
    }
    email = `${at[0]}@${dominio}`;
  }
  const valido = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  return fechar(email, texto, valido ? 0.92 : 0.5);
}

// ── 10/12) Habilidades + bloqueio de texto ruim ───────────────────────────────
export function ehRespostaVazia(texto: string): boolean {
  const k = chave(texto);
  return NEGATIVAS_VAZIO.some((n) => k === n || k.startsWith(n));
}

export function contemFraseRuim(texto: string): boolean {
  const k = chave(texto);
  return FRASES_RUINS.some((f) => k.includes(f));
}

export function normalizarHabilidades(texto: string): { lista: string[]; usouPadrao: boolean } {
  if (ehRespostaVazia(texto) || contemFraseRuim(texto)) {
    return { lista: [...HABILIDADES_PADRAO.slice(0, 4)], usouPadrao: true };
  }
  const lista = texto
    .split(/[,;\n]|\be\b/gi)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 40 && !FRASES_RUINS.includes(chave(s)))
    .map((s) => normalizarTitulo(s).valor);
  if (!lista.length) return { lista: [...HABILIDADES_PADRAO.slice(0, 4)], usouPadrao: true };
  return { lista: [...new Set(lista)], usouPadrao: false };
}

export { HABILIDADES_PADRAO };

// ── Validações de sanidade (usuário pode digitar qualquer coisa) ──────────────
import type { CurriculoData } from '../../types';
import { capitalizarNome } from '../parsers';

export function validarNome(texto: string): { valido: boolean; valor: string } {
  const limpo = texto.replace(/^(meu nome (completo )?(e|é)|me chamo|sou)\s+/i, '').trim();
  const letras = limpo.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  // precisa de pelo menos 2 letras e não pode ser puro número
  if (letras.length < 2) return { valido: false, valor: '' };
  return { valido: true, valor: capitalizarNome(limpo) };
}

export function validarIdade(idade: number): boolean {
  return Number.isFinite(idade) && idade >= 14 && idade <= 80;
}

const ESTADO_CIVIL: Array<{ valor: string; sin: string[] }> = [
  { valor: 'Solteiro(a)', sin: ['solteiro', 'solteira', 'solteir'] },
  { valor: 'Casado(a)', sin: ['casado', 'casada', 'casad'] },
  { valor: 'Divorciado(a)', sin: ['divorciado', 'divorciada', 'separado', 'separada'] },
  { valor: 'Viúvo(a)', sin: ['viuvo', 'viuva'] },
  { valor: 'União Estável', sin: ['uniao estavel', 'amasiado', 'amigado', 'juntado', 'morando junto'] },
];

export function normalizarEstadoCivil(texto: string): Normalizado {
  const k = chave(texto);
  for (const { valor, sin } of ESTADO_CIVIL) {
    if (sin.some((s) => k.includes(s))) return fechar(valor, texto, 0.95);
  }
  // fuzzy
  const m = melhorOpcao(k, ESTADO_CIVIL.flatMap((e) => e.sin), 0.78);
  if (m) {
    const achou = ESTADO_CIVIL.find((e) => e.sin.includes(m.valor));
    if (achou) return fechar(achou.valor, texto, m.confianca);
  }
  return fechar(capitalize1(texto.trim()), texto, 0.5);
}

export function normalizarNacionalidade(texto: string): string {
  const k = chave(texto);
  if (!k || /^(brasil|brasileir|br)$/.test(k) || k.includes('brasil')) return 'Brasileira';
  return capitalize1(texto.trim());
}

function capitalize1(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Endereço por texto livre: "Rua das Flores, 123, Centro, 74000-000"
export function parseEndereco(texto: string): { endereco: string; numero: string; bairro: string; cep: string } {
  let resto = texto.trim();
  const cepM = resto.match(/\d{5}-?\d{3}/);
  const cep = cepM ? cepM[0].replace(/(\d{5})-?(\d{3})/, '$1-$2') : '';
  if (cepM) resto = resto.replace(cepM[0], '');
  const numM = resto.match(/(?:n[º°.ºo]?\s*)?\b(\d{1,6})\b/);
  const numero = numM ? numM[1] : '';
  const partes = resto.split(/[,;\-]/).map((p) => p.trim()).filter(Boolean);
  // heurística: 1ª parte = logradouro, última parte (sem número) = bairro
  let endereco = partes[0] ? tituloSimples(chave(partes[0]).replace(/\b\d{1,6}\b/g, '').trim()) : '';
  let bairro = '';
  if (partes.length >= 2) {
    const cand = partes[partes.length - 1].replace(/\d{5}-?\d{3}/, '').trim();
    if (cand && !/^\d+$/.test(cand)) bairro = tituloSimples(chave(cand));
  }
  endereco = endereco.replace(/\s+/g, ' ').trim();
  return { endereco, numero, bairro, cep };
}

// Gera um Perfil Profissional (resumo) a partir dos dados coletados
export function gerarPerfilProfissional(d: CurriculoData): string {
  const cargo = d.objetivo || (d.experiencias[0]?.cargo ?? '');
  const area = d.area;
  const qtdExp = d.experiencias.length;
  const escolaridade = d.formacoes[0]?.escolaridade || '';
  const skills = d.habilidades.slice(0, 3);

  if (!cargo && !qtdExp) return '';

  const partes: string[] = [];

  if (qtdExp > 0) {
    const tempoTxt = qtdExp === 1 ? 'experiência' : `experiência em ${qtdExp} empresas`;
    partes.push(`Profissional com ${tempoTxt}${cargo ? ` na função de ${cargo.toLowerCase()}` : ''}`);
  } else {
    partes.push(`Profissional em busca de oportunidade${cargo ? ` como ${cargo}` : ''}`);
  }

  if (area) partes[0] += `, com foco na área de ${area.toLowerCase()}`;
  partes[0] += '.';

  if (skills.length) {
    partes.push(`Tem como pontos fortes ${listaNatural(skills.map((s) => s.toLowerCase()))}.`);
  }
  if (escolaridade) partes.push(`Formação: ${escolaridade}.`);

  if (qtdExp === 0) {
    partes.push('Pessoa comprometida, com disposição para aprender e contribuir com a equipe.');
  }

  return partes.join(' ');
}

function listaNatural(itens: string[]): string {
  if (itens.length <= 1) return itens[0] || '';
  return itens.slice(0, -1).join(', ') + ' e ' + itens[itens.length - 1];
}
