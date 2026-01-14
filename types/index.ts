export interface Pack {
  id: string;
  name: string;
  description: string;
  priceDisplay: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  correctAnswers: string[];
  wrongAnswers: string[];
}

export interface LegacyPack {
  id: string;
  name: string;
  description: string;
  priceDisplay: string;
  questions: LegacyQuestion[];
}

export interface LegacyQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndices: number[];
}

export interface Player {
  id: number;
  name: string;
  score: number;
}

export interface GameSession {
  players: Player[];
  targetScore: number;
  currentPlayerIndex: number;
  selectedPackIds: string[];
  questionQueue: string[]; // List of Question IDs
  currentQuestionIndex: number;
  isActive: boolean;
}
