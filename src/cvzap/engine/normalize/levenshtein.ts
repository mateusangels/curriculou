// ── Distância de Levenshtein + utilidades de comparação fuzzy ────────────────

export function semAcento(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function chave(s: string): string {
  return semAcento(s.toLowerCase().trim()).replace(/\s+/g, ' ');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + custo);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

/** semelhança 0..1 entre duas strings (1 = idêntico) */
export function similaridade(a: string, b: string): number {
  const ka = chave(a);
  const kb = chave(b);
  const max = Math.max(ka.length, kb.length) || 1;
  return 1 - levenshtein(ka, kb) / max;
}

/**
 * Procura a melhor opção canônica para um termo, tolerando erros de digitação.
 * Retorna a opção e a confiança (0..1), ou null se nada chegar ao limiar.
 */
export function melhorOpcao(
  termo: string,
  opcoes: string[],
  limiar = 0.72
): { valor: string; confianca: number } | null {
  const k = chave(termo);
  let melhor: { valor: string; confianca: number } | null = null;
  for (const op of opcoes) {
    const sim = similaridade(k, op);
    if (sim >= limiar && (!melhor || sim > melhor.confianca)) {
      melhor = { valor: op, confianca: sim };
    }
  }
  return melhor;
}
