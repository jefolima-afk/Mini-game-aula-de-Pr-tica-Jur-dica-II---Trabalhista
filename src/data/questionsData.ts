import { ManualQuestion } from './questionTypes';

interface QuestionTemplate {
  topic: string;
  level: 'Fácil' | 'Média' | 'Difícil';
  points: number;
  statementTpl: string;
  options: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctLetter: 'A' | 'B' | 'C' | 'D';
  legalBasis: string;
}

// O banco oficial possui 7 perguntas base que se repetem em formato de rodízio pelas casas[cite: 1].
const TEMPLATES: Record<string, QuestionTemplate> = {
  prazo_ro: {
    topic: 'Recurso Ordinário - Prazo',
    level: 'Fácil',
    points: 10,
    statementTpl: 'Segundo a CLT, qual é o prazo legal para a interposição do Recurso Ordinário em dissídios individuais?', //[cite: 1]
    options: [
      { letter: 'A', text: '15 dias conforme as regras gerais do CPC.' }, //[cite: 1]
      { letter: 'B', text: '10 dias úteis contados da audiência de julgamento.' }, //[cite: 1]
      { letter: 'C', text: '5 dias corridos a partir da publicação da sentença.' }, //[cite: 1]
      { letter: 'D', text: '8 dias úteis a contar da intimação da decisão.' }, //[cite: 1]
    ],
    correctLetter: 'D', // O gabarito correto muda conforme a carta, mas mapearemos de acordo com o texto da opção D[cite: 1]. 
    // Nota: No PDF a ordem das letras muda em cada carta, mas o texto correto é sempre "8 dias". Centralizamos a alternativa correta na letra fixa D neste template.
    legalBasis: 'Art. 895, I da CLT: O Recurso Ordinário deve ser interposto no prazo de 8 dias.', //[cite: 1]
  },
  testemunhas_sum: {
    topic: 'Rito Sumaríssimo - Testemunhas',
    level: 'Fácil',
    points: 10,
    statementTpl: 'No procedimento sumaríssimo trabalhista, qual o número máximo de testemunhas que cada parte pode indicar?', //[cite: 1]
    options: [
      { letter: 'A', text: 'Até 6 testemunhas por parte.' }, //[cite: 1]
      { letter: 'B', text: 'Até 2 testemunhas por parte.' }, //[cite: 1]
      { letter: 'C', text: 'Até 4 testemunhas por parte.' }, //[cite: 1]
      { letter: 'D', text: 'Até 3 testemunhas por parte.' }, //[cite: 1]
    ],
    correctLetter: 'B', //[cite: 1]
    legalBasis: 'Art. 852-H, § 2º da CLT: Cada parte poderá indicar até duas testemunhas no rito sumaríssimo.', //[cite: 1]
  },
  ausencia_reclamante: {
    topic: 'Audiência - Ausência',
    level: 'Média',
    points: 20,
    statementTpl: 'Qual a penalidade aplicável ao Reclamante que não comparece à audiência inaugural sem justificativa legal?', //[cite: 1]
    options: [
      { letter: 'A', text: 'Multa de 10% sobre o valor da causa em favor do réu.' }, //[cite: 1]
      { letter: 'B', text: 'Decretação de revelia e confissão ficta dos fatos.' }, //[cite: 1]
      { letter: 'C', text: 'Arquivamento da reclamação trabalhista e condenação em custas.' }, //[cite: 1]
      { letter: 'D', text: 'Extinção com resolução do mérito por renúncia ao direito.' }, //[cite: 1]
    ],
    correctLetter: 'C', //[cite: 1]
    legalBasis: 'Art. 844 da CLT: O não comparecimento do reclamante importa o arquivamento da reclamação.', //[cite: 1]
  },
  onus_cartoes: {
    topic: 'Provas - Cartões de Ponto',
    level: 'Média',
    points: 20,
    statementTpl: 'O empregador que conta com mais de 20 empregados tem o dever probatório de apresentar quais documentos em juízo?', //[cite: 1]
    options: [
      { letter: 'A', text: 'As notas fiscais de compra de equipamentos de proteção.' }, //[cite: 1]
      { letter: 'B', text: 'Os controles de frequência/cartões de ponto do trabalhador.' }, //[cite: 1]
      { letter: 'C', text: 'Os balancetes contábeis e fiscais dos últimos cinco anos.' }, //[cite: 1]
      { letter: 'D', text: 'As certidões de regularidade fiscal do estabelecimento.' }, //[cite: 1]
    ],
    correctLetter: 'B', //[cite: 1]
    legalBasis: 'Súmula 338, I do TST: É ônus do empregador que conta com mais de 20 empregados o registro da jornada de trabalho.', //[cite: 1]
  },
  desercao: {
    topic: 'Recursos - Deserção',
    level: 'Difícil',
    points: 30,
    statementTpl: 'Qual é a consequência do não pagamento das custas e do depósito recursal no momento da interposição do R.O.?', //[cite: 1]
    options: [
      { letter: 'A', text: 'A conversão em dívida ativa sem prejuízo do recurso.' }, //[cite: 1]
      { letter: 'B', text: 'A concessão automática de prazo suplementar de 15 dias.' }, //[cite: 1]
      { letter: 'C', text: 'A remessa dos autos ao TST para julgamento direto.' }, //[cite: 1]
      { letter: 'D', text: 'A deserção do recurso e seu não conhecimento.' }, //[cite: 1]
    ],
    correctLetter: 'D', //[cite: 1]
    legalBasis: 'Art. 899 da CLT c/c Súmula 245 do TST: O preparo deve ser comprovado dentro do prazo recursal, sob pena de deserção.', //[cite: 1]
  },
  transcendencia: {
    topic: 'Recurso de Revista - Transcendência',
    level: 'Média', // Adaptado pelo padrão da Casa 3[cite: 1]
    points: 20,
    statementTpl: 'No Recurso de Revista interposto perante o TST, qual das alternativas expressa uma exigência de admissibilidade?', //[cite: 1]
    options: [
      { letter: 'A', text: 'O depósito recursal em valor equivalente ao triplo do rito ordinário.' }, //[cite: 1]
      { letter: 'B', text: 'A juntada obrigatória de três laudos periciais divergentes.' }, //[cite: 1]
      { letter: 'C', text: 'A demonstração explícita da transcendência da matéria.' }, //[cite: 1]
      { letter: 'D', text: 'A reanálise integral do conjunto fático-probatório dos autos.' }, //[cite: 1]
    ],
    correctLetter: 'C', //[cite: 1]
    legalBasis: 'Art. 896-A da CLT: O TST examinará previamente se a causa oferece transcendência econômica, política, social ou jurídica.', //[cite: 1]
  },
  ap_cabimento: {
    topic: 'Agravo de Petição - Cabimento',
    level: 'Fácil', // Adaptado pelo padrão da Casa 3[cite: 1]
    points: 10,
    statementTpl: 'Na fase de execução, qual é o recurso cabível contra as decisões do Juiz ou Presidente nas execuções trabalhistas?', //[cite: 1]
    options: [
      { letter: 'A', text: 'Agravo de Petição, no prazo de 8 dias.' }, //[cite: 1]
      { letter: 'B', text: 'Agravo de Instrumento Executivo, no prazo de 5 dias.' }, //[cite: 1]
      { letter: 'C', text: 'Recurso Ordinário de Execução, no prazo de 15 dias.' }, //[cite: 1]
      { letter: 'D', text: 'Embargos à Execução Superior, no prazo de 10 dias.' }, //[cite: 1]
    ],
    correctLetter: 'A', //[cite: 1]
    legalBasis: "Art. 897, 'a' da CLT: Cabe Agravo de Petição das decisões nas execuções, no prazo de 8 dias.", //[cite: 1]
  }
};

// Mapeamento das 27 casas (5 cartas por casa) utilizando a rotação exata das 7 perguntas base do documento[cite: 1]
const TILE_CARDS_MAP: Record<number, string[]> = {
  2: ['prazo_ro', 'testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes', 'desercao'],
  3: ['transcendencia', 'ap_cabimento', 'prazo_ro', 'testemunhas_sum', 'ausencia_reclamante'],
  4: ['onus_cartoes', 'desercao', 'transcendencia', 'ap_cabimento', 'prazo_ro'],
  6: ['testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes', 'desercao', 'transcendencia'],
  7: ['ap_cabimento', 'prazo_ro', 'testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes'],
  8: ['desercao', 'transcendencia', 'ap_cabimento', 'prazo_ro', 'testemunhas_sum'],
  9: ['ausencia_reclamante', 'onus_cartoes', 'desercao', 'transcendencia', 'ap_cabimento'],
  11: ['prazo_ro', 'testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes', 'desercao'],
  12: ['transcendencia', 'ap_cabimento', 'prazo_ro', 'testemunhas_sum', 'ausencia_reclamante'],
  13: ['onus_cartoes', 'desercao', 'transcendencia', 'ap_cabimento', 'prazo_ro'],
  14: ['testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes', 'desercao', 'transcendencia'],
  16: ['ap_cabimento', 'prazo_ro', 'testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes'],
  17: ['desercao', 'transcendencia', 'ap_cabimento', 'prazo_ro', 'testemunhas_sum'],
  18: ['ausencia_reclamante', 'onus_cartoes', 'desercao', 'transcendencia', 'ap_cabimento'],
  19: ['prazo_ro', 'testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes', 'desercao'],
  21: ['transcendencia', 'ap_cabimento', 'prazo_ro', 'testemunhas_sum', 'ausencia_reclamante'],
  22: ['onus_cartoes', 'desercao', 'transcendencia', 'ap_cabimento', 'prazo_ro'],
  23: ['testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes', 'desercao', 'transcendencia'],
  24: ['ap_cabimento', 'prazo_ro', 'testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes'],
  26: ['desercao', 'transcendencia', 'ap_cabimento', 'prazo_ro', 'testemunhas_sum'],
  27: ['ausencia_reclamante', 'onus_cartoes', 'desercao', 'transcendencia', 'ap_cabimento'],
  28: ['prazo_ro', 'testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes', 'desercao'],
  29: ['transcendencia', 'ap_cabimento', 'prazo_ro', 'testemunhas_sum', 'ausencia_reclamante'],
  31: ['onus_cartoes', 'desercao', 'transcendencia', 'ap_cabimento', 'prazo_ro'],
  32: ['testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes', 'desercao', 'transcendencia'],
  33: ['ap_cabimento', 'prazo_ro', 'testemunhas_sum', 'ausencia_reclamante', 'onus_cartoes'],
  34: ['desercao', 'transcendencia', 'ap_cabimento', 'prazo_ro', 'testemunhas_sum'],
};

export const REGULAR_QUESTIONS: ManualQuestion[] = [];
let questionCounter = 1;
const CARD_LETTERS: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];

for (const tileIdStr of Object.keys(TILE_CARDS_MAP)) {
  const tileId = parseInt(tileIdStr, 10);
  const keys = TILE_CARDS_MAP[tileId];

  keys.forEach((key, idx) => {
    const tpl = TEMPLATES[key];
    const letter = CARD_LETTERS[idx];
    REGULAR_QUESTIONS.push({
      questionNumber: questionCounter++,
      tileId,
      cardLetter: letter,
      level: tpl.level,
      points: tpl.points,
      topic: tpl.topic,
      statement: `${tpl.statementTpl} (Variação ${letter})`,
      options: tpl.options,
      correctLetter: tpl.correctLetter,
      legalBasis: tpl.legalBasis,
    });
  });
}

// 7 Superperguntas do Desafio Final exatas do documento oficial[cite: 1]
export const FINISH_SUPER_QUESTIONS: ManualQuestion[] = [
  {
    questionNumber: 136,
    tileId: 35,
    cardLetter: 'CHEGADA-1',
    level: 'Superpergunta',
    points: 100,
    topic: 'Desafio Final - Execução',
    statement: 'SUPERPERGUNTA 1 (CASA 35): Na fase de execução trabalhista, a empresa executada interpôs Agravo de Petição impugnando os cálculos de liquidação. Qual é o requisito essencial exigido pelo art. 897, § 1º da CLT para o recebimento deste recurso?', //[cite: 1]
    options: [
      { letter: 'A', text: 'A delimitação justificada das matérias e dos valores impugnados, permitindo a execução imediata da parte incontroversa.' }, //[cite: 1]
      { letter: 'B', text: 'A concordância expressa do exequente quanto ao processamento da peça.' }, //[cite: 1]
      { letter: 'C', text: 'A apresentação de fiança bancária obrigatoriamente prestada por instituição pública.' }, //[cite: 1]
      { letter: 'D', text: 'O depósito recursal equivalente a 20% do valor total da condenação atualizada.' }, //[cite: 1]
    ],
    correctLetter: 'A', //[cite: 1]
    legalBasis: 'Art. 897, § 1º da CLT: O agravo de petição só será recebido se o agravante delimitar, justificadamente, as matérias e os valores impugnados.', //[cite: 1]
  },
  {
    questionNumber: 137,
    tileId: 35,
    cardLetter: 'CHEGADA-2',
    level: 'Superpergunta',
    points: 100,
    topic: 'Desafio Final - Recurso de Revista',
    statement: 'SUPERPERGUNTA 2 (CASA 35): Diante de acórdão proferido por Tribunal Regional do Trabalho em Recurso Ordinário, a parte deseja interpor Recurso de Revista ao TST. Segundo a Súmula 126 do TST, qual é a limitação cognitiva desse recurso?', //[cite: 1]
    options: [
      { letter: 'A', text: 'A obrigatoriedade de pagamento em dobro do depósito recursal para julgamento.' }, //[cite: 1]
      { letter: 'B', text: 'A exigência de manifestação do Ministério Público do Trabalho antes da distribuição.' }, //[cite: 1]
      { letter: 'C', text: 'A impossibilidade de reexame de fatos e provas no âmbito do Recurso de Revista.' }, //[cite: 1]
      { letter: 'D', text: 'A proibição de alegação de violação direta à Constituição Federal.' }, //[cite: 1]
    ],
    correctLetter: 'C', //[cite: 1]
    legalBasis: 'Súmula 126 do TST: Incabível o recurso de revista para reexame de fatos e provas.', //[cite: 1]
  },
  {
    questionNumber: 138,
    tileId: 35,
    cardLetter: 'CHEGADA-3',
    level: 'Superpergunta',
    points: 100,
    topic: 'Desafio Final - Transcendência',
    statement: 'SUPERPERGUNTA 3 (CASA 35): Em relação ao instituto da Transcêndência no Recurso de Revista (art. 896-A da CLT), assinale a alternativa que apresenta um indicador válido de transcendência política:', //[cite: 1]
    options: [
      { letter: 'A', text: 'A postulação de direito social constitucionalmente assegurado aos trabalhadores.' }, //[cite: 1]
      { letter: 'B', text: 'O desrespeito do acórdão recorrido à jurisprudência sumulada do TST ou do STF.' }, //[cite: 1]
      { letter: 'C', text: 'O valor da causa superior a 1.000 salários-mínimos na data da distribuição.' }, //[cite: 1]
      { letter: 'D', text: 'A existência de dúvida jurídica inédita sem qualquer precedente nos Tribunais.' }, //[cite: 1]
    ],
    correctLetter: 'B', //[cite: 1]
    legalBasis: 'Art. 896-A, § 1º, II da CLT: É indicador de transcendência política o desrespeito à jurisprudência sumulada do TST ou STF.', //[cite: 1]
  },
  {
    questionNumber: 139,
    tileId: 35,
    cardLetter: 'CHEGADA-4',
    level: 'Superpergunta',
    points: 100,
    topic: 'Desafio Final - Incompetência',
    statement: 'SUPERPERGUNTA 4 (CASA 35): No tocante à exceção de incompetência territorial no Processo do Trabalho (art. 800 da CLT), qual é o procedimento e prazo correto para sua apresentação pelo réu?', //[cite: 1]
    options: [
      { letter: 'A', text: 'Arguição verbal obrigatoriamente na abertura da audiência una de instrução.' }, //[cite: 1]
      { letter: 'B', text: 'Ajuizamento de ação autônoma no TRT no prazo de 8 dias contados da citação.' }, //[cite: 1]
      { letter: 'C', text: 'Oferecimento em preliminar de contestação no prazo de 15 dias após a audiência.' }, //[cite: 1]
      { letter: 'D', text: 'Apresentação em peça própria no prazo de 5 dias a contar da notificação, antes da audiência.' }, //[cite: 1]
    ],
    correctLetter: 'D', //[cite: 1]
    legalBasis: 'Art. 800 da CLT: Protocolada a petição no prazo de 5 dias contados da notificação, antes da audiência, o processo será suspenso.', //[cite: 1]
  },
  {
    questionNumber: 140,
    tileId: 35,
    cardLetter: 'CHEGADA-5',
    level: 'Superpergunta',
    points: 100,
    topic: 'Desafio Final - Depósito Recursal',
    statement: 'SUPERPERGUNTA 5 (CASA 35): Conforme a Consolidação das Leis do Trabalho (art. 899, § 9º), qual benefício é concedido às entidades sem fins lucrativos, empregadores domésticos e microempresas quanto ao depósito recursal?', //[cite: 1]
    options: [
      { letter: 'A', text: 'A redução do valor do depósito recursal pela metade (50%).' }, //[cite: 1]
      { letter: 'B', text: 'A isenção total e incondicional do pagamento do depósito recursal e das custas.' }, //[cite: 1]
      { letter: 'C', text: 'A dilatação do prazo recursal para 16 dias úteis com dispensa de preparo.' }, //[cite: 1]
      { letter: 'D', text: 'A substituição do depósito por prestação de serviços comunitários.' }, //[cite: 1]
    ],
    correctLetter: 'A', //[cite: 1]
    legalBasis: 'Art. 899, § 9º da CLT: O valor do depósito recursal será reduzido pela metade para entidades sem fins lucrativos, MEI, ME e EPP.', //[cite: 1]
  },
  {
    questionNumber: 141,
    tileId: 35,
    cardLetter: 'CHEGADA-6',
    level: 'Superpergunta',
    points: 100,
    topic: 'Desafio Final - Embargos de Declaração',
    statement: 'SUPERPERGUNTA 6 (CASA 35): Em sede de Embargos de Declaração no Processo do Trabalho (art. 897-A da CLT), quando a acolhida dos embargos implicar modificação do julgado (efeito modificativo), qual medida deve ser adotada pelo juiz?', //[cite: 1]
    options: [
      { letter: 'A', text: 'Proferir nova sentença imediatamente sem necessidade de ouvir a parte contrária.' }, //[cite: 1]
      { letter: 'B', text: 'Anular todo o processo e determinar o refazimento da audiência de instrução.' }, //[cite: 1]
      { letter: 'C', text: 'Conceder prazo de 5 dias para que a parte contrária se manifeste, em atenção ao contraditório.' }, //[cite: 1]
      { letter: 'D', text: 'Encaminhar os autos diretamente ao TRT para ratificação da alteração.' }, //[cite: 1]
    ],
    correctLetter: 'C', //[cite: 1]
    legalBasis: 'Orientação Jurisprudencial 142 da SDI-1 / Súmula 278 do TST: É passível de nulidade a decisão que acolhe ED com efeito modificativo sem oportunidade de contraditório em 5 dias.', //[cite: 1]
  },
  {
    questionNumber: 142,
    tileId: 35,
    cardLetter: 'CHEGADA-7',
    level: 'Superpergunta',
    points: 100,
    topic: 'Desafio Final - Ônus da Prova',
    statement: 'SUPERPERGUNTA 7 (CASA 35): Quanto à distribuição do ônus da prova no Processo do Trabalho (art. 818 da CLT), se o réu alega fato impeditivo, modificativo ou extintivo do direito do autor (ex: quitação mediante recibo), a quem incumbe o ônus de provar?', //[cite: 1]
    options: [
      { letter: 'A', text: 'Ao autor/reclamante, que sempre deve comprovar a invalidade de todos os recibos.' }, //[cite: 1]
      { letter: 'B', text: 'Ao réu/reclamado, por se tratar de fato impeditivo, modificativo ou extintivo.' }, //[cite: 1]
      { letter: 'C', text: 'Ao Ministério Público do Trabalho, mediante auditoria documental obrigatória.' }, //[cite: 1]
      { letter: 'D', text: 'Ao perito judicial nomeado pelo juiz para fiscalização das contas.' }, //[cite: 1]
    ],
    correctLetter: 'B', //[cite: 1]
    legalBasis: 'Art. 818, II da CLT: O ônus da prova incumbe ao réu, quanto à existência de fato impeditivo, modificativo ou extintivo do direito do autor.', //[cite: 1]
  },
];

export const ALL_QUESTIONS: ManualQuestion[] = [...REGULAR_QUESTIONS, ...FINISH_SUPER_QUESTIONS];

export function getQuestionsForTile(tileId: number): ManualQuestion[] {
  if (tileId === 35) {
    return FINISH_SUPER_QUESTIONS;
  }
  return REGULAR_QUESTIONS.filter((q) => q.tileId === tileId);
}
