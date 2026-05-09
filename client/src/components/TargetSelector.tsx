import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TargetSelectorProps {
    players: { id: string, name: string, avatar: string, handSize: number }[];
    currentPlayerId: string;
    onSelect: (targetId: string) => void;
    onCancel: () => void;
    title?: string;
}

function TargetSelector({ players, currentPlayerId, onSelect, onCancel, title = "SELECT TARGET" }: TargetSelectorProps) {
   const targets = players.filter(p => p.id !== currentPlayerId);

   return (
      <AnimatePresence>
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
              <motion.div 
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-uno-dark/90 p-8 rounded-3xl border border-uno-accent/50 text-center w-full max-w-lg neon-border-accent"
              >
                  <h3 className="text-2xl font-black italic mb-6 text-transparent bg-clip-text bg-gradient-to-r from-uno-red to-uno-accent drop-shadow-md">
                      {title}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto p-2">
                      {targets.map(p => (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            className="bg-black/50 hover:bg-uno-accent/20 border border-white/10 hover:border-uno-accent p-4 rounded-2xl flex flex-col items-center transition-colors"
                          >
                               <div className="w-12 h-12 rounded-full bg-gradient-to-br from-uno-accent to-purple-600 flex items-center justify-center font-bold text-xl mb-2 text-white shadow-lg">
                                   {p.name.charAt(0).toUpperCase()}
                               </div>
                               <span className="font-bold text-white text-lg">{p.name}</span>
                               <span className="text-uno-accent text-sm font-semibold mt-1">{p.handSize} Cards</span>
                          </motion.button>
                      ))}
                  </div>
                  <button 
                      onClick={onCancel}
                      className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
                  >
                      CANCEL
                  </button>
              </motion.div>
          </motion.div>
      </AnimatePresence>
   );
}

export default React.memo(TargetSelector);
