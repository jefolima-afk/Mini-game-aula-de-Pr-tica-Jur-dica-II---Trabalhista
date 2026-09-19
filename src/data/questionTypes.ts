export interface ManualQuestion {
  questionNumber: number;
  tileId: number;
  cardLetter: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'CHEGADA-1' ...
  level: 'Fácil' | 'Média' | 'Difícil' | 'Superpergunta';
  points: number; // 10, 20, 30, 100
  topic: string;
  statement: string;
  options: {
    letter: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctLetter: 'A' | 'B' | 'C' | 'D';
  legalBasis: string;
}
