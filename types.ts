
export type Choice = 'אבן' | 'נייר' | 'מספריים';

export type SpecialRoundType = 'DOUBLE' | 'REVERSE' | 'STEAL' | null;

export interface GameState {
  userScore: number;
  computerScore: number;
  rounds: number;
  lastResult: 'ניצחון' | 'הפסד' | 'תיקו' | null;
  history: { user: Choice; computer: Choice; result: string }[];
  currentSpecial: SpecialRoundType;
}

export interface GeminiCommentary {
  message: string;
  taunt: string;
}
