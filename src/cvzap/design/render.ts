// ── Geração do HTML do currículo (PDF e thumbnails) a partir do design ───────
import type { CurriculoData } from '../types';
import type { DesignConfig, SectionsConfig } from './types';
import { buildCSS, resolveDesign } from './style';
import { esc, periodo, enderecoCompleto, cidadeUF, ICON } from '../templates/shared';

export interface RenderOpts { foto?: string }

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || 'CV';
}

function bars(n: number): string {
  let s = '<span class="cv-lvl">';
  for (let i = 0; i < 5; i++) s += `<i class="${i < n ? 'on' : ''}"></i>`;
  return s + '</span>';
}

function fotoHTML(d: CurriculoData, opts?: RenderOpts): string {
  if (opts?.foto) return `<div class="cv-photo" style="background-image:url('${esc(opts.foto)}')"></div>`;
  return `<div class="cv-photo cv-photo-ph">${esc(iniciais(d.nome))}</div>`;
}

function contatoHTML(d: CurriculoData, icons: boolean): string {
  const rows: string[] = [];
  const add = (icon: string, v: string) => v && rows.push(`<div class="cv-contact-row">${icons ? icon : ''}<span>${esc(v)}</span></div>`);
  add(ICON.mail, d.email);
  add(ICON.phone, d.telefone);
  add(ICON.pin, cidadeUF(d));
  if (d.linkedin) add(ICON.user, d.linkedin);
  return rows.join('');
}

function dadosHTML(d: CurriculoData): string {
  const rows: string[] = [];
  if (d.dataNascimento) rows.push(`<div class="cv-info"><b>Nascimento:</b> ${esc(d.dataNascimento)}${d.idade ? ` (${esc(d.idade)})` : ''}</div>`);
  else if (d.idade) rows.push(`<div class="cv-info"><b>Idade:</b> ${esc(d.idade)} anos</div>`);
  if (d.estadoCivil) rows.push(`<div class="cv-info"><b>Estado civil:</b> ${esc(d.estadoCivil)}</div>`);
  if (d.nacionalidade) rows.push(`<div class="cv-info"><b>Nacionalidade:</b> ${esc(d.nacionalidade)}</div>`);
  const end = enderecoCompleto(d);
  if (end) rows.push(`<div class="cv-info"><b>Endereço:</b> ${esc(end)}</div>`);
  return rows.join('');
}

function qualificacoesHTML(d: CurriculoData): string {
  return d.qualificacoes ? `<div class="cv-desc" style="padding-left:0">${esc(d.qualificacoes)}</div>` : '';
}

function habilidadesHTML(d: CurriculoData, comoBarras: boolean): string {
  if (!d.habilidades.length) return '';
  if (comoBarras) return d.habilidades.map((h, i) => `<div class="cv-skill"><span>${esc(h)}</span>${bars(i < 2 ? 5 : 4)}</div>`).join('');
  return `<div class="cv-chips">${d.habilidades.map((h) => `<span class="cv-chip">${esc(h)}</span>`).join('')}</div>`;
}

function idiomasHTML(d: CurriculoData, comoBarras: boolean): string {
  if (!d.idiomas.length) return '';
  if (comoBarras) return d.idiomas.map((x) => `<div class="cv-mini-item"><b>${esc(x)}</b></div>`).join('');
  return `<div class="cv-chips">${d.idiomas.map((x) => `<span class="cv-chip">${esc(x)}</span>`).join('')}</div>`;
}

function cursosHTML(d: CurriculoData): string {
  if (!d.cursos.length) return '';
  return d.cursos.map((c) =>
    `<div class="cv-mini-item"><b>${esc(c.nome)}</b>${(c.instituicao || c.cargaHoraria) ? `<span>${esc([c.instituicao, c.cargaHoraria].filter(Boolean).join(' • '))}</span>` : ''}</div>`
  ).join('');
}

function expHTML(d: CurriculoData): string {
  return d.experiencias.map((e) => `
    <div class="cv-item">
      <div class="cv-top">
        <div><span class="cv-role">${esc(e.cargo)}</span> <span class="cv-org">${esc(e.empresa)}</span></div>
        ${periodo(e.inicio, e.fim, e.atual) ? `<span class="cv-per">${esc(periodo(e.inicio, e.fim, e.atual))}</span>` : ''}
      </div>
      ${e.atividades ? `<div class="cv-desc">${esc(e.atividades)}</div>` : ''}
    </div>`).join('');
}

function eduHTML(d: CurriculoData): string {
  return d.formacoes.map((f) => `
    <div class="cv-item">
      <div class="cv-top">
        <div><span class="cv-role">${esc([f.escolaridade, f.curso].filter(Boolean).join(' — '))}</span> <span class="cv-org">${esc(f.instituicao)}</span></div>
        ${f.anoConclusao ? `<span class="cv-per">${esc(f.anoConclusao)}</span>` : ''}
      </div>
    </div>`).join('');
}

const SVG_DEFS = `svg{fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}`;

export function renderBody(d: CurriculoData, design: DesignConfig, sec: SectionsConfig, opts?: RenderOpts): string {
  const dual = design.layout === 'dual';
  const r = resolveDesign(design);
  const S = (cond: boolean, html: string) => (cond && html ? html : '');

  const h3 = (t: string, c: string) => (c ? `<h3>${t}</h3>${c}` : '');
  const h2 = (t: string, c: string) => (c ? `<h2>${t}</h2>${c}` : '');

  const nomeCargo = `
    <div class="cv-name">${esc(d.nome) || 'Nome Sobrenome'}</div>
    ${S(sec.cargo, `<div class="cv-cargo">${esc(d.objetivo) || 'Seu cargo'}</div>`)}`;

  const perfil = h2('Perfil', d.perfilProfissional ? `<div class="cv-desc" style="padding-left:0">${esc(d.perfilProfissional)}</div>` : '');
  const experiencia = h2('Experiência Profissional', expHTML(d));
  const educacao = h2('Educação', eduHTML(d));
  const qualif = h2('Qualificações e Informações Adicionais', qualificacoesHTML(d));

  if (dual) {
    const side = [
      S(sec.foto, fotoHTML(d, opts)),
      S(sec.contato, h3('Contato', contatoHTML(d, r.contactIcons))),
      S(sec.dadosPessoais, h3('Dados Pessoais', dadosHTML(d))),
      S(sec.habilidades, h3('Habilidades', habilidadesHTML(d, true))),
      S(sec.idiomas, h3('Idiomas', idiomasHTML(d, true))),
      S(sec.cursos, h3('Cursos e Certificações', cursosHTML(d))),
    ].join('');
    const main = [
      nomeCargo,
      S(sec.perfil, perfil),
      S(sec.experiencia, experiencia),
      S(sec.educacao, educacao),
      S(sec.qualificacoes, qualif),
    ].join('');
    return `<div class="cv-root"><aside class="cv-side">${side}</aside><main class="cv-main">${main}</main></div>`;
  }

  // layout single
  const contatoLinha = sec.contato ? `<div class="cv-single-contact">${contatoHTML(d, r.contactIcons)}</div>` : '';
  const main = [
    nomeCargo,
    contatoLinha,
    S(sec.perfil, perfil),
    S(sec.experiencia, experiencia),
    S(sec.educacao, educacao),
    S(sec.habilidades, h2('Habilidades', habilidadesHTML(d, false))),
    S(sec.idiomas, h2('Idiomas', idiomasHTML(d, false))),
    S(sec.cursos, h2('Cursos e Certificações', cursosHTML(d))),
    S(sec.qualificacoes, qualif),
    S(sec.dadosPessoais, h2('Dados Pessoais', dadosHTML(d))),
  ].join('');
  return `<div class="cv-root"><main class="cv-main">${main}</main></div>`;
}

export function documentoHTML(d: CurriculoData, design: DesignConfig, sec: SectionsConfig, opts?: RenderOpts): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lora:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>@page{size:A4;margin:0}*{margin:0;padding:0;box-sizing:border-box}html,body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}${SVG_DEFS}${buildCSS(design)}</style>
</head><body>${renderBody(d, design, sec, opts)}</body></html>`;
}
