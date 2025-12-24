
import { GoogleGenAI, Type } from "@google/genai";
import { Choice, GeminiCommentary, SpecialRoundType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getGeminiCommentary = async (
  userChoice: Choice,
  computerChoice: Choice,
  result: string,
  userScore: number,
  computerScore: number,
  specialRound: SpecialRoundType
): Promise<GeminiCommentary> => {
  try {
    const specialContext = specialRound 
      ? `זה היה סיבוב מיוחד מסוג: ${
          specialRound === 'DOUBLE' ? 'נקודות כפולות' : 
          specialRound === 'REVERSE' ? 'חוקים הפוכים' : 
          'גניבת נקודה'
        }.` 
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${specialContext} המשתמש בחר ${userChoice}, המחשב בחר ${computerChoice}. התוצאה היא ${result}. הניקוד הנוכחי: משתמש ${userScore}, מחשב ${computerScore}. תן תגובה קצרה ומצחיקה בעברית (עד 15 מילים) שמתייחסת לסיבוב ולתוצאה.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: "הערה מעודדת או מצחיקה על הסיבוב" },
            taunt: { type: Type.STRING, description: "הקנטה ידידותית או קריאת קרב" }
          },
          required: ["message", "taunt"]
        }
      }
    });

    const data = JSON.parse(response.text || '{"message": "יופי של מהלך!", "taunt": "נראה מה תעשה עכשיו"}');
    return data;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      message: "משחק מעניין!",
      taunt: "אני מוכן לסיבוב הבא."
    };
  }
};

export const getSmartMove = async (history: { user: Choice; computer: Choice; result: string }[]): Promise<Choice> => {
    if (history.length === 0) {
        const choices: Choice[] = ['אבן', 'נייר', 'מספריים'];
        return choices[Math.floor(Math.random() * choices.length)];
    }

    try {
        const historyStr = history.slice(0, 5).map(h => `משתמש: ${h.user}, מחשב: ${h.computer}`).join(' | ');
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `על בסיס ההיסטוריה הזו (מהחדש לישן): ${historyStr}, מה הבחירה שהמשתמש הכי סביר שיעשה בסיבוב הבא? בחר בין "אבן", "נייר" או "מספריים". החזר רק את המילה עצמה.`,
        });

        const prediction = response.text?.trim();
        if (prediction?.includes('אבן')) return 'נייר';
        if (prediction?.includes('נייר')) return 'מספריים';
        if (prediction?.includes('מספריים')) return 'אבן';
        
        const choices: Choice[] = ['אבן', 'נייר', 'מספריים'];
        return choices[Math.floor(Math.random() * choices.length)];
    } catch (e) {
        const choices: Choice[] = ['אבן', 'נייר', 'מספריים'];
        return choices[Math.floor(Math.random() * choices.length)];
    }
}
