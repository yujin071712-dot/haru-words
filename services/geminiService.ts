
import { GoogleGenAI, Type } from "@google/genai";
import { JapaneseWord, JLPTLevel } from "../types";

export async function fetchDailyWords(count: number, levels: JLPTLevel[], dateStr: string): Promise<JapaneseWord[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const levelsStr = levels.join(', ');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate exactly ${count} Japanese vocabulary words for JLPT levels: ${levelsStr}. 
      Use the unique seed date ${dateStr} for content variety. 
      The response must be a valid JSON array of objects. 
      Each object must contain these fields:
      - id: string
      - kanji: string (kanji characters, or empty string if only kana)
      - hiragana: string (reading in hiragana)
      - meaning: string (Korean meaning)
      - exampleJp: string (Japanese example sentence)
      - exampleKr: string (Korean translation of the example sentence)
      - level: string (one of ${levelsStr})
      
      CRITICAL: Ensure the JSON is properly formatted and does not contain extra text.`,
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

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No text returned from Gemini API");
    }

    // Clean up potential markdown formatting if model ignores responseMimeType
    const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);
    
    if (!Array.isArray(parsedData)) {
      throw new Error("Parsed data is not an array");
    }
    
    return parsedData;
  } catch (e) {
    console.error("Gemini service error detail:", e);
    throw e;
  }
}

export async function fetchClosingQuote(): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "오늘 공부를 마친 사용자에게 들려줄 일본어 명언이나 노래 가사, 대화문을 하나 추천해주세요. '일본어 문장 - 한국어 해석' 형식으로 답변해 주세요.",
    });
    return response.text.trim();
  } catch (e) {
    return "継続は力なり (계속은 힘이다) - 지속하는 것이 힘이다.";
  }
}
