
import React from 'react';
import { Choice } from '../types';

interface ChoiceButtonProps {
  choice: Choice;
  icon: string;
  onClick: (choice: Choice) => void;
  disabled?: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ choice, icon, onClick, disabled }) => {
  return (
    <button
      onClick={() => onClick(choice)}
      disabled={disabled}
      className={`
        w-full aspect-square flex flex-col items-center justify-center p-4 
        bg-white dark:bg-white/10 rounded-3xl border-2 border-slate-200 dark:border-white/20
        hover:border-indigo-500 dark:hover:border-indigo-400 active:scale-95 transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed group shadow-xl
        text-slate-900 dark:text-white
      `}
    >
      <span className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-lg font-extrabold tracking-tight">{choice}</span>
    </button>
  );
};

export default ChoiceButton;
