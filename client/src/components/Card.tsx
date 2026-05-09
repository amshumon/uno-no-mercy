import React from 'react';
import type { Card as CardTypeT } from '../shared/types';

interface CardProps {
  card: CardTypeT | null;
  onClick?: (card: CardTypeT) => void;
  disabled?: boolean;
  className?: string;
  isUnplayable?: boolean;
}

export default function Card({ card, onClick, disabled, className = '', isUnplayable }: CardProps) {
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
      onClick={() => card && onClick?.(card)}
      className={`
        relative w-24 h-36 md:w-32 md:h-48 rounded-2xl cursor-pointer transition-all duration-300 transform-gpu
        ${className}
        ${!isBack ? 'hover:scale-110 active:scale-95 shadow-2xl z-10' : ''}
      `}
      style={{
        background: isBack ? '#1a1a1a' : '#050505',
        border: `3px solid ${isBack ? '#333' : color}`,
        boxShadow: !isBack ? `0 0 20px ${color}55, inset 0 0 15px ${color}33` : 'none',
        transform: 'translate3d(0,0,0)',
      }}
    >
      {/* High-Contrast Core */}
      {!isBack && (
        <div 
          className="absolute inset-0 opacity-10"
          style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }}
        />
      )}

      <div className="h-full flex flex-col items-center justify-center p-3 relative overflow-hidden">
        {isBack ? (
          <div className="w-12 h-12 rounded-full border-2 border-uno-accent flex items-center justify-center animate-pulse">
            <span className="text-2xl font-black text-uno-accent italic">!</span>
          </div>
        ) : (
          <>
            {/* Corner Markers */}
            <div className="absolute top-2 left-2 text-[10px] md:text-xs font-black" style={{ color }}>{getCardText(card.type)}</div>
            <div className="absolute bottom-2 right-2 text-[10px] md:text-xs font-black rotate-180" style={{ color }}>{getCardText(card.type)}</div>
            
            {/* Massive Neon Icon */}
            <div 
              className="text-3xl md:text-5xl font-black italic tracking-tighter text-center leading-tight transition-all duration-500"
              style={{ 
                color: 'white',
                textShadow: `0 0 10px ${color}, 0 0 20px ${color}88, 0 0 30px ${color}44`
              }}
            >
              {getCardText(card.type)}
            </div>
            
            <div className="mt-2 text-[6px] md:text-[8px] font-bold text-white/30 tracking-[0.3em] uppercase">No Mercy</div>
          </>
        )}
      </div>

      {/* Unplayable Overlay - Not blacked out, just a hint */}
      {isUnplayable && !isBack && (
        <div className="absolute inset-0 bg-black/20 rounded-2xl pointer-events-none flex items-start justify-end p-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]" />
        </div>
      )}
    </div>
  );
}
