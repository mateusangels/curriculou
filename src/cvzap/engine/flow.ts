// ── Fluxo conversacional da recrutadora virtual (máquina de estados) ─────────
//
// Cada passo (Step) sabe:
//  - `ask`: a(s) mensagem(ns) que a recrutadora envia ao ENTRAR no passo
//  - `handle`: como interpretar a resposta, normalizar, atualizar os dados e
//              decidir o próximo passo (com correção ortográfica e score de
//              confiança via camada de normalização)
//  - `skippable`/`filled`/`skipNext`: pular passos quando o dado já existe
//
// Quando uma resposta é corrigida com baixa confiança (<70%), o handler pode
// pedir confirmação ao usuário (campo `confirm`).

import type { CurriculoData, Experiencia, Formacao, Curso } from '../types';
import {
  normalizarTitulo, normalizarData, normalizarTelefone, normalizarLocal,
  normalizarEscolaridade, normalizarCurso, descreverExperiencia,
  normalizarEmail, normalizarHabilidades, detectarProfissao,
  ehAfirmativa, ehNegativa,
  validarNome, validarIdade, normalizarEstadoCivil, normalizarNacionalidade,
  parseEndereco, gerarPerfilProfissional,
} from './normalize';
import { capitalizarNome, primeiroNome, calcularIdade, gerarId } from './parsers';

export interface FlowCtx {
  data: CurriculoData;
  draftExp: Partial<Experiencia>;
  draftEdu: Partial<Formacao>;
  draftCurso: Partial<Curso>;
  contador: number;
}

export interface ConfirmReq {
  pergunta: string;
  reverter: (ctx: FlowCtx) => void; // aplicado se o usuário disser "não"
}

export interface HandleResult {
  next: string;
  ack?: string;
  confirm?: ConfirmReq;
}

export interface Step {
  id: string;
  ask: (ctx: FlowCtx) => string | string[];
  handle: (texto: string, ctx: FlowCtx) => HandleResult;
  skippable?: boolean;
  filled?: (data: CurriculoData) => boolean;
  skipNext?: string;
}

export const STEP_INICIAL = 'name';
export const STEP_FINAL = 'done';

// extração oportunista: preenche campos vazios a partir de qualquer mensagem
export function globalExtract(texto: string, data: CurriculoData) {
  if (!data.email && /@/.test(texto)) {
    const e = normalizarEmail(texto);
    if (e.confianca >= 0.7) data.email = e.valor;
  }
  if (!data.telefone) {
    const soDigitos = texto.replace(/\D/g, '');
    if (/(\d{2})?\d{10,11}/.test(soDigitos) && soDigitos.length >= 10 && soDigitos.length <= 13) {
      const t = normalizarTelefone(texto);
      if (t.confianca >= 0.85) data.telefone = t.valor;
    }
  }
  if (!data.idade) {
    const m = texto.toLowerCase().match(/(\d{1,2})\s*anos?/);
    if (m && +m[1] >= 14 && +m[1] <= 90) data.idade = m[1];
  }
}

const STEPS: Record<string, Step> = {
  // ── Dados pessoais ─────────────────────────────────────────────────────────
  name: {
    id: 'name',
    ask: () => [
      'Olá! 👋 Sou a Camila, sua recrutadora virtual aqui no Curriculou.',
      'Vou te ajudar a montar um currículo profissional em poucos minutos — é só responder como se estivesse conversando comigo, do seu jeito. 😊',
      'Pra começar: qual é o seu *nome completo*?',
    ],
    handle: (texto, ctx) => {
      const v = validarNome(texto);
      if (!v.valido) {
        return { next: 'name', ack: '🤔 Não consegui identificar seu nome. Pode escrever seu *nome completo* (ex: Maria da Silva)?' };
      }
      ctx.data.nome = v.valor;
      if (!ctx.data.nacionalidade) ctx.data.nacionalidade = 'Brasileira';
      return { next: 'birth', ack: `Prazer, ${primeiroNome(ctx.data.nome)}! 🙌` };
    },
  },

  birth: {
    id: 'birth', skippable: true, skipNext: 'civil',
    filled: (d) => !!(d.idade || d.dataNascimento),
    ask: () => 'Qual a sua *data de nascimento*? (ex: 15/08/1998) — ou só a idade, se preferir.',
    handle: (texto, ctx) => {
      // tentou informar idade direta
      const idadeDireta = texto.match(/\b(\d{1,3})\s*anos?\b/) || (/^\d{1,3}$/.test(texto.trim()) ? [null, texto.trim()] : null);
      if (idadeDireta) {
        const n = +idadeDireta[1];
        if (!validarIdade(n)) {
          return { next: 'birth', ack: '🤔 Essa idade não parece certa. Pode informar sua *data de nascimento* (ex: 15/08/1998)?' };
        }
        ctx.data.idade = String(n);
        return { next: 'civil' };
      }
      const d = normalizarData(texto);
      if (d.valor.length === 10) {
        const idade = calcularIdade(d.valor);
        if (idade && !validarIdade(+idade)) {
          return { next: 'birth', ack: '🤔 Confere essa data pra mim? A idade ficou fora do esperado. (ex: 15/08/1998)' };
        }
        ctx.data.dataNascimento = d.valor;
        if (idade) ctx.data.idade = idade;
        return { next: 'civil' };
      }
      return { next: 'birth', ack: '🤔 Não entendi a data. Pode escrever no formato dia/mês/ano (ex: 15/08/1998)?' };
    },
  },

  civil: {
    id: 'civil', skippable: true, skipNext: 'location',
    filled: (d) => !!d.estadoCivil,
    ask: () => 'Qual o seu *estado civil*? (solteiro(a), casado(a), divorciado(a)...)',
    handle: (texto, ctx) => {
      ctx.data.estadoCivil = normalizarEstadoCivil(texto).valor;
      if (!ctx.data.nacionalidade) ctx.data.nacionalidade = normalizarNacionalidade('');
      return { next: 'location' };
    },
  },

  location: {
    id: 'location', skippable: true, skipNext: 'endereco',
    filled: (d) => !!(d.cidade && d.estado),
    ask: () => 'Em qual *cidade e estado* você mora? (ex: Cristalina - GO)',
    handle: (texto, ctx) => {
      const r = normalizarLocal(texto);
      if (r.valor.cidade) ctx.data.cidade = r.valor.cidade;
      if (r.valor.estado) ctx.data.estado = r.valor.estado;
      return { next: 'endereco' };
    },
  },

  endereco: {
    id: 'endereco', skippable: true, skipNext: 'phone',
    filled: (d) => !!d.endereco,
    ask: () => 'Qual o seu *endereço*? (rua, número e bairro — ex: Rua das Flores, 123, Centro). Se preferir não informar, digite "pular".',
    handle: (texto, ctx) => {
      if (ehNegativa(texto) || /pular|prefiro nao|nao quero/i.test(texto)) return { next: 'phone' };
      const e = parseEndereco(texto);
      if (e.endereco) ctx.data.endereco = e.endereco;
      if (e.numero) ctx.data.numero = e.numero;
      if (e.bairro) ctx.data.bairro = e.bairro;
      if (e.cep) ctx.data.cep = e.cep;
      return { next: 'phone' };
    },
  },

  phone: {
    id: 'phone', skippable: true, skipNext: 'email',
    filled: (d) => !!d.telefone,
    ask: () => 'Qual o seu *telefone* com DDD? (ex: (61) 99822-1210)',
    handle: (texto, ctx) => {
      const r = normalizarTelefone(texto);
      if (r.confianca < 0.7) {
        return { next: 'phone', ack: '🤔 Esse número ficou incompleto. Pode mandar com DDD, por favor? (ex: (61) 99822-1210)' };
      }
      ctx.data.telefone = r.valor;
      return { next: 'email' };
    },
  },

  email: {
    id: 'email', skippable: true, skipNext: 'objective_role',
    filled: (d) => !!d.email,
    ask: () => 'E o seu melhor *e-mail*?',
    handle: (texto, ctx) => {
      const r = normalizarEmail(texto);
      const original = texto.trim();
      ctx.data.email = r.valor;
      if (r.valor !== original.toLowerCase().replace(/\s+/g, '') && r.confianca >= 0.7) {
        return {
          next: 'objective_role',
          confirm: {
            pergunta: `Acho que o e-mail correto é *${r.valor}*. Está certo? (sim / não)`,
            reverter: (c) => { c.data.email = original; },
          },
        };
      }
      return { next: 'objective_role' };
    },
  },

  // ── Objetivo profissional ───────────────────────────────────────────────────
  objective_role: {
    id: 'objective_role',
    ask: () => ['Agora vamos ao seu objetivo. 🎯', 'Qual *cargo* ou vaga você está buscando?'],
    handle: (texto, ctx) => {
      const r = normalizarTitulo(texto);
      ctx.data.objetivo = r.valor;
      if (r.precisaConfirmar && r.valor) {
        return {
          next: 'objective_area',
          confirm: {
            pergunta: `Entendi *${r.valor}* como o cargo. Está correto? (sim / não)`,
            reverter: (c) => { c.data.objetivo = texto.trim(); },
          },
        };
      }
      return { next: 'objective_area' };
    },
  },

  objective_area: {
    id: 'objective_area',
    ask: () => 'E em qual *área* você quer atuar? (ex: Comercial, Administrativo, Saúde...)',
    handle: (texto, ctx) => {
      ctx.data.area = normalizarTitulo(texto).valor;
      ctx.data.perfilProfissional = gerarPerfilProfissional(ctx.data);
      return { next: 'exp_intro' };
    },
  },

  // ── Experiência profissional (loop) ─────────────────────────────────────────
  exp_intro: {
    id: 'exp_intro',
    ask: () => 'Vamos falar das suas experiências. Você já *trabalhou* em alguma empresa antes? (sim / não)',
    handle: (texto, ctx) => {
      if (ehNegativa(texto)) return { next: 'edu_intro', ack: 'Sem problema! Todo mundo começa em algum momento. 😉' };
      ctx.draftExp = {};
      return { next: 'exp_company', ack: 'Legal! Vamos registrar essa experiência.' };
    },
  },

  exp_company: {
    id: 'exp_company',
    ask: () => 'Qual o *nome da empresa*?',
    handle: (texto, ctx) => {
      ctx.draftExp.empresa = capitalizarNome(texto.replace(/^(na|no|empresa|trabalhei na|trabalho na)\s+/i, '').trim());
      return { next: 'exp_role' };
    },
  },

  exp_role: {
    id: 'exp_role',
    ask: (ctx) => `Qual *cargo* você ocupava${ctx.draftExp.empresa ? ` na ${ctx.draftExp.empresa}` : ''}?`,
    handle: (texto, ctx) => {
      const prof = detectarProfissao(texto);
      const r = normalizarTitulo(texto);
      ctx.draftExp.cargo = prof ? prof.profissao : r.valor;
      return { next: 'exp_start' };
    },
  },

  exp_start: {
    id: 'exp_start',
    ask: () => 'Quando você *começou*? (mês/ano — ex: 03/2021)',
    handle: (texto, ctx) => {
      ctx.draftExp.inicio = normalizarData(texto).valor;
      return { next: 'exp_current' };
    },
  },

  exp_current: {
    id: 'exp_current',
    ask: () => 'Você ainda *trabalha lá* atualmente? (sim / não)',
    handle: (texto, ctx) => {
      if (ehAfirmativa(texto) && !ehNegativa(texto)) {
        ctx.draftExp.atual = true; ctx.draftExp.fim = '';
        return { next: 'exp_activities' };
      }
      ctx.draftExp.atual = false;
      return { next: 'exp_end' };
    },
  },

  exp_end: {
    id: 'exp_end',
    ask: () => 'Quando você *saiu*? (mês/ano)',
    handle: (texto, ctx) => {
      ctx.draftExp.fim = normalizarData(texto).valor;
      return { next: 'exp_activities' };
    },
  },

  exp_activities: {
    id: 'exp_activities',
    ask: () => 'O que você *fazia* nesse trabalho? Pode contar com as suas palavras que eu deixo bonito pro currículo. ✍️',
    handle: (texto, ctx) => {
      ctx.draftExp.atividades = descreverExperiencia(texto, ctx.draftExp.cargo);
      ctx.contador += 1;
      ctx.data.experiencias.push({
        id: gerarId('exp', ctx.contador),
        empresa: ctx.draftExp.empresa || '',
        cargo: ctx.draftExp.cargo || '',
        inicio: ctx.draftExp.inicio || '',
        fim: ctx.draftExp.fim || '',
        atual: !!ctx.draftExp.atual,
        atividades: ctx.draftExp.atividades || '',
      });
      ctx.draftExp = {};
      const ultima = ctx.data.experiencias[ctx.data.experiencias.length - 1];
      return { next: 'exp_more', ack: `Deixei mais profissional assim: \n_${ultima.atividades}_` };
    },
  },

  exp_more: {
    id: 'exp_more',
    ask: () => 'Quer adicionar *outra experiência*? (sim / não)',
    handle: (texto, ctx) => {
      if (ehAfirmativa(texto) && !ehNegativa(texto)) { ctx.draftExp = {}; return { next: 'exp_company' }; }
      return { next: 'edu_intro' };
    },
  },

  // ── Formação acadêmica (loop) ────────────────────────────────────────────────
  edu_intro: {
    id: 'edu_intro',
    ask: () => ['Agora a sua formação. 🎓', 'Qual a sua *escolaridade*? (ex: Ensino Médio Completo, Superior em andamento...)'],
    handle: (texto, ctx) => {
      const r = normalizarEscolaridade(texto);
      ctx.draftEdu = { escolaridade: r.valor };
      if (r.precisaConfirmar && r.valor) {
        return {
          next: 'edu_course',
          confirm: {
            pergunta: `Você quis dizer *${r.valor}*? (sim / não)`,
            reverter: (c) => { c.draftEdu.escolaridade = normalizarTitulo(texto).valor; },
          },
        };
      }
      return { next: 'edu_course' };
    },
  },

  edu_course: {
    id: 'edu_course',
    ask: () => 'Qual o *nome do curso* ou área de estudo? (se não tiver, digite "-")',
    handle: (texto, ctx) => {
      const t = texto.trim();
      ctx.draftEdu.curso = t === '-' ? '' : normalizarTitulo(t).valor;
      return { next: 'edu_inst' };
    },
  },

  edu_inst: {
    id: 'edu_inst',
    ask: () => 'Em qual *instituição* você estudou? (se preferir, digite "-")',
    handle: (texto, ctx) => {
      const t = texto.trim();
      ctx.draftEdu.instituicao = t === '-' ? '' : capitalizarNome(t);
      return { next: 'edu_year' };
    },
  },

  edu_year: {
    id: 'edu_year',
    ask: () => 'Em que *ano* você concluiu (ou tem previsão de concluir)?',
    handle: (texto, ctx) => {
      ctx.draftEdu.anoConclusao = (texto.match(/\d{4}/) || [texto.trim()])[0];
      ctx.contador += 1;
      ctx.data.formacoes.push({
        id: gerarId('edu', ctx.contador),
        escolaridade: ctx.draftEdu.escolaridade || '',
        curso: ctx.draftEdu.curso || '',
        instituicao: ctx.draftEdu.instituicao || '',
        anoConclusao: ctx.draftEdu.anoConclusao || '',
      });
      ctx.draftEdu = {};
      return { next: 'edu_more', ack: 'Formação registrada! ✅' };
    },
  },

  edu_more: {
    id: 'edu_more',
    ask: () => 'Quer adicionar *outra formação*? (sim / não)',
    handle: (texto, ctx) => {
      if (ehAfirmativa(texto) && !ehNegativa(texto)) { ctx.draftEdu = {}; return { next: 'edu_intro' }; }
      return { next: 'course_intro' };
    },
  },

  // ── Cursos complementares (loop) ──────────────────────────────────────────────
  course_intro: {
    id: 'course_intro',
    ask: () => 'Você fez algum *curso complementar*? (ex: Excel, Inglês, curso técnico) — sim / não',
    handle: (texto, ctx) => {
      if (ehNegativa(texto)) return { next: 'skills' };
      ctx.draftCurso = {};
      return { next: 'course_name' };
    },
  },

  course_name: {
    id: 'course_name',
    ask: () => 'Qual o *nome do curso*?',
    handle: (texto, ctx) => {
      ctx.draftCurso.nome = normalizarCurso(texto).valor;
      return { next: 'course_inst' };
    },
  },

  course_inst: {
    id: 'course_inst',
    ask: () => 'Em qual *instituição*? (digite "-" se não lembrar)',
    handle: (texto, ctx) => {
      const t = texto.trim();
      ctx.draftCurso.instituicao = t === '-' ? '' : capitalizarNome(t);
      return { next: 'course_hours' };
    },
  },

  course_hours: {
    id: 'course_hours',
    ask: () => 'Qual a *carga horária*? (opcional — digite "-" para pular)',
    handle: (texto, ctx) => {
      const t = texto.trim();
      ctx.draftCurso.cargaHoraria = t === '-' ? '' : t.replace(/[^\d]/g, '') ? `${t.replace(/[^\d]/g, '')}h` : t;
      ctx.contador += 1;
      ctx.data.cursos.push({
        id: gerarId('curso', ctx.contador),
        nome: ctx.draftCurso.nome || '',
        instituicao: ctx.draftCurso.instituicao || '',
        cargaHoraria: ctx.draftCurso.cargaHoraria || '',
      });
      ctx.draftCurso = {};
      return { next: 'course_more', ack: 'Curso adicionado! ✅' };
    },
  },

  course_more: {
    id: 'course_more',
    ask: () => 'Quer adicionar *outro curso*? (sim / não)',
    handle: (texto, ctx) => {
      if (ehAfirmativa(texto) && !ehNegativa(texto)) { ctx.draftCurso = {}; return { next: 'course_name' }; }
      return { next: 'skills' };
    },
  },

  // ── Habilidades ───────────────────────────────────────────────────────────────
  skills: {
    id: 'skills',
    ask: () => 'Estamos quase lá! 💪 Quais são as suas *principais habilidades*? Pode listar separando por vírgula — se não souber o que colocar, é só dizer e eu sugiro. 😉',
    handle: (texto, ctx) => {
      const { lista, usouPadrao } = normalizarHabilidades(texto);
      const set = new Set(ctx.data.habilidades);
      lista.forEach((h) => set.add(h));
      ctx.data.habilidades = [...set];
      // regenera o perfil profissional agora que temos experiências e habilidades
      ctx.data.perfilProfissional = gerarPerfilProfissional(ctx.data);
      const ack = usouPadrao
        ? 'Sem problema! Coloquei algumas habilidades que todo empregador valoriza. 👍'
        : undefined;
      return { next: 'done', ack };
    },
  },

  // ── Final ──────────────────────────────────────────────────────────────────────
  done: {
    id: 'done',
    ask: (ctx) => [
      `Prontinho, ${primeiroNome(ctx.data.nome) || 'tudo certo'}! 🎉`,
      'Seu currículo está montado. Escolha um *modelo* ao lado, confira a prévia e clique em *Baixar PDF*.',
      'Se quiser ajustar algo, é só me dizer. 😉',
    ],
    handle: (texto, ctx) => {
      globalExtract(texto, ctx.data);
      return { next: 'done', ack: 'Anotado! Atualizei a prévia do seu currículo. ✅' };
    },
  },
};

export function getStep(id: string): Step {
  return STEPS[id] || STEPS[STEP_FINAL];
}

/** Avança pulando passos já preenchidos (campos pessoais opcionais). */
export function resolverProximo(id: string, data: CurriculoData): string {
  let atual = id;
  let guarda = 0;
  while (guarda++ < 20) {
    const step = STEPS[atual];
    if (step?.skippable && step.skipNext && step.filled?.(data)) atual = step.skipNext;
    else break;
  }
  return atual;
}
