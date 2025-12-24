
import React, { useState, useEffect } from 'react';
import { Choice, GameState, GeminiCommentary, SpecialRoundType } from './types';
import ChoiceButton from './components/ChoiceButton';
import HistoryLog from './components/HistoryLog';
import { getGeminiCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [isGameActive, setIsGameActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [state, setState] = useState<GameState>({
    userScore: 0,
    computerScore: 0,
    rounds: 0,
    lastResult: null,
    history: [],
    currentSpecial: null,
  });
  
  const [commentary, setCommentary] = useState<GeminiCommentary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCycling, setIsCycling] = useState(false);
  const [cyclingIcon, setCyclingIcon] = useState('🎲');
  const [currentChoices, setCurrentChoices] = useState<{user: Choice | null, computer: Choice | null}>({user: null, computer: null});
  const [triggerShake, setTriggerShake] = useState(false);
  const [flashType, setFlashType] = useState<'normal' | 'special'>('normal');

  const choiceIcons: Record<Choice, string> = {
    'אבן': '🪨',
    'נייר': '📄',
    'מספריים': '✂️'
  };

  const specialInfo = {
    'DOUBLE': { title: 'סיבוב בונוס כפול!', desc: 'המנצח מקבל 2 נקודות', color: 'bg-yellow-500', flashColor: 'rgba(255, 255, 0, 0.4)' },
    'REVERSE': { title: 'חוקים הפוכים!', desc: 'החלש מנצח את החזק', color: 'bg-purple-600', flashColor: 'rgba(168, 85, 247, 0.4)' },
    'STEAL': { title: 'סיבוב שוד!', desc: 'המנצח גונב נקודה מהמפסיד', color: 'bg-red-600', flashColor: 'rgba(220, 38, 38, 0.4)' }
  };

  // Trigger mount animation
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check for special round every few rounds
  useEffect(() => {
    if (isGameActive && state.rounds > 0 && state.rounds % 4 === 0 && !state.currentSpecial && !isProcessing) {
      const types: SpecialRoundType[] = ['DOUBLE', 'REVERSE', 'STEAL'];
      const selected = types[Math.floor(Math.random() * types.length)];
      
      setFlashType('special');
      setTriggerShake(true);
      
      setTimeout(() => {
        setState(prev => ({ ...prev, currentSpecial: selected }));
        setTriggerShake(false);
        setFlashType('normal');
      }, 600);
    }
  }, [state.rounds, isProcessing, state.currentSpecial, isGameActive]);

  const determineWinner = (user: Choice, computer: Choice, isReverse: boolean): 'ניצחון' | 'הפסד' | 'תיקו' => {
    if (user === computer) return 'תיקו';
    const winConditions = { 'אבן': 'מספריים', 'נייר': 'אבן', 'מספריים': 'נייר' };
    const userWinsStandard = winConditions[user] === computer;
    if (isReverse) return userWinsStandard ? 'הפסד' : 'ניצחון';
    return userWinsStandard ? 'ניצחון' : 'הפסד';
  };

  const handlePlay = async (userChoice: Choice) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setCommentary(null);
    setCurrentChoices({ user: userChoice, computer: null });

    setIsCycling(true);
    const cycleInterval = setInterval(() => {
      const icons = Object.values(choiceIcons);
      setCyclingIcon(icons[Math.floor(Math.random() * icons.length)]);
    }, 80);

    // Local Logic for Computer Move (No AI call here to avoid lag)
    const choices: Choice[] = ['אבן', 'נייר', 'מספריים'];
    // Simple logic: 70% random, 30% countering user's most frequent move if history exists
    let computerChoice: Choice;
    if (state.history.length > 2 && Math.random() > 0.7) {
        const counts = state.history.reduce((acc, curr) => {
            acc[curr.user] = (acc[curr.user] || 0) + 1;
            return acc;
        }, {} as Record<Choice, number>);
        const mostFreq = (Object.keys(counts) as Choice[]).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const counters: Record<Choice, Choice> = { 'אבן': 'נייר', 'נייר': 'מספריים', 'מספריים': 'אבן' };
        computerChoice = counters[mostFreq];
    } else {
        computerChoice = choices[Math.floor(Math.random() * choices.length)];
    }

    // Wait only for the animation duration
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

    const newState = {
      ...state,
      userScore: userPoints,
      computerScore: computerPoints,
      rounds: state.rounds + 1,
      lastResult: result,
      history: [{ user: userChoice, computer: computerChoice, result }, ...state.history].slice(0, 10),
      currentSpecial: null,
    };

    setState(newState);
    setIsProcessing(false);

    // Commentary is still AI but fetched in background
    getGeminiCommentary(userChoice, computerChoice, result, newState.userScore, newState.computerScore, activeSpecial)
      .then(comm => setCommentary(comm))
      .catch(() => {});
  };

  const resetGame = () => {
    setState({ userScore: 0, computerScore: 0, rounds: 0, lastResult: null, history: [], currentSpecial: null });
    setCommentary(null);
    setCurrentChoices({ user: null, computer: null });
  };

  const stopGame = () => {
    if (confirm('האם אתה בטוח שברצונך להפסיק את המשחק?')) {
      resetGame();
      setIsGameActive(false);
    }
  };

  // Main container style with fade-in
  const containerStyle = `transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  if (!isGameActive) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 text-center ${containerStyle}`}>
        <div className="animate-fade-scale">
          <div className="flex justify-center gap-6 mb-8">
            <span className="text-7xl animate-float" style={{ animationDelay: '0s' }}>🪨</span>
            <span className="text-7xl animate-float" style={{ animationDelay: '0.5s' }}>📄</span>
            <span className="text-7xl animate-float" style={{ animationDelay: '1s' }}>✂️</span>
          </div>
          <h1 className="text-6xl font-black mb-6 tracking-tighter drop-shadow-2xl">
            אלופי אבן נייר ומספריים
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-md mx-auto leading-relaxed">
            התחרות האולטימטיבית. האם יש לך את מה שצריך כדי לנצח את המחשב?
          </p>
          <button 
            onClick={() => setIsGameActive(true)}
            className="group relative px-12 py-5 bg-white text-indigo-900 rounded-full text-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-2xl overflow-hidden"
          >
            <span className="relative z-10">התחל משחק</span>
            <div className="absolute inset-0 bg-indigo-100 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto px-4 py-12 min-h-screen flex flex-col transition-all duration-500 ${containerStyle} ${state.currentSpecial ? 'bg-black/40' : ''} ${triggerShake ? 'animate-shake-intense' : ''}`}>
      {triggerShake && (
        <div 
          className="fixed inset-0 z-50 pointer-events-none animate-flash-intense flex items-center justify-center"
          style={{ backgroundColor: flashType === 'special' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}
        >
          {flashType === 'special' && (
             <div className="text-6xl font-black text-indigo-950 uppercase tracking-widest transform -rotate-6 scale-150">
               סיבוב מיוחד!
             </div>
          )}
        </div>
      )}

      {state.currentSpecial && (
        <div className={`fixed inset-0 pointer-events-none z-0 animate-pulse-bg ${specialInfo[state.currentSpecial].color} mix-blend-overlay`} />
      )}

      <header className="flex items-center justify-between mb-8 relative z-10">
        <button 
          onClick={stopGame}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-sm font-bold border border-red-500/30 transition-all flex items-center gap-2"
        >
          <span>🛑</span> עצור משחק
        </button>
        <div className="text-center flex-grow">
          <h1 className="text-3xl font-black tracking-tight drop-shadow-md">אלופי אבן נייר ומספריים</h1>
        </div>
        <div className="w-24"></div>
      </header>

      <div className="h-24 mb-4 overflow-hidden relative z-10">
        {state.currentSpecial && (
            <div className={`w-full ${specialInfo[state.currentSpecial].color} p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-bounce border-2 border-white/40`}>
                <div>
                    <h3 className="text-2xl font-black tracking-tight animate-glitch" data-text={specialInfo[state.currentSpecial].title}>
                      {specialInfo[state.currentSpecial].title}
                    </h3>
                    <p className="text-sm font-medium opacity-90">{specialInfo[state.currentSpecial].desc}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-4xl">⚡</span>
                  <span className="text-[10px] font-black uppercase">Active</span>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden z-10">
        <div className="text-center z-10">
          <p className="text-sm uppercase tracking-widest text-white/60 mb-1">אתה</p>
          <p className="text-6xl font-black tracking-tighter">{state.userScore}</p>
        </div>
        <div className="flex flex-col items-center justify-center z-10">
            <span className="text-2xl font-black opacity-30 italic">VS</span>
            <div className="mt-2 px-4 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-tighter">
                סיבוב {state.rounds}
            </div>
        </div>
        <div className="text-center z-10">
          <p className="text-sm uppercase tracking-widest text-white/60 mb-1">מחשב</p>
          <p className="text-6xl font-black tracking-tighter">{state.computerScore}</p>
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center relative z-10">
        <div className="h-48 mb-12 flex items-center justify-center w-full">
            {!currentChoices.user ? (
                <div className="text-center space-y-2 animate-pulse">
                    <p className="text-2xl font-semibold opacity-70 italic">ממתין למהלך שלך...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-12 mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-8xl drop-shadow-lg scale-110">{choiceIcons[currentChoices.user]}</span>
                            <span className="mt-2 text-xs font-black uppercase opacity-50 tracking-widest">אתה</span>
                        </div>
                        <div className="text-5xl font-black text-white/20 italic">X</div>
                        <div className="flex flex-col items-center">
                            <span className={`text-8xl drop-shadow-lg scale-110 transition-transform ${isCycling ? 'animate-bounce' : ''}`}>
                                {isCycling ? cyclingIcon : (currentChoices.computer ? choiceIcons[currentChoices.computer] : '🎲')}
                            </span>
                            <span className="mt-2 text-xs font-black uppercase opacity-50 tracking-widest">מחשב</span>
                        </div>
                    </div>
                    {state.lastResult && !isCycling && (
                        <div className={`text-4xl font-black px-10 py-3 rounded-2xl border-b-8 shadow-xl transform rotate-1 transition-all duration-300 ${
                            state.lastResult === 'ניצחון' ? 'bg-green-500 border-green-700 scale-105' :
                            state.lastResult === 'הפסד' ? 'bg-red-500 border-red-700 scale-95' :
                            'bg-gray-600 border-gray-800'
                        }`}>
                            {state.lastResult}!
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
            {(['אבן', 'נייר', 'מספריים'] as Choice[]).map((c) => (
                <ChoiceButton key={c} choice={c} icon={choiceIcons[c]} onClick={handlePlay} disabled={isProcessing} />
            ))}
        </div>

        {commentary && (
            <div className="mt-12 bg-white text-indigo-950 rounded-3xl p-6 shadow-2xl relative max-w-xl text-center animate-in slide-in-from-bottom duration-500 border-t-4 border-indigo-500">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase shadow-lg">
                    הפרשנות של ג'מיני
                </div>
                <p className="text-xl font-bold mb-2 leading-tight">"{commentary.message}"</p>
                <p className="text-indigo-600 italic font-medium opacity-80">"{commentary.taunt}"</p>
            </div>
        )}

        <HistoryLog history={state.history} choiceIcons={choiceIcons} />
      </main>

      <footer className="mt-12 flex items-center justify-between border-t border-white/10 pt-8 relative z-10">
        <button 
            onClick={resetGame}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-black transition-all border border-white/10 hover:scale-105 active:scale-95"
        >
            איפוס סיבובים
        </button>
        <div className="text-xs font-black uppercase tracking-widest opacity-30">
            גרסה מהירה ללא השהייה
        </div>
      </footer>
    </div>
  );
};

export default App;
