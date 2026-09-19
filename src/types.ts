export type GamePhase = 'setup' | 'playing' | 'spinning' | 'moving' | 'event' | 'game_over';

export type TileCategory = 
  | 'start' 
  | 'finish' 
  | 'question'    // Questões de Direito do Trabalho (CLT, CF/88, Súmulas TST)
  | 'bonus'       // Casas bônus (Garantias, Tutela de Urgência, Honorários, etc.)
  | 'case'        // Caso Prático / Audiência Trabalhista
  | 'dilemma'     // Dilema Ético / Acordo Judicial
  | 'quiz';       // Desafio Rápido de Súmula/OJ

export interface Player {
  id: string;
  name: string;
  color: string; // Tailwind color string or hex
  accentColor: string; // Background tint
  avatar: string; // Emoji / ícone representativo (balança, martelo, etc)
  points: number; // Pontuação por acerto em questões e bônus (substitui dinheiro)
  reputation: number; // Reputação Jurídica / Felicidade Profissional
  position: number; // 0 (Início) até finishTileId
  isFinished: boolean;
  finishRank?: number;
  skipNextTurn?: boolean;
  role?: string; // Foco da atuação (Advogado(a) Trabalhista, Juiz(a) do Trabalho, Procurador(a) do MPT, etc.)
  questionsAnsweredCount: number; // Total de perguntas respondidas (certas ou erradas)
  correctAnswersCount: number;
  bonusCount: number;
  achievements: string[];
}

export interface Tile {
  id: number;
  title: string;
  subtitle: string;
  category: TileCategory;
  stage: string; // 'Abertura da Carreira' | 'Contrato Individual & Admissão' | 'Jornada, Salário & Benefícios' | 'Segurança & Estabilidade' | 'Rescisão & Processo do Trabalho' | 'Consagração Jurídica'
  icon: string;
  color: string;
  isBonus?: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
  legalBasis: string; // Ex: 'Art. 468 da CLT', 'Súmula 331 do TST', 'Art. 7º, XIII da CF/88'
}

export interface EventChoice {
  text: string;
  outcomeDesc: string;
  points?: number;
  reputation?: number;
  moveSteps?: number;
  skipTurn?: boolean;
  achievement?: string;
  legalBasis?: string;
}

export interface LawGameEvent {
  id: string;
  title: string;
  category: TileCategory;
  type: 'question' | 'bonus' | 'dilemma';
  description: string;
  legalContext?: string; // Artigo, contexto doutrinário ou jurisprudência
  
  // Informações da Carta do Manual
  cardLetter?: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'CHEGADA'
  questionNumber?: number; // 1 a 142
  level?: 'Fácil' | 'Média' | 'Difícil' | 'Superpergunta';

  // Para casas de questão (perguntas de Direito do Trabalho):
  question?: {
    statement: string;
    pointsReward: number; // 10, 20, 30 ou 100 pontos
    penaltyOrConsolation?: number; // 0 ou pontos de participação
    options: QuestionOption[];
  };

  // Para casas bônus:
  bonus?: {
    headline: string;
    points: number;
    reputation: number;
    moveSteps?: number;
    achievement?: string;
    benefitDescription: string;
    legalBasis?: string;
    allowChoice?: boolean; // Escolha entre +15 pontos ou avançar 2 casas
  };

  // Para dilemas práticos de audiência / acordos:
  choices?: EventChoice[];
}

export interface TraversalStepNotice {
  tileId: number;
  tileTitle: string;
  miniNote: string;
}

export interface GameLogEntry {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  text: string;
  type: 'spin' | 'move' | 'event' | 'finish';
  timestamp: string;
}
