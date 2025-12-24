
import { Choice, GeminiCommentary, SpecialRoundType } from "../types";

/**
 * No-op service to avoid API errors and quota issues as requested by the user.
 * AI features have been moved to local logic in App.tsx.
 */

export const getGeminiCommentary = async (
  _userChoice: Choice,
  _computerChoice: Choice,
  _result: string,
  _userScore: number,
  _computerScore: number,
  _specialRound: SpecialRoundType
): Promise<GeminiCommentary> => {
  return {
    message: "משחק מעולה!",
    taunt: "אני מוכן לסיבוב הבא."
  };
};

export const getSmartMove = async (_history: any): Promise<Choice> => {
    const choices: Choice[] = ['אבן', 'נייר', 'מספריים'];
    return choices[Math.floor(Math.random() * choices.length)];
}
