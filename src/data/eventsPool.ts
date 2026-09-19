import { LawGameEvent, Tile } from '../types';
import { 
  getQuestionsForTile, 
  FINISH_SUPER_QUESTIONS, 
  REGULAR_QUESTIONS 
} from './questionsData';
import { ManualQuestion } from './questionTypes';

export const MINI_STEP_EVENTS: Array<{ text: string; pointsDelta: number; reputationDelta: number }> = [
  { text: 'Leu e memorizou uma Súmula nova do TST no trajeto', pointsDelta: 5, reputationDelta: 5 },
  { text: 'Conferiu a petição inicial e corrigiu erro material a tempo', pointsDelta: 5, reputationDelta: 5 },
  { text: 'Consultou a redação do art. 7º da CF/88 no Vade Mecum', pointsDelta: 5, reputationDelta: 5 },
  { text: 'Chegou pontualmente à sala de audiência telepresencial', pointsDelta: 5, reputationDelta: 5 },
  { text: 'Compartilhou artigo didático com a turma sobre prerrogativas', pointsDelta: 5, reputationDelta: 5 },
  { text: 'Esclareceu dúvida de processo sobre prazos no PJe', pointsDelta: 5, reputationDelta: 5 },
];

export function getRandomMiniStepEvent() {
  const idx = Math.floor(Math.random() * MINI_STEP_EVENTS.length);
  return MINI_STEP_EVENTS[idx];
}

// Convert a ManualQuestion into the LawGameEvent structure needed by the game
export function mapManualQuestionToEvent(q: ManualQuestion): LawGameEvent {
  const options = q.options.map((opt: { letter: 'A' | 'B' | 'C' | 'D'; text: string }) => ({
    id: `opt_${q.questionNumber}_${opt.letter.toLowerCase()}`,
    text: `${opt.letter}) ${opt.text}`,
    isCorrect: opt.letter === q.correctLetter,
    explanation: opt.letter === q.correctLetter 
      ? `Correto! Fundamentação: ${q.legalBasis}`
      : `Incorreto. A alternativa correta é a (${q.correctLetter}).`,
    legalBasis: q.legalBasis,
  }));

  return {
    id: `manual_q_${q.questionNumber}`,
    questionNumber: q.questionNumber,
    cardLetter: q.cardLetter,
    level: q.level,
    title: `Casa ${q.tileId} • ${q.cardLetter.startsWith('CHEGADA') ? 'Superpergunta Final' : `Carta ${q.cardLetter}`} (#${q.questionNumber})`,
    category: q.tileId === 35 ? 'finish' : 'question',
    type: 'question',
    description: `Tópico: ${q.topic} • Nível: ${q.level} • Vale: ${q.points} Pontos`,
    legalContext: q.legalBasis,
    question: {
      statement: q.statement,
      pointsReward: q.points,
      penaltyOrConsolation: 0,
      options,
    },
  };
}

// Global registry of used question IDs in the match to prevent repetition
export class QuestionTracker {
  private static usedByTile: Record<number, number[]> = {};
  private static usedFinishQuestions: number[] = [];

  public static reset() {
    this.usedByTile = {};
    this.usedFinishQuestions = [];
  }

  // Draw the next unused question for a regular tile (Cartas A, B, C, D, E)
  public static getNextQuestionForTile(tileId: number): ManualQuestion {
    const tileQuestions = getQuestionsForTile(tileId);
    if (!tileQuestions || tileQuestions.length === 0) {
      // Fallback
      return REGULAR_QUESTIONS[0];
    }

    if (!this.usedByTile[tileId]) {
      this.usedByTile[tileId] = [];
    }

    const usedIndices = this.usedByTile[tileId];

    // Find the first index not yet used
    let chosenIdx = tileQuestions.findIndex((_, idx) => !usedIndices.includes(idx));

    // If all 5 cards were used on this tile, reset and cycle
    if (chosenIdx === -1) {
      this.usedByTile[tileId] = [];
      chosenIdx = 0;
    }

    this.usedByTile[tileId].push(chosenIdx);
    return tileQuestions[chosenIdx];
  }

  // Draw one of the 7 Superquestions for finish line (Casa 35) without repetition
  public static getNextFinishQuestion(): ManualQuestion {
    const totalFinish = FINISH_SUPER_QUESTIONS.length; // 7

    // Find unused finish question
    let chosenIdx = FINISH_SUPER_QUESTIONS.findIndex(
      (q) => !this.usedFinishQuestions.includes(q.questionNumber)
    );

    if (chosenIdx === -1) {
      // If more than 7 reach or recycled, pick random
      chosenIdx = Math.floor(Math.random() * totalFinish);
    } else {
      this.usedFinishQuestions.push(FINISH_SUPER_QUESTIONS[chosenIdx].questionNumber);
    }

    return FINISH_SUPER_QUESTIONS[chosenIdx];
  }
}

// Get the event for any landed tile
export function getEventForTile(tile: Tile): LawGameEvent {
  // CASA 1: Ponto de partida
  if (tile.id === 1) {
    return {
      id: 'start_tile',
      title: 'Partida: Início da Carreira',
      category: 'start',
      type: 'bonus',
      description: 'Ponto de partida da trilha de Prática do Trabalho. Nenhum ponto ganho na largada. Gire a roleta para avançar!',
      legalContext: 'Estatuto da OAB e Constituição Federal de 1988',
      bonus: {
        headline: 'Largada da Turma',
        points: 0,
        reputation: 10,
        benefitDescription: 'Você está no ponto de partida pronto para responder às questões e acumular pontuação!',
      },
    };
  }

  // CASAS BÔNUS OFICIAIS: 5, 10, 15, 20, 25 e 30
  if ([5, 10, 15, 20, 25, 30].includes(tile.id)) {
    const bonusNames: Record<number, { title: string; desc: string; basis: string }> = {
      5: {
        title: 'BÔNUS: Consultoria Preventiva',
        desc: 'Seu parecer eliminou riscos de passivo trabalhista prévio para a empresa cliente.',
        basis: 'Art. 133 da CF/88 e Código de Ética e Disciplina da OAB',
      },
      10: {
        title: 'BÔNUS: Acordo Homologado',
        desc: 'Composição amigável em audiência de conciliação vantajosa e sem custas adicionais.',
        basis: 'Art. 846 e 764 da CLT: Conciliação como princípio basilar do processo do trabalho',
      },
      15: {
        title: 'BÔNUS: Tutela de Urgência',
        desc: 'Ordem liminar deferida pelo juízo para reintegração imediata de empregado protegido.',
        basis: 'Art. 300 do CPC c/c Art. 769 da CLT',
      },
      20: {
        title: 'BÔNUS: Sustentação Oral no TRT',
        desc: 'Reforma de decisão desfavorável em acórdão por unanimidade na Turma Regional.',
        basis: 'Regimento Interno dos TRTs e Prerrogativas da Advocacia (Lei 8.906/94)',
      },
      25: {
        title: 'BÔNUS: Artigo Publicado no TST',
        desc: 'Estudo doutrinário inovador citado por Ministros do Tribunal Superior do Trabalho.',
        basis: 'Doutrina Trabalhista e Fonte Material do Direito do Trabalho',
      },
      30: {
        title: 'BÔNUS: Notório Saber',
        desc: 'Atuação de destaque em dissídio coletivo de greve com mediação equilibrada.',
        basis: 'Art. 114, § 2º da CF/88',
      },
    };

    const bData = bonusNames[tile.id] || {
      title: 'Casa Bônus',
      desc: 'Benefício direto garantido pelas regras do jogo!',
      basis: 'Manual Oficial de Regras do Jogo Trabalhista',
    };

    return {
      id: `bonus_tile_${tile.id}`,
      title: bData.title,
      category: 'bonus',
      type: 'bonus',
      description: `${bData.desc} Você tem direito ao benefício direto das regras: escolha entre receber +15 pontos ou avançar 2 casas no tabuleiro!`,
      legalContext: bData.basis,
      bonus: {
        headline: 'Benefício Direto da Casa Bônus',
        points: 15,
        reputation: 15,
        moveSteps: 2,
        allowChoice: true, // Allows student to choose +15 points OR move 2 steps
        benefitDescription: '+15 Pontos Imediatos OU Avançar 2 Casas na Trilha',
        legalBasis: bData.basis,
      },
    };
  }

  // CASA 35: LINHA DE CHEGADA (Superpergunta 100 pontos entre as 7 opções)
  if (tile.id === 35) {
    const q = QuestionTracker.getNextFinishQuestion();
    return mapManualQuestionToEvent(q);
  }

  // CASAS DE PERGUNTAS (27 Casas): 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 31, 32, 33, 34
  const questionObj = QuestionTracker.getNextQuestionForTile(tile.id);
  return mapManualQuestionToEvent(questionObj);
}
