
import React from 'react';
import { Choice } from '../types';

interface HistoryLogProps {
  history: { user: Choice; computer: Choice; result: string }[];
  choiceIcons: Record<Choice, string>;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ history, choiceIcons }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-lg mt-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-700">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4 text-center">היסטוריית סיבובים</h3>
      
      <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {history.map((round, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 transition-all duration-300 ${index === 0 ? 'scale-[1.02] bg-white/10 border-white/20 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-2xl">{choiceIcons[round.user]}</span>
                <span className="text-[10px] font-bold opacity-40 uppercase">אתה</span>
              </div>
              <span className="text-white/20 italic font-black text-xs">VS</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl">{choiceIcons[round.computer]}</span>
                <span className="text-[10px] font-bold opacity-40 uppercase">מחשב</span>
              </div>
            </div>

            <div className={`px-4 py-1 rounded-full text-xs font-black shadow-inner ${
              round.result === 'ניצחון' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              round.result === 'הפסד' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-gray-500/20 text-gray-300 border border-gray-500/30'
            }`}>
              {round.result}
            </div>
          </div>
        ))}
      </div>
      
      {history.length > 5 && (
        <p className="text-[10px] text-center text-white/20 mt-3 font-bold uppercase tracking-widest">
          גלול למטה לראות סיבובים קודמים
        </p>
      )}
    </div>
  );
};

export default HistoryLog;
