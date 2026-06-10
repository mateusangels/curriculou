// ── Melhoria de texto: transforma respostas simples em descrições profissionais

const SUBSTITUICOES: Array<[RegExp, string]> = [
  [/\beu\s+/gi, ''],
  [/\bfazia\b/gi, 'realização de'],
  [/\bfaço\b/gi, 'realização de'],
  [/\batendia\b/gi, 'atendimento a'],
  [/\batendo\b/gi, 'atendimento a'],
  [/\bvendia\b/gi, 'vendas de'],
  [/\bvendo\b/gi, 'vendas de'],
  [/\bajudava\b/gi, 'apoio a'],
  [/\bajudo\b/gi, 'apoio a'],
  [/\borganizava\b/gi, 'organização de'],
  [/\borganizo\b/gi, 'organização de'],
  [/\bcuidava\b/gi, 'gestão de'],
  [/\bcuido\b/gi, 'gestão de'],
  [/\bmexia\b/gi, 'operação de'],
  [/\bmexo\b/gi, 'operação de'],
  [/\btrabalhava com\b/gi, 'atuação com'],
  [/\btrabalho com\b/gi, 'atuação com'],
  [/\bresponsavel por\b/gi, 'responsável por'],
];

const CONECTORES_INICIO = [
  'Responsável por',
  'Atuação com',
  'Atividades voltadas a',
  'Encarregado(a) de',
];

function capitalizar(s: string): string {
  s = s.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Recebe a descrição informal de atividades e devolve uma versão mais
 * profissional, pronta para currículo. Mantém o conteúdo do usuário,
 * apenas reescreve o tom.
 */
export function profissionalizarAtividades(texto: string): string {
  const original = texto.trim();
  if (!original) return '';

  // quebra em itens por vírgula / "e" / ponto-e-vírgula / quebra de linha
  const partes = original
    .split(/[,;\n]|\be\b/gi)
    .map((p) => p.trim())
    .filter((p) => p.length > 1);

  if (partes.length === 0) return capitalizar(original) + '.';

  const itens = partes.map((parte) => {
    let p = parte.toLowerCase();
    for (const [re, rep] of SUBSTITUICOES) p = p.replace(re, rep);
    p = p.replace(/\s+/g, ' ').trim();
    return p;
  });

  // se for um único bloco curto, devolve uma frase única
  if (itens.length === 1) {
    const t = itens[0];
    const prefixo = /^(responsável|atuação|atividades|atendimento|vendas|gestão|organização|operação|apoio|realização)/.test(t)
      ? ''
      : 'Responsável por ';
    return capitalizar(prefixo + t).replace(/\.*$/, '') + '.';
  }

  // múltiplos itens → frase corrida com conector profissional
  const conector = CONECTORES_INICIO[0];
  const corpo = itens.join(', ');
  return `${conector} ${corpo}.`.replace(/\s+/g, ' ');
}

/** Corrige capitalização e pontuação de uma frase curta (objetivo etc.) */
export function polirFrase(texto: string): string {
  const t = texto.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return capitalizar(t);
}
