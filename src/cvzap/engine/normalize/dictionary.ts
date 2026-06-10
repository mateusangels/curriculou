// ── Base de conhecimento da normalização inteligente ─────────────────────────
// Chaves sempre em minúsculo e SEM acento (use `chave()` ao consultar).

// 1) Correções ortográficas diretas (palavra → palavra correta, já acentuada)
export const CORRECOES: Record<string, string> = {
  // serviços gerais
  servisos: 'Serviços', serivoces: 'Serviços', serivocos: 'Serviços',
  servicos: 'Serviços', servico: 'Serviço', servisso: 'Serviço',
  gerias: 'Gerais', geral: 'Geral', gerais: 'Gerais',
  // administrativo
  adminsitrativo: 'Administrativo', administrativo: 'Administrativo',
  adiministrativo: 'Administrativo', administrativa: 'Administrativa',
  administracao: 'Administração',
  // atendimento
  atendimeto: 'Atendimento', atendimento: 'Atendimento', atendiemnto: 'Atendimento',
  atendente: 'Atendente', atendnte: 'Atendente',
  // recepção
  recepsionista: 'Recepcionista', recepcionista: 'Recepcionista', recepcao: 'Recepção',
  // auxiliar
  auxliar: 'Auxiliar', auxiliar: 'Auxiliar', alxiliar: 'Auxiliar', auxilair: 'Auxiliar',
  ajudante: 'Ajudante',
  // balconista
  balconissta: 'Balconista', balconista: 'Balconista', balconita: 'Balconista',
  // vendedor
  vendedro: 'Vendedor', vendedor: 'Vendedor', vendas: 'Vendas', vendendor: 'Vendedor',
  // motorista
  motorsta: 'Motorista', motorista: 'Motorista', motrista: 'Motorista',
  // almoxarife
  almoxarifee: 'Almoxarife', almoxarife: 'Almoxarife', almoxarifado: 'Almoxarifado',
  // estoque
  estoqueo: 'Estoque', estoque: 'Estoque', estoquista: 'Estoquista', estoqista: 'Estoquista',
  encarregado: 'Encarregado',
  // caixa / financeiro
  caixa: 'Caixa', financeiro: 'Financeiro', finaceiro: 'Financeiro',
  contabilidade: 'Contabilidade', contabilidae: 'Contabilidade',
  // gerais comuns
  limpeza: 'Limpeza', faxina: 'Faxina', cozinha: 'Cozinha', cozinheiro: 'Cozinheiro',
  garcom: 'Garçom', garcon: 'Garçom', seguranca: 'Segurança', porteiro: 'Porteiro',
  enfermagem: 'Enfermagem', enfermeiro: 'Enfermeiro', tecnico: 'Técnico',
  professor: 'Professor', professora: 'Professora', monitor: 'Monitor',
  // ensino / médio
  meidio: 'Médio', medio: 'Médio', fundametal: 'Fundamental', fundamental: 'Fundamental',
  superio: 'Superior', superior: 'Superior', completo: 'Completo',
  incompleto: 'Incompleto',
};

// Vocabulário para correção fuzzy de palavras soltas (em minúsculo, sem acento)
export const VOCABULARIO: string[] = [
  'servicos', 'gerais', 'geral', 'servico', 'administrativo', 'administrativa',
  'administracao', 'atendimento', 'atendente', 'recepcionista', 'recepcao',
  'auxiliar', 'ajudante', 'balconista', 'vendedor', 'vendas', 'motorista',
  'almoxarife', 'almoxarifado', 'estoque', 'estoquista', 'encarregado', 'caixa',
  'financeiro', 'contabilidade', 'limpeza', 'faxina', 'cozinha', 'cozinheiro',
  'garcom', 'seguranca', 'porteiro', 'enfermagem', 'enfermeiro', 'tecnico',
  'professor', 'monitor', 'operador', 'producao', 'logistica', 'comercial',
  'informatica', 'recursos', 'humanos', 'supervisor', 'coordenador', 'assistente',
  'gerente', 'consultor', 'analista', 'pedreiro', 'eletricista', 'pintor',
  'mecanico', 'soldador', 'jardineiro', 'babá', 'cuidador', 'farmaceutico',
];

// Conectores que ficam minúsculos no título
export const CONECTORES = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em']);

// 5) Escolaridade canônica → sinônimos (chave sem acento)
export const ESCOLARIDADE: Array<{ valor: string; sin: string[] }> = [
  { valor: 'Ensino Fundamental Incompleto', sin: ['fundamental incompleto', 'primeiro grau incompleto', 'primario incompleto'] },
  { valor: 'Ensino Fundamental Completo', sin: ['fundamental completo', 'fundamental', 'primeiro grau', '1 grau', 'primario'] },
  { valor: 'Ensino Médio Incompleto', sin: ['medio incompleto', 'segundo grau incompleto', 'medio cursando', 'cursando medio'] },
  { valor: 'Ensino Médio Completo', sin: ['ensino medio', 'ensino meidio', 'medio completo', 'medio', 'segundo grau', '2 grau', 'colegial', 'segundo grau completo'] },
  { valor: 'Ensino Superior em Andamento', sin: ['superior em andamento', 'faculdade cursando', 'superior cursando', 'cursando faculdade', 'cursando superior', 'graduacao em andamento', 'faculdade incompleta', 'superior incompleto'] },
  { valor: 'Ensino Superior Completo', sin: ['superior completo', 'superior', 'faculdade completa', 'graduacao', 'graduado', 'ensino superior', 'formado'] },
  { valor: 'Pós-graduação', sin: ['pos graduacao', 'pos', 'especializacao', 'mba'] },
  { valor: 'Curso Técnico', sin: ['tecnico', 'curso tecnico', 'ensino tecnico', 'profissionalizante'] },
];

// 6) Cursos canônicos → sinônimos
export const CURSOS: Array<{ valor: string; sin: string[] }> = [
  { valor: 'Excel', sin: ['excel'] },
  { valor: 'Excel Intermediário', sin: ['curso de excel', 'excel intermediario', 'excel avancado'] },
  { valor: 'Microsoft Word', sin: ['word', 'ms word'] },
  { valor: 'Informática Básica', sin: ['informatica', 'curso de computador', 'computador', 'informatica basica', 'curso de informatica'] },
  { valor: 'Pacote Office', sin: ['pacote office', 'office', 'pacote office completo'] },
  { valor: 'Inglês Básico', sin: ['ingles basico', 'ingles'] },
  { valor: 'Inglês Intermediário', sin: ['ingles intermediario'] },
  { valor: 'Inglês Avançado', sin: ['ingles avancado', 'ingles fluente'] },
  { valor: 'Espanhol', sin: ['espanhol'] },
  { valor: 'Atendimento ao Cliente', sin: ['atendimento ao cliente', 'curso de atendimento'] },
  { valor: 'Logística', sin: ['logistica', 'curso de logistica'] },
  { valor: 'Operador de Empilhadeira', sin: ['empilhadeira', 'operador de empilhadeira'] },
];

// 7+11) Profissões → sinônimos + descrição profissional pronta
export const PROFISSOES: Array<{ profissao: string; sin: string[]; descricao: string }> = [
  {
    profissao: 'Serviços Gerais',
    sin: ['servicos gerais', 'servico geral', 'servente', 'faxina', 'limpeza', 'ajudante', 'ajudante geral', 'auxiliar geral', 'auxiliar de servicos gerais', 'zelador'],
    descricao: 'Responsável pela limpeza, organização e conservação dos ambientes, prestando suporte às atividades operacionais da empresa.',
  },
  {
    profissao: 'Vendedor',
    sin: ['vendedor', 'vendas', 'vender', 'balcao', 'comercio', 'loja', 'atendente de loja', 'vendedora'],
    descricao: 'Atendimento ao cliente, negociação de produtos e acompanhamento do processo de vendas.',
  },
  {
    profissao: 'Operador de Caixa',
    sin: ['caixa', 'operador de caixa', 'operadora de caixa', 'frente de caixa'],
    descricao: 'Operação de caixa, recebimento de pagamentos e atendimento ao público.',
  },
  {
    profissao: 'Estoquista',
    sin: ['estoque', 'estoquista', 'almoxarifado', 'almoxarife', 'mercadoria', 'deposito', 'conferente'],
    descricao: 'Controle de estoque, organização de mercadorias e suporte ao abastecimento de produtos.',
  },
  {
    profissao: 'Auxiliar Administrativo',
    sin: ['administrativo', 'escritorio', 'papelada', 'documentos', 'administracao', 'rotina administrativa', 'auxiliar administrativo', 'assistente administrativo'],
    descricao: 'Organização de documentos, atendimento interno e suporte às rotinas administrativas.',
  },
  {
    profissao: 'Recepcionista',
    sin: ['recepcionista', 'recepcao', 'atendia pessoas', 'atender pessoas', 'recebia clientes'],
    descricao: 'Recepção e atendimento ao público, fornecendo suporte e direcionamento aos clientes.',
  },
  {
    profissao: 'Motorista',
    sin: ['motorista', 'dirigia', 'dirigir', 'entregador', 'entregas', 'motoboy'],
    descricao: 'Realização de transporte de pessoas e materiais, garantindo segurança e cumprimento de prazos.',
  },
  {
    profissao: 'Atendente',
    sin: ['atendente', 'atendimento', 'atendia clientes', 'atender clientes', 'sac', 'telemarketing'],
    descricao: 'Atendimento ao cliente, esclarecimento de dúvidas e suporte no relacionamento com o público.',
  },
  {
    profissao: 'Auxiliar de Cozinha',
    sin: ['cozinha', 'auxiliar de cozinha', 'cozinheiro', 'ajudante de cozinha', 'chapeiro'],
    descricao: 'Apoio no preparo de alimentos, organização e higienização da cozinha e dos utensílios.',
  },
];

// 9) Correção de domínios de e-mail
export const DOMINIOS: Record<string, string> = {
  'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com',
  'gmial.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gamil.com': 'gmail.com',
  'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.co': 'hotmail.com',
  'hotmial.com': 'hotmail.com', 'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com',
  'yaho.com': 'yahoo.com', 'yahho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com',
};

// 10/12) Respostas a serem bloqueadas (não viram texto de currículo)
export const NEGATIVAS_VAZIO = [
  'nao sei', 'nao tenho', 'nenhuma', 'nenhum', 'nao sei mexer', 'sei la',
  'nao faco nada', 'nao faco', 'nada', 'sem habilidades', 'n sei',
];

export const FRASES_RUINS = [
  'nao sei', 'mais ou menos', 'acho que', 'nem lembro', 'sei la',
  'qualquer coisa', 'tanto faz', 'nao tenho experiencia', 'nao faco nada',
];

// Habilidades padrão sugeridas quando o usuário não sabe listar
export const HABILIDADES_PADRAO = [
  'Organização', 'Responsabilidade', 'Trabalho em Equipe',
  'Pontualidade', 'Comprometimento', 'Aprendizado Rápido',
];

// Meses (nome / abreviação / por extenso em número)
export const MESES: Record<string, number> = {
  janeiro: 1, jan: 1, fevereiro: 2, fev: 2, marco: 3, mar: 3, abril: 4, abr: 4,
  maio: 5, mai: 5, junho: 6, jun: 6, julho: 7, jul: 7, agosto: 8, ago: 8,
  setembro: 9, set: 9, outubro: 10, out: 10, novembro: 11, nov: 11, dezembro: 12, dez: 12,
};

export const NUMEROS_EXTENSO: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6,
  sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12,
};

// Cidades comuns: forma sem acento → forma acentuada correta
export const CIDADES_ACENTO: Record<string, string> = {
  goiania: 'Goiânia', anapolis: 'Anápolis', brasilia: 'Brasília',
  cristalina: 'Cristalina', 'aparecida de goiania': 'Aparecida de Goiânia',
  'sao paulo': 'São Paulo', 'ribeirao preto': 'Ribeirão Preto',
  'sao jose': 'São José', maua: 'Mauá', niteroi: 'Niterói',
  vitoria: 'Vitória', macapa: 'Macapá', florianopolis: 'Florianópolis',
  cuiaba: 'Cuiabá', 'sao luis': 'São Luís', teresina: 'Teresina',
  belem: 'Belém', maceio: 'Maceió',
};
