
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  Home,
  BrainCircuit,
  Loader2,
  Eye,
  Type as TypeIcon,
  RotateCcw
} from 'lucide-react';
import { ViewState, JapaneseWord, UserSettings, DailyStudySession, JLPTLevel } from './types';
import { getKSTDateString, formatDate } from './utils/dateUtils';
import { fetchDailyWords, fetchClosingQuote } from './services/geminiService';

// --- 데이터: 발음을 영어(Romaji)로 수정 ---
const HIRAGANA = [
  ['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o'],
  ['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko'],
  ['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so'],
  ['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to'],
  ['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no'],
  ['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho'],
  ['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo'],
  ['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo'],
  ['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro'],
  ['わ', 'wa'], ['を', 'wo'], ['ん', 'n']
];

const KATAKANA = [
  ['ア', 'a'], ['イ', 'i'], ['ウ', 'u'], ['エ', 'e'], ['オ', 'o'],
  ['カ', 'ka'], ['キ', 'ki'], ['ク', 'ku'], ['ケ', 'ke'], ['コ', 'ko'],
  ['サ', 'sa'], ['シ', 'shi'], ['스', 'su'], ['セ', 'se'], ['ソ', 'so'],
  ['タ', 'ta'], ['チ', 'chi'], ['ツ', 'tsu'], ['テ', 'te'], ['ト', 'to'],
  ['ナ', 'na'], ['ニ', 'ni'], ['ヌ', 'nu'], ['ネ', 'ne'], ['ノ', '노'],
  ['ハ', 'ha'], ['ヒ', 'hi'], ['フ', 'fu'], ['ヘ', 'he'], ['ホ', 'ho'],
  ['マ', 'ma'], ['ミ', 'mi'], ['ム', 'mu'], ['メ', 'me'], ['モ', 'mo'],
  ['ヤ', 'ya'], ['ユ', 'yu'], ['ヨ', 'yo'],
  ['ラ', 'ra'], ['リ', 'ri'], ['ル', 'ru'], ['レ', 're'], ['ロ', 'ro'],
  ['ワ', 'wa'], ['ヲ', 'wo'], ['ン', 'n']
];

// --- 컴포넌트: 네비바 ---
const Navbar: React.FC<{ currentView: ViewState; setView: (v: ViewState) => void }> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'study', icon: BookOpen, label: '학습' },
    { id: 'kana-test', icon: TypeIcon, label: '가나' },
    { id: 'calendar', icon: CalendarIcon, label: '기록' },
    { id: 'settings', icon: SettingsIcon, label: '설정' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:flex-col md:w-20 md:h-screen md:border-r md:border-t-0">
      <div className="hidden md:flex flex-col items-center mb-8 mt-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">日</div>
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id || (item.id === 'study' && (currentView === 'finish' || currentView === 'test'));
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon size={24} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// --- 컴포넌트: 가나 테스트 (영어 발음 기준) ---
const KanaTestView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [questions, setQuestions] = useState<string[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const startTest = (mode: 'hiragana' | 'katakana' | 'both') => {
    let pool = mode === 'hiragana' ? [...HIRAGANA] : mode === 'katakana' ? [...KATAKANA] : [...HIRAGANA, ...KATAKANA];
    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 15);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setIsStarted(true);
  };

  const handleNext = () => {
    const answer = userInput.trim().toLowerCase();
    const correct = questions[currentIndex][1].toLowerCase();
    
    if (answer === correct) setScore(s => s + 1);
    setShowResult(true);
    
    setTimeout(() => {
      setShowResult(false);
      setUserInput('');
      if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
      else setIsFinished(true);
    }, 800);
  };

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-800">가나 테스트</h2>
          <p className="text-slate-500">영어 발음(Romaji)으로 문자를 맞춰보세요!</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => startTest('hiragana')} className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center group">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">あ</span>
            <span className="font-bold text-slate-700">히라가나</span>
          </button>
          <button onClick={() => startTest('katakana')} className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center group">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">ア</span>
            <span className="font-bold text-slate-700">가타카나</span>
          </button>
          <button onClick={() => startTest('both')} className="p-8 bg-indigo-600 text-white rounded-3xl shadow-lg hover:bg-indigo-700 transition-all flex flex-col items-center">
            <span className="text-4xl mb-4">あア</span>
            <span className="font-bold">전체 랜덤</span>
          </button>
        </div>
        <button onClick={onBack} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600">돌아가기</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center py-10 animate-fade-in">
        <h2 className="text-3xl font-bold">테스트 종료</h2>
        <p className="text-xl text-slate-600">점수: <span className="text-indigo-600 font-bold">{score}</span> / {questions.length}</p>
        <div className="flex gap-4">
          <button onClick={() => setIsStarted(false)} className="px-8 py-3 bg-white border border-slate-200 rounded-full font-bold">다시 선택</button>
          <button onClick={onBack} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold">홈으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-xl border border-slate-100 animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => setIsStarted(false)} className="text-slate-400 hover:text-slate-600"><ChevronLeft size={28} /></button>
        <span className="text-sm font-bold text-slate-400">{currentIndex + 1} / {questions.length}</span>
      </div>
      <div className="text-center mb-12">
        <h3 className="text-9xl font-black japanese-text text-slate-800">{questions[currentIndex][0]}</h3>
      </div>
      <div className="space-y-4">
        <input 
          type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={showResult}
          placeholder="Enter Romaji (e.g., a, ka, sa)" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 focus:outline-none text-xl text-center font-mono"
          onKeyDown={(e) => e.key === 'Enter' && handleNext()} autoFocus
        />
        {showResult && (
          <div className={`p-4 rounded-xl text-center font-bold ${userInput.trim().toLowerCase() === questions[currentIndex][1].toLowerCase() ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            Correct: {questions[currentIndex][1]}
          </div>
        )}
      </div>
    </div>
  );
};

// --- 컴포넌트: 단어 테스트 ---
const WordTestView: React.FC<{ session: DailyStudySession; onBack: () => void }> = ({ session, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleNext = () => {
    if (userInput.trim() && session.words[currentIndex].meaning.includes(userInput.trim())) setScore(s => s + 1);
    setShowResult(true);
    setTimeout(() => {
      setShowResult(false);
      setUserInput('');
      if (currentIndex < session.words.length - 1) setCurrentIndex(i => i + 1);
      else setIsFinished(true);
    }, 1200);
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center py-10 animate-fade-in">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4"><BrainCircuit size={40} /></div>
        <h2 className="text-3xl font-bold">복습 완료!</h2>
        <p className="text-xl text-slate-600">점수: <span className="text-indigo-600 font-bold">{score}</span> / {session.words.length}</p>
        <button onClick={onBack} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold">기록으로 돌아가기</button>
      </div>
    );
  }

  const word = session.words[currentIndex];
  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-xl border border-slate-100 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ChevronLeft size={28} /></button>
        <span className="text-sm font-semibold text-slate-400">{currentIndex + 1} / {session.words.length}</span>
      </div>
      <div className="text-center mb-10">
        <h3 className="text-6xl font-bold japanese-text mb-2 text-slate-800">{word.kanji || word.hiragana}</h3>
        <p className="text-slate-400 text-lg japanese-text">{word.hiragana}</p>
      </div>
      <div className="space-y-4">
        <input 
          type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={showResult}
          placeholder="한국어 뜻 입력..." className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 focus:outline-none text-lg"
          onKeyDown={(e) => e.key === 'Enter' && handleNext()} autoFocus
        />
        {showResult && (
          <div className={`p-4 rounded-xl text-center font-bold ${word.meaning.includes(userInput.trim()) ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            정답: {word.meaning}
          </div>
        )}
      </div>
    </div>
  );
};

// --- 컴포넌트: 달력 뷰 ---
const CalendarView: React.FC<{ history: Record<string, DailyStudySession>; onSelectDate: (date: string) => void }> = ({ history, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const dayElements = [];
  for (let i = 0; i < firstDay; i++) dayElements.push(<div key={`empty-${i}`} className="h-14 md:h-20" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const studySession = history[dateStr];
    const isToday = getKSTDateString() === dateStr;
    dayElements.push(
      <button
        key={d} onClick={() => studySession && onSelectDate(dateStr)} disabled={!studySession}
        className={`relative h-14 md:h-20 border border-slate-100 flex flex-col items-center justify-center rounded-lg transition-all ${studySession ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-white'} ${isToday ? 'ring-2 ring-indigo-600' : ''}`}
      >
        <span className={`text-sm ${studySession ? 'font-bold text-indigo-700' : 'text-slate-600'}`}>{d}</span>
        {studySession?.completed && <CheckCircle size={12} className="text-green-500 mt-1" />}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-slate-800">{year}년 {month + 1}월</h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (<div key={day} className="text-center text-xs font-semibold text-slate-400 mb-2">{day}</div>))}
        {dayElements}
      </div>
      <p className="mt-6 text-sm text-center text-slate-400 italic">공부한 날짜를 누르면 복습 테스트가 시작됩니다.</p>
    </div>
  );
};

// --- 메인 앱 ---
export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Record<string, DailyStudySession>>({});
  const [settings, setSettings] = useState<UserSettings>({ wordCount: 20, difficulty: ['N5', 'N4', 'N3'] });
  const [currentSession, setCurrentSession] = useState<DailyStudySession | null>(null);
  const [testSession, setTestSession] = useState<DailyStudySession | null>(null);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('komorebi_history');
    const savedSettings = localStorage.getItem('komorebi_settings');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => { localStorage.setItem('komorebi_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('komorebi_settings', JSON.stringify(settings)); }, [settings]);

  const startDailyStudy = async () => {
    const today = getKSTDateString();
    setLoading(true);
    try {
      if (history[today]) {
        setCurrentSession(history[today]);
      } else {
        const words = await fetchDailyWords(settings.wordCount, settings.difficulty, today);
        const newSession: DailyStudySession = { date: today, words, completed: false };
        setHistory(prev => ({ ...prev, [today]: newSession }));
        setCurrentSession(newSession);
      }
      setCurrentWordIdx(0);
      setIsRevealed(false);
      setView('study');
    } catch (err) {
      alert("데이터를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const completeStudy = async () => {
    if (!currentSession) return;
    setLoading(true);
    try {
      const quote = await fetchClosingQuote();
      const updatedSession = { ...currentSession, completed: true, quote };
      setHistory(prev => ({ ...prev, [currentSession.date]: updatedSession }));
      setCurrentSession(updatedSession);
      setView('finish');
    } catch (err) {
      setView('finish');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
          <p className="text-slate-500 font-medium animate-pulse">데이터를 불러오는 중...</p>
        </div>
      );
    }

    switch (view) {
      case 'home':
        const today = getKSTDateString();
        const hasStudiedToday = history[today]?.completed;
        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <header className="text-center md:text-left space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">하루 일본어</h1>
              <p className="text-slate-500 text-lg">기초부터 탄탄하게, 매일 성장하는 즐거움</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[32px] p-8 text-white shadow-xl flex flex-col justify-between min-h-[240px]">
                <div><h2 className="text-3xl font-black mb-1">{formatDate(today)}</h2><p className="opacity-80 font-medium">오늘의 단어: {settings.wordCount}개</p></div>
                <button onClick={startDailyStudy} className="mt-8 bg-white text-indigo-700 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all active:scale-95 shadow-lg">
                  {hasStudiedToday ? '오늘의 학습 복습하기' : '오늘의 학습 시작'}
                </button>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center"><CalendarIcon size={32} /></div>
                <div><p className="text-slate-400 text-sm font-black uppercase">누적 학습</p><p className="text-5xl font-black text-slate-800">{Object.keys(history).length}<span className="text-lg ml-1 opacity-40">일</span></p></div>
                <button onClick={() => setView('calendar')} className="text-indigo-600 font-bold hover:underline">기록 보기</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setView('kana-test')} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><TypeIcon size={32} /></div>
                <div className="text-left"><h3 className="text-xl font-black text-slate-800">가나 테스트</h3><p className="text-slate-500 text-sm">영어(Romaji) 발음 연습</p></div>
              </button>
              <button onClick={() => Object.keys(history).length > 0 ? setView('calendar') : alert('학습 기록이 없습니다.')} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><BrainCircuit size={32} /></div>
                <div className="text-left"><h3 className="text-xl font-black text-slate-800">단어 테스트</h3><p className="text-slate-500 text-sm">공부했던 단어들 복습하기</p></div>
              </button>
            </div>
          </div>
        );

      case 'study':
        if (!currentSession) return null;
        const currentWord = currentSession.words[currentWordIdx];
        return (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between px-2">
              <button onClick={() => setView('home')} className="text-slate-400 hover:text-slate-600"><ChevronLeft size={24} /></button>
              <span className="text-sm font-bold text-slate-400">{currentWordIdx + 1} / {currentSession.words.length}</span>
              <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[120px]">
                 {currentSession.words.map((_, i) => (<div key={i} className={`h-1.5 w-2 flex-shrink-0 rounded-full transition-all ${i === currentWordIdx ? 'bg-indigo-600 w-4' : 'bg-slate-200'}`} />))}
              </div>
            </div>
            <div onClick={() => setIsRevealed(!isRevealed)} className={`bg-white rounded-[40px] p-8 md:p-12 shadow-2xl transition-all duration-300 cursor-pointer border-2 min-h-[480px] flex flex-col items-center justify-center text-center select-none ${isRevealed ? 'border-indigo-100' : 'border-transparent'}`}>
              <div className="space-y-6 w-full">
                <div className="space-y-2">
                   <div className="text-indigo-500 font-bold text-xs uppercase tracking-widest">{currentWord.level}</div>
                   <h2 className="text-6xl md:text-8xl font-black japanese-text text-slate-800">{currentWord.kanji || currentWord.hiragana}</h2>
                   <p className="text-2xl text-slate-400 japanese-text">{currentWord.hiragana}</p>
                </div>
                <div className="h-px bg-slate-100 w-1/2 mx-auto my-4" />
                <div className={`transition-all duration-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 h-0 overflow-hidden'}`}>
                  <p className="text-4xl font-black text-slate-800 mb-6">{currentWord.meaning}</p>
                  <div className="bg-slate-50 p-6 rounded-3xl text-left border border-slate-100">
                    <p className="text-xs text-slate-400 font-black uppercase mb-2">Example</p>
                    <p className="text-lg text-slate-700 japanese-text font-medium leading-relaxed">{currentWord.exampleJp}</p>
                    <p className="text-slate-500">{currentWord.exampleKr}</p>
                  </div>
                </div>
                {!isRevealed && <div className="flex flex-col items-center gap-2 text-indigo-400 font-bold animate-bounce mt-4"><Eye size={24} /><p className="text-sm">클릭해서 정답 보기</p></div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setCurrentWordIdx(prev => Math.max(0, prev - 1)); setIsRevealed(false); }} disabled={currentWordIdx === 0} className="py-5 rounded-2xl font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-30">이전</button>
              {currentWordIdx === currentSession.words.length - 1 ? (
                <button onClick={completeStudy} className="py-5 rounded-2xl font-black bg-indigo-600 text-white shadow-lg">학습 완료</button>
              ) : (
                <button onClick={() => { setCurrentWordIdx(prev => prev + 1); setIsRevealed(false); }} className="py-5 rounded-2xl font-black bg-indigo-600 text-white shadow-lg">다음</button>
              )}
            </div>
          </div>
        );

      case 'finish':
        return (
          <div className="max-w-2xl mx-auto text-center space-y-10 py-10 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-4"><CheckCircle size={40} /></div>
              <h2 className="text-4xl font-black text-slate-800">학습 완료!</h2>
              <p className="text-slate-500 text-lg font-medium">오늘의 목표를 달성했습니다.</p>
            </div>
            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 relative overflow-hidden text-center">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-30" />
               <p className="text-slate-400 text-xs font-black uppercase mb-6 tracking-widest">Today's Quote</p>
               <p className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed japanese-text">"{currentSession?.quote || "継続は力なり (계속은 힘이다) - 지속하는 것이 힘이다."}"</p>
            </div>
            <button onClick={() => setView('home')} className="px-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xl hover:bg-indigo-700 shadow-xl transition-all">홈으로 돌아가기</button>
          </div>
        );

      case 'calendar':
        return <CalendarView history={history} onSelectDate={(date) => { setTestSession(history[date]); setView('test'); }} />;

      case 'test':
        return testSession ? <WordTestView session={testSession} onBack={() => setView('calendar')} /> : null;

      case 'kana-test':
        return <KanaTestView onBack={() => setView('home')} />;

      case 'settings':
        return (
          <div className="max-w-2xl mx-auto bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100 space-y-12 animate-fade-in">
            <h2 className="text-3xl font-black text-slate-800">학습 설정</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-end"><label className="text-sm font-black text-slate-500 uppercase">하루 학습량</label><span className="text-3xl font-black text-indigo-600">{settings.wordCount}개</span></div>
              <input type="range" min="10" max="100" step="10" value={settings.wordCount} onChange={(e) => setSettings(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))} className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600" />
            </div>
            <div className="space-y-6">
              <label className="block text-sm font-black text-slate-500 uppercase">JLPT 목표 등급</label>
              <div className="grid grid-cols-3 gap-4">
                {(['N5', 'N4', 'N3'] as JLPTLevel[]).map(level => (
                  <button key={level} onClick={() => setSettings(prev => ({ ...prev, difficulty: prev.difficulty.includes(level) ? (prev.difficulty.length > 1 ? prev.difficulty.filter(l => l !== level) : prev.difficulty) : [...prev.difficulty, level] }))} className={`py-5 rounded-2xl font-black text-xl border-2 transition-all ${settings.difficulty.includes(level) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-100 text-slate-300'}`}>{level}</button>
                ))}
              </div>
            </div>
            <div className="pt-8 text-center border-t border-slate-50"><button onClick={() => setView('home')} className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold">저장 및 나가기</button></div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 pb-24 md:pb-8 md:pl-20">
      <Navbar currentView={view} setView={setView} />
      <main className="p-4 md:p-10 max-w-7xl mx-auto">{renderContent()}</main>
    </div>
  );
}
