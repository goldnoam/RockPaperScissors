
import React, { useState, useEffect, useCallback } from 'react';
import { Choice, GameState, SpecialRoundType } from './types';
import ChoiceButton from './components/ChoiceButton';
import HistoryLog from './components/HistoryLog';

const App: React.FC = () => {
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMounted, setIsMounted] = useState(false);
  const [state, setState] = useState<GameState>({
    userScore: 0,
    computerScore: 0,
    rounds: 0,
    lastResult: null,
    history: [],
    currentSpecial: null,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCycling, setIsCycling] = useState(false);
  const [cyclingIcon, setCyclingIcon] = useState('🎲');
  const [currentChoices, setCurrentChoices] = useState<{user: Choice | null, computer: Choice | null}>({user: null, computer: null});
  const [triggerShake, setTriggerShake] = useState(false);

  const choiceIcons: Record<Choice, string> = {
    'אבן': '🪨',
    'נייר': '📄',
    'מספריים': '✂️'
  };

  const specialInfo = {
    'DOUBLE': { title: 'סיבוב בונוס כפול!', desc: 'המנצח מקבל 2 נקודות', color: 'bg-yellow-500' },
    'REVERSE': { title: 'חוקים הפוכים!', desc: 'החלש מנצח את החזק', color: 'bg-purple-600' },
    'STEAL': { title: 'סיבוב שוד!', desc: 'המנצח גונב נקודה מהמפסיד', color: 'bg-red-600' }
  };

  useEffect(() => {
    setIsMounted(true);
    // Apply default dark theme
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const determineWinner = (user: Choice, computer: Choice, isReverse: boolean): 'ניצחון' | 'הפסד' | 'תיקו' => {
    if (user === computer) return 'תיקו';
    const winConditions = { 'אבן': 'מספריים', 'נייר': 'אבן', 'מספריים': 'נייר' };
    const userWinsStandard = winConditions[user] === computer;
    if (isReverse) return userWinsStandard ? 'הפסד' : 'ניצחון';
    return userWinsStandard ? 'ניצחון' : 'הפסד';
  };

  const handlePlay = useCallback(async (userChoice: Choice) => {
    if (isProcessing || isPaused) return;
    setIsProcessing(true);
    setCurrentChoices({ user: userChoice, computer: null });

    setIsCycling(true);
    const cycleInterval = setInterval(() => {
      const icons = Object.values(choiceIcons);
      setCyclingIcon(icons[Math.floor(Math.random() * icons.length)]);
    }, 80);

    // Challenging Computer Logic (Local to avoid API errors)
    let computerChoice: Choice;
    if (state.history.length > 2 && Math.random() > 0.4) {
        const counts = state.history.reduce((acc, curr) => {
            acc[curr.user] = (acc[curr.user] || 0) + 1;
            return acc;
        }, {} as Record<Choice, number>);
        const mostFreq = (Object.keys(counts) as Choice[]).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const counters: Record<Choice, Choice> = { 'אבן': 'נייר', 'נייר': 'מספריים', 'מספריים': 'אבן' };
        computerChoice = counters[mostFreq];
    } else {
        const choices: Choice[] = ['אבן', 'נייר', 'מספריים'];
        computerChoice = choices[Math.floor(Math.random() * choices.length)];
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    clearInterval(cycleInterval);
    setIsCycling(false);
    setCurrentChoices({ user: userChoice, computer: computerChoice });

    const activeSpecial = state.currentSpecial;
    const result = determineWinner(userChoice, computerChoice, activeSpecial === 'REVERSE');
    
    let userPoints = state.userScore;
    let computerPoints = state.computerScore;

    if (result === 'ניצחון') {
      if (activeSpecial === 'DOUBLE') userPoints += 2;
      else if (activeSpecial === 'STEAL') { userPoints += 1; computerPoints = Math.max(0, computerPoints - 1); }
      else userPoints += 1;
    } else if (result === 'הפסד') {
      if (activeSpecial === 'DOUBLE') computerPoints += 2;
      else if (activeSpecial === 'STEAL') { computerPoints += 1; userPoints = Math.max(0, userPoints - 1); }
      else computerPoints += 1;
    }

    setState(prev => ({
      ...prev,
      userScore: userPoints,
      computerScore: computerPoints,
      rounds: prev.rounds + 1,
      lastResult: result,
      history: [{ user: userChoice, computer: computerChoice, result }, ...prev.history],
      currentSpecial: (prev.rounds + 1) % 5 === 0 ? ['DOUBLE', 'REVERSE', 'STEAL'][Math.floor(Math.random() * 3)] as SpecialRoundType : null,
    }));
    
    if (activeSpecial) setTriggerShake(true);
    setTimeout(() => setTriggerShake(false), 500);
    setIsProcessing(false);
  }, [isProcessing, isPaused, state.history, state.userScore, state.computerScore, state.currentSpecial]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameActive || isProcessing || isPaused) return;
      // WASD Support: W for Rock, A for Paper, D for Scissors
      if (e.key === '1' || e.key.toLowerCase() === 'w') handlePlay('אבן');
      if (e.key === '2' || e.key.toLowerCase() === 'a') handlePlay('נייר');
      if (e.key === '3' || e.key.toLowerCase() === 'd') handlePlay('מספריים');
      if (e.key.toLowerCase() === 'p') setIsPaused(prev => !prev);
      if (e.key.toLowerCase() === 'r') resetGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameActive, isProcessing, isPaused, handlePlay]);

  const resetGame = () => {
    if (confirm('האם לאפס את כל הניקוד וההיסטוריה?')) {
      setState({ userScore: 0, computerScore: 0, rounds: 0, lastResult: null, history: [], currentSpecial: null });
      setCurrentChoices({ user: null, computer: null });
    }
  };

  const stopGame = () => {
    if (confirm('האם לצאת מהמשחק?')) {
      resetGame();
      setIsGameActive(false);
    }
  };

  const containerStyle = `transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  if (!isGameActive) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 text-center ${containerStyle}`}>
        <div className="absolute top-6 right-6">
          <button onClick={toggleTheme} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all text-2xl shadow-lg border border-white/20">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <div className="animate-fade-scale">
          <div className="flex justify-center gap-6 mb-8">
            <span className="text-7xl animate-float" style={{ animationDelay: '0s' }}>🪨</span>
            <span className="text-7xl animate-float" style={{ animationDelay: '0.5s' }}>📄</span>
            <span className="text-7xl animate-float" style={{ animationDelay: '1s' }}>✂️</span>
          </div>
          <h1 className="text-6xl font-extrabold mb-6 tracking-tighter drop-shadow-2xl text-indigo-600 dark:text-indigo-400">
            אלופי אבן נייר ומספריים
          </h1>
          <p className="text-xl opacity-80 mb-12 max-w-md mx-auto leading-relaxed">
            התחרות האולטימטיבית. נסה לנצח את אלגוריתם המחשב המתוחכם שלנו!
          </p>
          <button 
            onClick={() => setIsGameActive(true)}
            className="group relative px-12 py-5 bg-indigo-600 text-white dark:bg-white dark:text-indigo-900 rounded-full text-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-2xl overflow-hidden"
          >
            <span className="relative z-10">שחק עכשיו</span>
            <div className="absolute inset-0 bg-indigo-700 dark:bg-indigo-100 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </button>
        </div>
        <footer className="fixed bottom-6 text-sm opacity-50 font-bold tracking-tight">
           (C) Noam Gold AI 2025 | <a href="mailto:gold.noam@gmail.com" className="underline hover:opacity-100 transition-opacity">Send Feedback</a>
        </footer>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto px-4 py-12 min-h-screen flex flex-col transition-all duration-500 ${containerStyle} ${triggerShake ? 'animate-shake-intense' : ''}`}>
      <header className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex gap-3">
          <button onClick={stopGame} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-sm font-bold border border-red-500/30 transition-all">🛑 צא</button>
          <button onClick={() => setIsPaused(!isPaused)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isPaused ? 'bg-green-500/20 border-green-500/30' : 'bg-yellow-500/20 border-yellow-500/30'}`}>
            {isPaused ? '▶️ המשך' : '⏸️ השהה'}
          </button>
          <button onClick={resetGame} className="px-4 py-2 bg-slate-500/20 hover:bg-slate-500/40 rounded-xl text-sm font-bold border border-slate-500/30 transition-all">🔄 איפוס</button>
        </div>
        <h2 className="text-2xl font-black text-indigo-500 hidden sm:block">אלופי RPS</h2>
        <button onClick={toggleTheme} className="p-2 bg-white/10 dark:bg-white/5 rounded-xl hover:bg-white/20 transition-all text-xl border border-transparent dark:border-white/10">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
           <div className="text-center">
             <h2 className="text-6xl font-black mb-8 animate-pulse text-white">המשחק מושהה</h2>
             <button onClick={() => setIsPaused(false)} className="px-12 py-4 bg-white text-indigo-900 rounded-full text-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-transform">חזור למשחק</button>
           </div>
        </div>
      )}

      <div className="h-24 mb-4 relative z-10">
        {state.currentSpecial && (
            <div className={`w-full ${specialInfo[state.currentSpecial].color} p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-bounce border-2 border-white/40 text-white`}>
                <div>
                    <h3 className="text-2xl font-black tracking-tight">{specialInfo[state.currentSpecial].title}</h3>
                    <p className="text-sm font-medium opacity-90">{specialInfo[state.currentSpecial].desc}</p>
                </div>
                <span className="text-4xl">⚡</span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-200 dark:bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest opacity-60 mb-1">אתה</p>
          <p className="text-6xl font-black tracking-tighter">{state.userScore}</p>
        </div>
        <div className="flex flex-col items-center justify-center">
            <span className="text-2xl font-black opacity-30">VS</span>
            <div className="mt-2 px-4 py-1 bg-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
                סיבוב {state.rounds}
            </div>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest opacity-60 mb-1">מחשב</p>
          <p className="text-6xl font-black tracking-tighter">{state.computerScore}</p>
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center">
        <div className="h-48 mb-12 flex items-center justify-center w-full">
            {!currentChoices.user ? (
                <div className="text-center animate-pulse opacity-50">
                    <p className="text-2xl font-bold italic">בחר את המהלך שלך...</p>
                    <p className="text-xs mt-2 uppercase tracking-widest">(השתמש ב-W, A, D או 1, 2, 3)</p>
                </div>
            ) : (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-12 mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-8xl drop-shadow-xl">{choiceIcons[currentChoices.user]}</span>
                            <span className="mt-2 text-[10px] font-black uppercase opacity-50">אתה</span>
                        </div>
                        <div className="text-5xl font-black opacity-20 italic">X</div>
                        <div className="flex flex-col items-center">
                            <span className={`text-8xl drop-shadow-xl ${isCycling ? 'animate-bounce' : ''}`}>
                                {isCycling ? cyclingIcon : (currentChoices.computer ? choiceIcons[currentChoices.computer] : '🎲')}
                            </span>
                            <span className="mt-2 text-[10px] font-black uppercase opacity-50">מחשב</span>
                        </div>
                    </div>
                    {state.lastResult && !isCycling && (
                        <div className={`text-4xl font-black px-10 py-3 rounded-2xl border-b-8 shadow-xl transition-all duration-300 text-white ${
                            state.lastResult === 'ניצחון' ? 'bg-green-500 border-green-700 scale-105' :
                            state.lastResult === 'הפסד' ? 'bg-red-500 border-red-700' :
                            'bg-slate-500 border-slate-700'
                        }`}>
                            {state.lastResult}!
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="grid grid-cols-3 gap-6 w-full max-w-lg mb-12">
            {(['אבן', 'נייר', 'מספריים'] as Choice[]).map((c, i) => {
                const keys = ['W', 'A', 'D'];
                return (
                    <div key={c} className="flex flex-col items-center">
                        <ChoiceButton choice={c} icon={choiceIcons[c]} onClick={handlePlay} disabled={isProcessing || isPaused} />
                        <span className="mt-2 text-[10px] font-black opacity-40 uppercase tracking-widest">מפתח: {keys[i]} / {i+1}</span>
                    </div>
                );
            })}
        </div>

        <HistoryLog history={state.history} choiceIcons={choiceIcons} />
      </main>

      <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-slate-300 dark:border-white/10 pt-8 relative z-10 gap-4">
        <div className="text-center sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">(C) Noam Gold AI 2025</p>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
             Send Feedback <a href="mailto:gold.noam@gmail.com" className="underline hover:opacity-100 transition-opacity">gold.noam@gmail.com</a>
          </p>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-30 text-center sm:text-left">
            מנוע משחק מקומי לביצועים מקסימליים
        </div>
      </footer>
    </div>
  );
};

export default App;
