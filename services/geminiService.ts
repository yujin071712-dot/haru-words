
import { GoogleGenAI, Type } from "@google/genai";
import { JapaneseWord, JLPTLevel } from "../types";

export async function fetchDailyWords(count: number, levels: JLPTLevel[], dateStr: string): Promise<JapaneseWord[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const levelsStr = levels.join(', ');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate ${count} Japanese vocabulary words for levels: ${levelsStr}. 
      Today's unique seed date is ${dateStr}. 
      Each word must have Kanji (if applicable, otherwise empty string), Hiragana reading, Korean meaning, and one Japanese example sentence with its Korean translation.
      Ensure words are appropriate for JLPT ${levelsStr}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              kanji: { type: Type.STRING },
              hiragana: { type: Type.STRING },
              meaning: { type: Type.STRING },
              exampleJp: { type: Type.STRING },
              exampleKr: { type: Type.STRING },
              level: { type: Type.STRING }
            },
            required: ["id", "kanji", "hiragana", "meaning", "exampleJp", "exampleKr", "level"]
          }
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to fetch words from Gemini", e);
    throw e;
  }
}

export async function fetchClosingQuote(): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "오늘의 일본어 공부를 마친 사용자에게 전할 따뜻한 일본어 명언, 노래 가사, 혹은 일상 대화 문장 중 하나를 추천해줘. 일본어 원문(한자+후리가나)과 한국어 뜻을 같이 포함해서 한 문장으로 답변해줘.",
    });
    return response.text.trim();
  } catch (e) {
    console.error("Failed to fetch quote", e);
    return "지속하는 것이 힘이다. (継続は力なり)";
  }
}
