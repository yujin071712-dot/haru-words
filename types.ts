
export type JLPTLevel = 'N5' | 'N4' | 'N3';

export interface JapaneseWord {
  id: string;
  kanji: string;
  hiragana: string;
  meaning: string;
  exampleJp: string;
  exampleKr: string;
  level: JLPTLevel;
}

export interface DailyStudySession {
  date: string; // YYYY-MM-DD (KST)
  words: JapaneseWord[];
  completed: boolean;
  quote?: string;
}

export interface UserSettings {
  wordCount: number;
  difficulty: JLPTLevel[];
}

export type ViewState = 'study' | 'calendar' | 'test' | 'settings' | 'home' | 'finish' | 'kana-test';
