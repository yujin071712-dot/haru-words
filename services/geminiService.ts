
import { GoogleGenAI, Type } from "@google/genai";
import { JapaneseWord, JLPTLevel } from "../types";

export async function fetchDailyWords(count: number, levels: JLPTLevel[], dateStr: string): Promise<JapaneseWord[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const levelsStr = levels.join(', ');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate exactly ${count} Japanese vocabulary words for JLPT levels: ${levelsStr}. 
      Use the seed date ${dateStr} to ensure variety. 
      Return the data strictly as a JSON array of objects. 
      Each object must have these exact fields:
      - id: unique string
      - kanji: string (kanji characters, or empty string if it's only kana)
      - hiragana: string (reading in hiragana)
      - meaning: string (Korean translation of the word)
      - exampleJp: string (A simple natural Japanese example sentence using the word)
      - exampleKr: string (Korean translation of the example sentence)
      - level: string (the JLPT level, one of ${levelsStr})`,
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

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    // Sometimes the model might wrap response in code blocks even with responseMimeType
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
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
      contents: "일본어 공부를 마친 사용자에게 전할 따뜻한 격려의 명언, 노래 가사, 혹은 짧은 일본어 대화를 하나 추천해주세요. '일본어 원문 - 한국어 뜻' 형식으로 한 문장으로 답변해 주세요.",
    });
    return response.text.trim();
  } catch (e) {
    return "継続は力なり (계속은 힘이다) - 지속하는 것이 힘이다.";
  }
}
