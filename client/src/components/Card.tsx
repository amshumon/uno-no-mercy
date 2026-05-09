import React from 'react';
import { Card as CardType } from '../shared/types';

interface CardProps {
  card: CardType | null;
  onClick?: (card: CardType) => void;
  disabled?: boolean;
  className?: string;
}

export default function Card({ card, onClick, disabled, className = '' }: CardProps) {
  const getCardColor = (color: string | null) => {
    switch (color) {
      case 'red': return '#ff003c';
      case 'blue': return '#00d2ff';
      case 'green': return '#00ff87';
      case 'yellow': return '#ffcc00';
      default: return '#9d00ff';
    }
  };

  const getCardText = (type: string) => {
    if (type === 'number') return card?.value;
    const map: any = {
        'skip': 'SKIP',
        'reverse': 'REV',
        'draw_two': '+2',
        'wild': 'WILD',
        'wild_draw_four': '+4',
        'wild_draw_six': '+6',
        'wild_draw_ten': '+10',
        'skip_everyone': 'SKIP ALL',
        'discard_all': 'DISCARD',
        'wild_color_roulette': 'ROULETTE',
        'targeted_draw': 'TARGET +4',
        'swap_hands': 'SWAP',
        'steal_turn': 'STEAL',
        'bomb_card': 'BOMB'
    };
    return map[type] || type.toUpperCase();
  };

  const color = getCardColor(card?.color || null);
  const isBack = !card;

  return (
    <div 
      onClick={() => card && !disabled && onClick?.(card)}
      className={`
        relative w-24 h-36 md:w-32 md:h-48 rounded-2xl cursor-pointer transition-all duration-200 transform-gpu
        ${disabled ? 'opacity-40 grayscale pointer-events-none' : 'hover:scale-105 active:scale-95 shadow-lg'}
        ${className}
      `}
      style={{
        background: isBack ? '#1a1a1a' : '#0a0a0a',
        border: `2px solid ${isBack ? '#333' : color}`,
        boxShadow: !disabled && !isBack ? `0 0 10px ${color}33` : 'none',
        transform: 'translate3d(0,0,0)', // Hardware Acceleration
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="h-full flex flex-col items-center justify-center p-3 relative overflow-hidden">
        {isBack ? (
          <div className="w-12 h-12 rounded-full border-2 border-uno-accent flex items-center justify-center">
            <span className="text-2xl font-black text-uno-accent italic">!</span>
          </div>
        ) : (
          <>
            <div className="absolute top-1.5 left-1.5 text-[8px] md:text-[10px] font-black" style={{ color }}>{getCardText(card.type)}</div>
            <div className="absolute bottom-1.5 right-1.5 text-[8px] md:text-[10px] font-black rotate-180" style={{ color }}>{getCardText(card.type)}</div>
            <div className="text-2xl md:text-4xl font-black italic tracking-tighter text-center text-white" style={{ textShadow: `0 0 8px ${color}` }}>
              {getCardText(card.type)}
            </div>
            <div className="mt-2 text-[6px] font-bold text-white/10 tracking-widest uppercase">No Mercy</div>
          </>
        )}
      </div>
    </div>
  );
}
