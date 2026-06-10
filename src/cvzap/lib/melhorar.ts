// ── "Melhorar com IA" (versão local): repassa a normalização por todo o CV ───
import type { CurriculoData } from '../types';
import {
  normalizarTitulo, normalizarEscolaridade, normalizarCurso,
  descreverExperiencia, detectarProfissao, gerarPerfilProfissional,
} from '../engine/normalize';

export function melhorarCurriculo(d: CurriculoData): CurriculoData {
  const out: CurriculoData = {
    ...d,
    objetivo: d.objetivo ? normalizarTitulo(d.objetivo).valor : d.objetivo,
    area: d.area ? normalizarTitulo(d.area).valor : d.area,
    experiencias: d.experiencias.map((e) => {
      const prof = detectarProfissao(`${e.cargo} ${e.atividades}`);
      return {
        ...e,
        cargo: e.cargo ? (prof ? prof.profissao : normalizarTitulo(e.cargo).valor) : e.cargo,
        atividades: e.atividades ? descreverExperiencia(e.atividades, e.cargo) : e.atividades,
      };
    }),
    formacoes: d.formacoes.map((f) => ({
      ...f,
      escolaridade: f.escolaridade ? normalizarEscolaridade(f.escolaridade).valor : f.escolaridade,
      curso: f.curso ? normalizarTitulo(f.curso).valor : f.curso,
    })),
    cursos: d.cursos.map((c) => ({ ...c, nome: c.nome ? normalizarCurso(c.nome).valor : c.nome })),
    habilidades: d.habilidades.map((h) => (h ? normalizarTitulo(h).valor : h)).filter(Boolean),
  };
  out.perfilProfissional = gerarPerfilProfissional(out) || d.perfilProfissional;
  return out;
}
