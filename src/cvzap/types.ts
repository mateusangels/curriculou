// ── Curriculou — modelo de dados do currículo e do chat ──────────────────────────

export interface Experiencia {
  id: string;
  empresa: string;
  cargo: string;
  inicio: string;
  fim: string; // vazio quando atual === true
  atual: boolean;
  atividades: string;
}

export interface Formacao {
  id: string;
  escolaridade: string;
  curso: string;
  instituicao: string;
  anoConclusao: string;
}

export interface Curso {
  id: string;
  nome: string;
  instituicao: string;
  cargaHoraria: string;
}

export interface CurriculoData {
  // dados pessoais
  nome: string;
  dataNascimento: string;
  idade: string;
  estadoCivil: string;
  nacionalidade: string;
  telefone: string;
  email: string;
  // endereço
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  linkedin: string;
  // profissional
  perfilProfissional: string; // resumo/perfil (parágrafo)
  objetivo: string; // cargo desejado
  area: string; // área de interesse
  experiencias: Experiencia[];
  formacoes: Formacao[];
  outrasInfoEscolaridade: string;
  cursos: Curso[];
  habilidades: string[];
  idiomas: string[];
  qualificacoes: string; // qualificações e informações adicionais
}

export function curriculoVazio(): CurriculoData {
  return {
    nome: '',
    dataNascimento: '',
    idade: '',
    estadoCivil: '',
    nacionalidade: 'Brasileira',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    linkedin: '',
    perfilProfissional: '',
    objetivo: '',
    area: '',
    experiencias: [],
    formacoes: [],
    outrasInfoEscolaridade: '',
    cursos: [],
    habilidades: [],
    idiomas: [],
    qualificacoes: '',
  };
}

// ── Chat ────────────────────────────────────────────────────────────────────

export type MessageRole = 'bot' | 'user';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  time: string; // HH:MM
  audio?: boolean; // mensagem enviada por voz
}

// ── Progresso por seção ──────────────────────────────────────────────────────

export interface SecaoProgresso {
  label: string;
  pct: number;
}
