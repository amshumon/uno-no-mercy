import React from 'react';
import { motion } from 'framer-motion';

const getCardStyle = (color, type) => {
    const isWild = type && type.startsWith('wild');
    if (isWild) {
        return 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]';
    }
    switch(color) {
        case 'red': return 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
        case 'blue': return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
        case 'green': return 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
        case 'yellow': return 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]';
        default: return 'border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]';
    }
};

const getHaloStyle = (color, type) => {
    const isWild = type && type.startsWith('wild');
    if (isWild) return 'bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-red-600/20';
    switch(color) {
        case 'red': return 'bg-red-600/20';
        case 'blue': return 'bg-blue-600/20';
        case 'green': return 'bg-emerald-600/20';
        case 'yellow': return 'bg-yellow-400/20';
        default: return 'bg-white/5';
    }
};

const getTextColor = (color, type) => {
    const isWild = type && type.startsWith('wild');
    if (isWild) return 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500';
    switch(color) {
        case 'red': return 'text-red-500';
        case 'blue': return 'text-blue-500';
        case 'green': return 'text-emerald-500';
        case 'yellow': return 'text-yellow-400';
        default: return 'text-white';
    }
};

const getCardText = (card) => {
    if (card.type === 'number') {
        if (card.value === 7) return '7 🤝';
        if (card.value === 0) return '0 🔀';
        return card.value;
    }
    switch(card.type) {
        case 'skip': return '⊘';
        case 'reverse': return '⇄';
        case 'draw_two': return '+2';
        case 'discard_all': return 'ALL';
        case 'skip_everyone': return '⊘ ALL';
        case 'wild': return 'WILD';
        case 'wild_draw_four': return '+4';
        case 'wild_draw_six': return '+6';
        case 'wild_draw_ten': return '+10';
        case 'wild_reverse_draw': return '⇄ +4';
        case 'wild_color_roulette': return 'WILD ↻';
        case 'skip_everyone': return '⊘ ALL';
        case 'discard_all': return 'ALL 🗑️';
        case 'double_skip': return '⊘⊘';
        case 'reverse_all': return '⇄ ALL';
        case 'targeted_draw': return '🎯 +2';
        case 'everyone_draw': return '🌎 +2';
        case 'swap_hands': return '🤝';
        case 'shuffle_hands': return '🔀';
        case 'mega_draw': return '+10 🔥';
        case 'freeze_turn': return '❄️';
        case 'steal_turn': return '⚡';
        case 'mirror_card': return '🪞';
        case 'bomb_card': return '💣';
        case 'sudden_death': return '💀';
        case 'forced_color_lock': return '🔒';
        default: return card.type?.replace(/_/g, ' ').toUpperCase() || 'UNO';
    }
};

function Card({ card, onClick, disabled = false, style, className = '' }) {
   if (!card) {
      return (
         <div className={`w-20 h-32 md:w-28 md:h-40 rounded-xl bg-black border-2 border-white/10 flex flex-col justify-center items-center shadow-2xl ${className}`} style={style}>
             <div className="text-xl md:text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-uno-red via-uno-yellow to-uno-accent transform -rotate-45 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                 UNO
             </div>
         </div>
      );
   }

   const borderStyle = getCardStyle(card.color, card.type);
   const haloStyle = getHaloStyle(card.color, card.type);
   const textColor = getTextColor(card.color, card.type);
   const text = getCardText(card);

   const [rotateX, setRotateX] = React.useState(0);
   const [rotateY, setRotateY] = React.useState(0);

   const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
       if (disabled) return;
       const rect = e.currentTarget.getBoundingClientRect();
       const x = e.clientX - rect.left;
       const y = e.clientY - rect.top;
       const centerX = rect.width / 2;
       const centerY = rect.height / 2;
       setRotateX(((y - centerY) / centerY) * -15);
       setRotateY(((x - centerX) / centerX) * 15);
   };

   return (
      <motion.button 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
        whileHover={disabled ? {} : { y: -20, scale: 1.05, zIndex: 100 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={() => !disabled && onClick && onClick(card)}
        disabled={disabled}
        style={{ ...style, perspective: 1000 }}
        className={`w-20 h-32 md:w-28 md:h-40 relative flex flex-col transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
          <motion.div 
             animate={{ rotateX, rotateY }}
             transition={{ type: 'spring', stiffness: 400, damping: 30 }}
             className={`w-full h-full relative rounded-xl bg-black border-2 overflow-hidden transform-gpu ${borderStyle}`}
             style={{ transformStyle: 'preserve-3d' }}
          >
              {/* Inner Halo / Glow */}
              <div className={`absolute inset-0 opacity-60 ${haloStyle}`}></div>
              
              {/* Corner Symbols */}
              <div className={`absolute top-1.5 left-2 font-black text-xs md:text-sm ${textColor}`}>
                  {text}
              </div>
              <div className={`absolute bottom-1.5 right-2 font-black text-xs md:text-sm transform rotate-180 ${textColor}`}>
                  {text}
              </div>

              {/* Large Center Symbol */}
              <div className="flex-1 h-full flex justify-center items-center relative z-10 p-2 text-center">
                  <span className={`text-2xl md:text-4xl font-black italic tracking-tighter drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] ${textColor}`}>
                      {text}
                  </span>
              </div>
              
              {/* Premium Glossy Layer */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>
          </motion.div>
      </motion.button>
   );
}

export default React.memo(Card);
