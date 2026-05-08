import React from 'react';
import { motion } from 'framer-motion';

const getCardStyle = (color) => {
    switch(color) {
        case 'red': return 'from-red-500 to-red-700 neon-border-red';
        case 'blue': return 'from-blue-500 to-blue-700 neon-border-blue';
        case 'green': return 'from-green-500 to-green-700 neon-border-green';
        case 'yellow': return 'from-yellow-400 to-yellow-600 neon-border-yellow text-black';
        default: return 'from-gray-800 to-black border-2 border-uno-accent shadow-[0_0_15px_rgba(157,0,255,0.4)]';
    }
};

const getCardText = (card) => {
    if (card.type === 'number') return card.value;
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
        case 'wild_reverse_draw_four': return '⇄ +4';
        case 'wild_color_roulette': return 'WILD ↻';
        default: return '';
    }
};

function Card({ card, onClick, disabled = false, style, className = '' }) {
   if (!card) {
      // Back of card
      return (
         <div className={`w-20 h-32 md:w-28 md:h-40 rounded-xl bg-gradient-to-br from-uno-darker to-uno-dark border-2 border-white/20 flex flex-col justify-center items-center shadow-lg neon-border-accent ${className}`} style={style}>
             <div className="text-xl md:text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-uno-red via-uno-yellow to-uno-accent transform -rotate-45">
                 UNO
             </div>
         </div>
      );
   }

   const colorStyle = getCardStyle(card.color);
   const isWild = card.isWild;
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
       
       const rotateXValue = ((y - centerY) / centerY) * -15; // Max 15 deg
       const rotateYValue = ((x - centerX) / centerX) * 15;
       
       setRotateX(rotateXValue);
       setRotateY(rotateYValue);
   };

   const handleMouseLeave = () => {
       setRotateX(0);
       setRotateY(0);
   };

   return (
      <motion.button 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={disabled ? {} : { y: -20, scale: 1.1, zIndex: 100 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={() => !disabled && onClick && onClick(card)}
        disabled={disabled}
        style={{ ...style, perspective: 1000 }}
        className={`w-20 h-32 md:w-28 md:h-40 rounded-xl relative flex flex-col shadow-xl transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
          <motion.div 
             animate={{ rotateX, rotateY }}
             transition={{ type: 'spring', stiffness: 300, damping: 20 }}
             className="w-full h-full relative rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] transform-gpu"
             style={{ transformStyle: 'preserve-3d' }}
          >
              {/* Card Base */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colorStyle}`}></div>
              
              {/* Inner oval / decoration */}
              <div className="absolute inset-2 md:inset-3 rounded-full md:rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 transform -rotate-[15deg]"></div>

              {/* Top Left Label */}
              <div className="absolute top-2 left-2 font-bold text-sm md:text-md text-white drop-shadow-md">
                  {text}
              </div>

              {/* Center Graphic */}
              <div className="flex-1 h-full flex justify-center items-center relative z-10">
                  <span className={`text-3xl md:text-5xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${card.color === 'yellow' ? 'text-black' : 'text-white'} ${isWild ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500' : ''}`}>
                      {text}
                  </span>
              </div>

              {/* Bottom Right Label */}
              <div className="absolute bottom-2 right-2 font-bold text-sm md:text-md text-white drop-shadow-md transform rotate-180">
                  {text}
              </div>
              
              {/* Glossy reflection layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl mix-blend-overlay pointer-events-none"></div>
          </motion.div>
      </motion.button>
   );
}

export default React.memo(Card);
