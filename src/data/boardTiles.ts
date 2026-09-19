import { Tile } from '../types';

export const BOARD_TILES: Tile[] = [
  // CASA 1: Ponto de Partida
  {
    id: 1,
    title: 'Partida: Início da Carreira',
    subtitle: 'Aprovação no Exame de Ordem e Posse Profissional',
    category: 'start',
    stage: 'Abertura da Carreira',
    icon: 'Scale',
    color: '#10B981', // Emerald
  },

  // CASA 2: Petição Inicial
  {
    id: 2,
    title: 'Petição Inicial Trabalhista',
    subtitle: 'Requisitos do art. 840, rito sumaríssimo e competência',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'FileCheck2',
    color: '#3B82F6',
  },

  // CASA 3: Contestação & Defesa
  {
    id: 3,
    title: 'Contestação & Exceções',
    subtitle: 'PJe, prescrição bienal/quinquenal e compensação',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Shield',
    color: '#3B82F6',
  },

  // CASA 4: Audiência Trabalhista
  {
    id: 4,
    title: 'Audiência Una e Instrução',
    subtitle: 'Testemunhas, contraditas, revelia e arquivamento',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'Users',
    color: '#3B82F6',
  },

  // CASA 5: BÔNUS 1 (Conforme Manual)
  {
    id: 5,
    title: 'BÔNUS: Consultoria Preventiva',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 6: Provas no Processo
  {
    id: 6,
    title: 'Teoria Geral das Provas',
    subtitle: 'Ônus probatório (art. 818), cartões britânicos e perícias',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'BookOpen',
    color: '#3B82F6',
  },

  // CASA 7: Embargos & Recurso Ordinário
  {
    id: 7,
    title: 'Embargos de Declaração & RO',
    subtitle: 'Efeito interruptivo, prazos, preparo e custas',
    category: 'question',
    stage: 'Fase Recursal',
    icon: 'Send',
    color: '#3B82F6',
  },

  // CASA 8: Recurso de Revista
  {
    id: 8,
    title: 'Recurso de Revista no TST',
    subtitle: 'Prequestionamento e critérios de transcendência',
    category: 'question',
    stage: 'Tribunais Superiores',
    icon: 'Award',
    color: '#3B82F6',
  },

  // CASA 9: Agravo de Petição & Execução
  {
    id: 9,
    title: 'Execução & Agravo de Petição',
    subtitle: 'Delimitação de valores e execução da parte incontroversa',
    category: 'question',
    stage: 'Fase de Execução',
    icon: 'Gavel',
    color: '#3B82F6',
  },

  // CASA 10: BÔNUS 2 (Conforme Manual)
  {
    id: 10,
    title: 'BÔNUS: Acordo Homologado',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 11: Requisitos da Petição Inicial
  {
    id: 11,
    title: 'Petição Inicial: Desafios',
    subtitle: 'Aditamentos, emendas e rito processual',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'FileText',
    color: '#3B82F6',
  },

  // CASA 12: Contestação e Prazos
  {
    id: 12,
    title: 'Defesa & Prazos Especiais',
    subtitle: 'Incompetência territorial e compensação de dívidas',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Clock',
    color: '#3B82F6',
  },

  // CASA 13: Dinâmica de Audiência
  {
    id: 13,
    title: 'Dinâmica da Audiência e Oitiva',
    subtitle: 'Ausência de partes, prepostos e registros em ata',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'Mic',
    color: '#3B82F6',
  },

  // CASA 14: Ônus da Prova & Documentos
  {
    id: 14,
    title: 'Prova Pericial & Documental',
    subtitle: 'Laudos periciais e impugnação tempestiva',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'FileSearch',
    color: '#3B82F6',
  },

  // CASA 15: BÔNUS 3 (Conforme Manual)
  {
    id: 15,
    title: 'BÔNUS: Tutela de Urgência',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 16: Preparo Recursal & Isenções
  {
    id: 16,
    title: 'Preparo & Justiça Gratuita',
    subtitle: 'Isenções, depósitos recursais e ME/EPP/MEI',
    category: 'question',
    stage: 'Fase Recursal',
    icon: 'Coins',
    color: '#3B82F6',
  },

  // CASA 17: Uniformização no TST
  {
    id: 17,
    title: 'Uniformização Jurisprudencial',
    subtitle: 'Transcendência jurídica e ofensa à Constituição Federal',
    category: 'question',
    stage: 'Tribunais Superiores',
    icon: 'Building2',
    color: '#3B82F6',
  },

  // CASA 18: Liquidação & Cumprimento de Sentença
  {
    id: 18,
    title: 'Liquidação de Sentença',
    subtitle: 'Garantia do juízo e impugnação aos cálculos',
    category: 'question',
    stage: 'Fase de Execução',
    icon: 'Calculator',
    color: '#3B82F6',
  },

  // CASA 19: Ritos & Procedimentos Trabalhistas
  {
    id: 19,
    title: 'Rito Sumaríssimo & Ordinário',
    subtitle: 'Limites de valor da causa e competência funcional',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Layers',
    color: '#3B82F6',
  },

  // CASA 20: BÔNUS 4 (Conforme Manual)
  {
    id: 20,
    title: 'BÔNUS: Sustentação Oral no TRT',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 21: Prescrição & Caducidade
  {
    id: 21,
    title: 'Prescrição Trabalhista',
    subtitle: 'Ações declaratórias, biênio e quinquênio',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Hourglass',
    color: '#3B82F6',
  },

  // CASA 22: Oitiva de Testemunhas & Contradita
  {
    id: 22,
    title: 'Prova Oral & Súmula 357 TST',
    subtitle: 'Testemunha que litiga contra o mesmo empregador',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'UserCheck',
    color: '#3B82F6',
  },

  // CASA 23: Prova Técnica & Livre Convencimento
  {
    id: 23,
    title: 'Perícia & Livre Convicção',
    subtitle: 'Não adstrição ao laudo e falsidade documental',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'CheckSquare',
    color: '#3B82F6',
  },

  // CASA 24: Recursos e Efeitos Processuais
  {
    id: 24,
    title: 'Teoria dos Recursos',
    subtitle: 'Embargos de declaração e efeito suspensivo x devolutivo',
    category: 'question',
    stage: 'Fase Recursal',
    icon: 'Send',
    color: '#3B82F6',
  },

  // CASA 25: BÔNUS 5 (Conforme Manual)
  {
    id: 25,
    title: 'BÔNUS: Artigo Publicado no TST',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 26: Transcendência & Recursos ao TST
  {
    id: 26,
    title: 'Critérios de Transcendência',
    subtitle: 'Relevância econômica, política, social e jurídica',
    category: 'question',
    stage: 'Tribunais Superiores',
    icon: 'Compass',
    color: '#3B82F6',
  },

  // CASA 27: Penhora & Execução de Bens
  {
    id: 27,
    title: 'Penhora & Garantia da Execução',
    subtitle: 'Custas processuais e execução incontroversa',
    category: 'question',
    stage: 'Fase de Execução',
    icon: 'Landmark',
    color: '#3B82F6',
  },

  // CASA 28: Emenda e Competência Territorial
  {
    id: 28,
    title: 'Prática da Inicial Trabalhista',
    subtitle: 'Domicílio do trabalhador em teletrabalho e aditamentos',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Briefcase',
    color: '#3B82F6',
  },

  // CASA 29: Estratégias de Defesa e Prescrição
  {
    id: 29,
    title: 'Exceções & Preliminares',
    subtitle: 'Incompetência de foro e prescrição das pretensões',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'ShieldCheck',
    color: '#3B82F6',
  },

  // CASA 30: BÔNUS 6 (Conforme Manual)
  {
    id: 30,
    title: 'BÔNUS: Notório Saber',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 31: Condução de Audiência e Protestos
  {
    id: 31,
    title: 'Condução de Audiências',
    subtitle: 'Indeferimento de perguntas e nulidades processuais',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'ShieldAlert',
    color: '#3B82F6',
  },

  // CASA 32: Provas em Espécie no Processo
  {
    id: 32,
    title: 'Provas em Espécie & Perícias',
    subtitle: 'Manifestações sobre laudos e incidente de falsidade',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'FileSpreadsheet',
    color: '#3B82F6',
  },

  // CASA 33: Recursos nos Tribunais Trabalhistas
  {
    id: 33,
    title: 'Julgamento Colegiado nos TRTs',
    subtitle: 'Recurso Ordinário, prazos e reduções legais do preparo',
    category: 'question',
    stage: 'Fase Recursal',
    icon: 'GraduationCap',
    color: '#3B82F6',
  },

  // CASA 34: Fase Final de Execução e Efetividade
  {
    id: 34,
    title: 'Execução Final & Efetividade',
    subtitle: 'Agravo de Petição, matérias delimitadas e garantia do juízo',
    category: 'question',
    stage: 'Fase de Execução',
    icon: 'CheckCircle2',
    color: '#3B82F6',
  },

  // CASA 35: Linha de Chegada (Superpergunta - 100 Pontos)
  {
    id: 35,
    title: 'Chegada: Superpergunta',
    subtitle: 'Grande Desafio Final perante a Turma de Direito',
    category: 'finish',
    stage: 'Consagração Jurídica',
    icon: 'Crown',
    color: '#EAB308', // Gold
  },
];
