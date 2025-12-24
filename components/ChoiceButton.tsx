
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
        flex flex-col items-center justify-center p-6 bg-white/10 rounded-2xl border-2 border-white/20
        hover:bg-white/20 hover:border-white/40 active:scale-95 transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed group
      `}
    >
      <span className="text-6xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xl font-bold">{choice}</span>
    </button>
  );
};

export default ChoiceButton;
