// ── Parsers / extratores de informação a partir de texto livre ───────────────

const UFS: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA',
  ceara: 'CE', 'distrito federal': 'DF', 'espirito santo': 'ES', goias: 'GO',
  maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', para: 'PA', paraiba: 'PB', parana: 'PR',
  pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO',
  roraima: 'RR', 'santa catarina': 'SC', 'sao paulo': 'SP', sergipe: 'SE',
  tocantins: 'TO',
};

const SIGLAS = new Set(Object.values(UFS));

function semAcento(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function ehNegativa(texto: string): boolean {
  const t = semAcento(texto.trim().toLowerCase());
  return /^(nao|n|nope|negativo|nenhuma?|nunca|jamais|sem experiencia|primeiro emprego|nada|so isso|sem mais)\b/.test(t);
}

export function ehAfirmativa(texto: string): boolean {
  const t = semAcento(texto.trim().toLowerCase());
  return /^(sim|s|claro|com certeza|ok|isso|tenho|trabalhei|trabalho|tem|outra|mais|adicionar|quero|pode)\b/.test(t);
}

export function extrairEmail(texto: string): string | null {
  const m = texto.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : null;
}

export function ehEmailValido(texto: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(texto.trim());
}

export function extrairTelefone(texto: string): string | null {
  // pega blocos de dígitos (com possíveis separadores) e procura 10/11 dígitos
  const limpo = texto.replace(/[^\d]/g, ' ');
  const candidatos = limpo.split(/\s+/).join('');
  const m = texto.match(/(\+?55\s*)?\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);
  if (m) return formatarTelefone(m[0]);
  // fallback: sequência única de 10-11 dígitos
  if (/^\d{10,11}$/.test(candidatos)) return formatarTelefone(candidatos);
  return null;
}

export function formatarTelefone(bruto: string): string {
  let d = bruto.replace(/\D/g, '');
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return bruto.trim();
}

export function extrairIdade(texto: string): string | null {
  const m = semAcento(texto.toLowerCase()).match(/(\d{1,2})\s*anos?/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 14 && n <= 90) return String(n);
  }
  return null;
}

export function extrairDataNascimento(texto: string): string | null {
  const m = texto.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (m) {
    const dia = m[1].padStart(2, '0');
    const mes = m[2].padStart(2, '0');
    let ano = m[3];
    if (ano.length === 2) ano = (parseInt(ano, 10) > 30 ? '19' : '20') + ano;
    return `${dia}/${mes}/${ano}`;
  }
  return null;
}

export function calcularIdade(dataNasc: string): string | null {
  const m = dataNasc.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const nasc = new Date(+m[3], +m[2] - 1, +m[1]);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mDiff = hoje.getMonth() - nasc.getMonth();
  if (mDiff < 0 || (mDiff === 0 && hoje.getDate() < nasc.getDate())) idade--;
  if (idade < 14 || idade > 90) return null;
  return String(idade);
}

export function extrairEstado(texto: string): string | null {
  const t = semAcento(texto.toLowerCase());
  // sigla isolada (ex: "SP", "- SP", "/RJ")
  const sig = texto.toUpperCase().match(/\b([A-Z]{2})\b/);
  if (sig && SIGLAS.has(sig[1])) return sig[1];
  // nome do estado por extenso
  for (const [nome, uf] of Object.entries(UFS)) {
    if (t.includes(nome)) return uf;
  }
  return null;
}

export function extrairCidadeEstado(texto: string): { cidade: string; estado: string } {
  const estado = extrairEstado(texto) || '';
  // remove a parte do estado/sigla pra sobrar a cidade
  let cidade = texto
    .replace(/\b[A-Z]{2}\b/g, ' ')
    .replace(/[,\-\/|]+/g, ' ')
    .replace(/\b(moro|em|na|no|cidade de|estado de|interior de|sou de|de)\b/gi, ' ')
    .trim();
  // se houver "cidade - estadoNome" remove o nome do estado por extenso
  for (const nome of Object.keys(UFS)) {
    const re = new RegExp(nome.replace(/ /g, '\\s+'), 'i');
    cidade = cidade.replace(re, ' ');
  }
  cidade = cidade.replace(/\s+/g, ' ').trim();
  cidade = capitalizarNome(cidade);
  return { cidade, estado };
}

export function capitalizarNome(texto: string): string {
  const minusculas = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  return texto
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => (minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

export function primeiroNome(nomeCompleto: string): string {
  return nomeCompleto.trim().split(/\s+/)[0] || '';
}

// limpa frases de cortesia que o usuário costuma escrever junto à resposta
export function limparResposta(texto: string): string {
  return texto
    .replace(/^(meu nome (completo )?(e|é)|me chamo|sou o?a?|eu sou|chamo[- ]?me)\s+/i, '')
    .replace(/^(é|e|sou|moro em|trabalho na|trabalhei na|na|no)\s+/i, '')
    .trim();
}

export function listaHabilidades(texto: string): string[] {
  return texto
    .split(/[,;\n]|\be\b/gi)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 40)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export function gerarId(prefixo: string, n: number): string {
  return `${prefixo}-${n}-${Math.abs(Math.sin(n) * 1e6) | 0}`;
}
