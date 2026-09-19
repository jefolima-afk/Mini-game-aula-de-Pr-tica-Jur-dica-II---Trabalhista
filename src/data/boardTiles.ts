import { Tile } from '../types';

export const START_TILE_ID = 0;
export const FINISH_TILE_ID = 34;
export const TOTAL_TILES = 35;
export const BONUS_TILE_IDS = [4, 9, 14, 19, 24, 29];

export const formatTileNumber = (id: number | string): string => {
  const num = Number(id);
  if (isNaN(num)) return String(id);
  return num.toString().padStart(2, '0');
};

export const BOARD_TILES: Tile[] = [
  // CASA 00: Ponto de Partida
  {
    id: 0,
    title: 'Partida: Início da Carreira',
    subtitle: 'Aprovação no Exame de Ordem e Posse Profissional',
    category: 'start',
    stage: 'Abertura da Carreira',
    icon: 'Scale',
    color: '#10B981', // Emerald
  },

  // CASA 01: Petição Inicial (antiga Casa 2)
  {
    id: 1,
    title: 'Petição Inicial Trabalhista',
    subtitle: 'Requisitos do art. 840, rito sumaríssimo e competência',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'FileCheck2',
    color: '#3B82F6',
  },

  // CASA 02: Contestação & Defesa (antiga Casa 3)
  {
    id: 2,
    title: 'Contestação & Exceções',
    subtitle: 'PJe, prescrição bienal/quinquenal e compensação',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Shield',
    color: '#3B82F6',
  },

  // CASA 03: Audiência Trabalhista (antiga Casa 4)
  {
    id: 3,
    title: 'Audiência Una e Instrução',
    subtitle: 'Testemunhas, contraditas, revelia e arquivamento',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'Users',
    color: '#3B82F6',
  },

  // CASA 04: BÔNUS 1 (antiga Casa 5)
  {
    id: 4,
    title: 'BÔNUS: Consultoria Preventiva',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 05: Provas no Processo (antiga Casa 6)
  {
    id: 5,
    title: 'Teoria Geral das Provas',
    subtitle: 'Ônus probatório (art. 818), cartões britânicos e perícias',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'BookOpen',
    color: '#3B82F6',
  },

  // CASA 06: Embargos & Recurso Ordinário (antiga Casa 7)
  {
    id: 6,
    title: 'Embargos de Declaração & RO',
    subtitle: 'Efeito interruptivo, prazos, preparo e custas',
    category: 'question',
    stage: 'Fase Recursal',
    icon: 'Send',
    color: '#3B82F6',
  },

  // CASA 07: Recurso de Revista (antiga Casa 8)
  {
    id: 7,
    title: 'Recurso de Revista no TST',
    subtitle: 'Prequestionamento e critérios de transcendência',
    category: 'question',
    stage: 'Tribunais Superiores',
    icon: 'Award',
    color: '#3B82F6',
  },

  // CASA 08: Agravo de Petição & Execução (antiga Casa 9)
  {
    id: 8,
    title: 'Execução & Agravo de Petição',
    subtitle: 'Delimitação de valores e execução da parte incontroversa',
    category: 'question',
    stage: 'Fase de Execução',
    icon: 'Gavel',
    color: '#3B82F6',
  },

  // CASA 09: BÔNUS 2 (antiga Casa 10)
  {
    id: 9,
    title: 'BÔNUS: Acordo Homologado',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 10: Requisitos da Petição Inicial (antiga Casa 11)
  {
    id: 10,
    title: 'Petição Inicial: Desafios',
    subtitle: 'Aditamentos, emendas e rito processual',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'FileText',
    color: '#3B82F6',
  },

  // CASA 11: Contestação e Prazos (antiga Casa 12)
  {
    id: 11,
    title: 'Defesa & Prazos Especiais',
    subtitle: 'Incompetência territorial e compensação de dívidas',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Clock',
    color: '#3B82F6',
  },

  // CASA 12: Dinâmica de Audiência (antiga Casa 13)
  {
    id: 12,
    title: 'Dinâmica da Audiência e Oitiva',
    subtitle: 'Ausência de partes, prepostos e registros em ata',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'Mic',
    color: '#3B82F6',
  },

  // CASA 13: Ônus da Prova & Documentos (antiga Casa 14)
  {
    id: 13,
    title: 'Prova Pericial & Documental',
    subtitle: 'Laudos periciais e impugnação tempestiva',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'FileSearch',
    color: '#3B82F6',
  },

  // CASA 14: BÔNUS 3 (antiga Casa 15)
  {
    id: 14,
    title: 'BÔNUS: Tutela de Urgência',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 15: Preparo Recursal & Isenções (antiga Casa 16)
  {
    id: 15,
    title: 'Preparo & Justiça Gratuita',
    subtitle: 'Isenções, depósitos recursais e ME/EPP/MEI',
    category: 'question',
    stage: 'Fase Recursal',
    icon: 'Coins',
    color: '#3B82F6',
  },

  // CASA 16: Uniformização no TST (antiga Casa 17)
  {
    id: 16,
    title: 'Uniformização Jurisprudencial',
    subtitle: 'Transcendência jurídica e ofensa à Constituição Federal',
    category: 'question',
    stage: 'Tribunais Superiores',
    icon: 'Building2',
    color: '#3B82F6',
  },

  // CASA 17: Liquidação & Cumprimento de Sentença (antiga Casa 18)
  {
    id: 17,
    title: 'Liquidação de Sentença',
    subtitle: 'Garantia do juízo e impugnação aos cálculos',
    category: 'question',
    stage: 'Fase de Execução',
    icon: 'Calculator',
    color: '#3B82F6',
  },

  // CASA 18: Ritos & Procedimentos Trabalhistas (antiga Casa 19)
  {
    id: 18,
    title: 'Rito Sumaríssimo & Ordinário',
    subtitle: 'Limites de valor da causa e competência funcional',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Layers',
    color: '#3B82F6',
  },

  // CASA 19: BÔNUS 4 (antiga Casa 20)
  {
    id: 19,
    title: 'BÔNUS: Sustentação Oral no TRT',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 20: Prescrição & Caducidade (antiga Casa 21)
  {
    id: 20,
    title: 'Prescrição Trabalhista',
    subtitle: 'Ações declaratórias, biênio e quinquênio',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Hourglass',
    color: '#3B82F6',
  },

  // CASA 21: Oitiva de Testemunhas & Contradita (antiga Casa 22)
  {
    id: 21,
    title: 'Prova Oral & Súmula 357 TST',
    subtitle: 'Testemunha que litiga contra o mesmo empregador',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'UserCheck',
    color: '#3B82F6',
  },

  // CASA 22: Prova Técnica & Livre Convencimento (antiga Casa 23)
  {
    id: 22,
    title: 'Perícia & Livre Convicção',
    subtitle: 'Não adstrição ao laudo e falsidade documental',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'CheckSquare',
    color: '#3B82F6',
  },

  // CASA 23: Recursos e Efeitos Processuais (antiga Casa 24)
  {
    id: 23,
    title: 'Teoria dos Recursos',
    subtitle: 'Embargos de declaração e efeito suspensivo x devolutivo',
    category: 'question',
    stage: 'Fase Recursal',
    icon: 'Send',
    color: '#3B82F6',
  },

  // CASA 24: BÔNUS 5 (antiga Casa 25)
  {
    id: 24,
    title: 'BÔNUS: Artigo Publicado no TST',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 25: Transcendência & Recursos ao TST (antiga Casa 26)
  {
    id: 25,
    title: 'Critérios de Transcendência',
    subtitle: 'Relevância econômica, política, social e jurídica',
    category: 'question',
    stage: 'Tribunais Superiores',
    icon: 'Compass',
    color: '#3B82F6',
  },

  // CASA 26: Penhora & Execução de Bens (antiga Casa 27)
  {
    id: 26,
    title: 'Penhora & Garantia da Execução',
    subtitle: 'Custas processuais e execução incontroversa',
    category: 'question',
    stage: 'Fase de Execução',
    icon: 'Landmark',
    color: '#3B82F6',
  },

  // CASA 27: Emenda e Competência Territorial (antiga Casa 28)
  {
    id: 27,
    title: 'Prática da Inicial Trabalhista',
    subtitle: 'Domicílio do trabalhador em teletrabalho e aditamentos',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'Briefcase',
    color: '#3B82F6',
  },

  // CASA 28: Estratégias de Defesa e Prescrição (antiga Casa 29)
  {
    id: 28,
    title: 'Exceções & Preliminares',
    subtitle: 'Incompetência de foro e prescrição das pretensões',
    category: 'question',
    stage: 'Fase Postulatória',
    icon: 'ShieldCheck',
    color: '#3B82F6',
  },

  // CASA 29: BÔNUS 6 (antiga Casa 30)
  {
    id: 29,
    title: 'BÔNUS: Notório Saber',
    subtitle: '+15 Pontos ou Avançar 2 Casas na Trilha',
    category: 'bonus',
    stage: 'Prática de Excelência',
    icon: 'Sparkles',
    color: '#F59E0B',
    isBonus: true,
  },

  // CASA 30: Condução de Audiência e Protestos (antiga Casa 31)
  {
    id: 30,
    title: 'Condução de Audiências',
    subtitle: 'Indeferimento de perguntas e nulidades processuais',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'ShieldAlert',
    color: '#3B82F6',
  },

  // CASA 31: Provas em Espécie no Processo (antiga Casa 32)
  {
    id: 31,
    title: 'Provas em Espécie & Perícias',
    subtitle: 'Manifestações sobre laudos e incidente de falsidade',
    category: 'question',
    stage: 'Instrução Probatória',
    icon: 'FileSpreadsheet',
    color: '#3B82F6',
  },

  // CASA 32: Recursos nos Tribunais Trabalhistas (antiga Casa 33)
  {
    id: 32,
    title: 'Julgamento Colegiado nos TRTs',
    subtitle: 'Recurso Ordinário, prazos e reduções legais do preparo',
    category: 'question',
    stage: 'Fase Recursal',
    icon: 'GraduationCap',
    color: '#3B82F6',
  },

  // CASA 33: Fase Final de Execução e Efetividade (antiga Casa 34)
  {
    id: 33,
    title: 'Execução Final & Efetividade',
    subtitle: 'Agravo de Petição, matérias delimitadas e garantia do juízo',
    category: 'question',
    stage: 'Fase de Execução',
    icon: 'CheckCircle2',
    color: '#3B82F6',
  },

  // CASA 34: Linha de Chegada (antiga Casa 35 - Superpergunta 100 Pontos)
  {
    id: 34,
    title: 'Chegada: Superpergunta',
    subtitle: 'Grande Desafio Final perante a Turma de Direito',
    category: 'finish',
    stage: 'Consagração Jurídica',
    icon: 'Crown',
    color: '#EAB308', // Gold
  },
];
