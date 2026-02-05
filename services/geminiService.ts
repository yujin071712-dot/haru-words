
import { GoogleGenAI, Type } from "@google/genai";
import { JapaneseWord, JLPTLevel } from "../types";

export async function fetchDailyWords(count: number, levels: JLPTLevel[], dateStr: string): Promise<JapaneseWord[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const levelsStr = levels.join(', ');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate exactly ${count} Japanese vocabulary words for levels: ${levelsStr}. 
      Seed date: ${dateStr}. 
      Return a JSON array where each object has:
      - id: unique string
      - kanji: string (or empty if none)
      - hiragana: string (reading)
      - meaning: string (Korean meaning)
      - exampleJp: string (Japanese example sentence)
      - exampleKr: string (Korean translation of example)
      - level: string (one of ${levelsStr})`,
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

    const text = response.text.trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini fetch error:", e);
    throw e;
  }
}

export async function fetchClosingQuote(): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "일본어 공부를 마친 학생에게 격려가 되는 짧은 일본어 명언이나 노래 가사, 대화문 하나를 추천해줘. '일본어 원문(한글 발음) - 한국어 뜻' 형식으로 한 문장으로 대답해줘.",
    });
    return response.text.trim();
  } catch (e) {
    return "継続は力なり (게이조쿠와 치카라나리) - 지속하는 것이 힘이다.";
  }
}
