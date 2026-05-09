import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ColorPicker({ onSelect }: { onSelect: (color: string) => void }) {
   const colors = [
       { id: 'red', hex: '#ff003c', label: 'RED' },
       { id: 'blue', hex: '#00d2ff', label: 'BLUE' },
       { id: 'green', hex: '#00ff87', label: 'GREEN' },
       { id: 'yellow', hex: '#ffcc00', label: 'YELLOW' },
   ];

   return (
      <AnimatePresence>
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl"
          >
              <motion.div 
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-uno-dark p-12 rounded-[40px] border border-white/10 text-center shadow-[0_0_100px_rgba(0,0,0,1)]"
              >
                  <h3 className="text-3xl font-black italic mb-12 text-white uppercase tracking-tighter">SELECT WILD COLOR</h3>
                  <div className="grid grid-cols-2 gap-8">
                      {colors.map(c => (
                          <motion.button
                            key={c.id}
                            whileHover={{ scale: 1.1, rotate: 2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onSelect(c.id)}
                            className="group relative flex flex-col items-center"
                          >
                            <div 
                                className="w-24 h-24 md:w-32 md:h-32 rounded-3xl transition-all duration-300"
                                style={{ 
                                    backgroundColor: c.hex,
                                    boxShadow: `0 0 30px ${c.hex}66`,
                                    border: '4px solid white'
                                }}
                            />
                            <span className="mt-4 text-xs font-black tracking-widest text-white/40 group-hover:text-white transition-colors">
                                {c.label}
                            </span>
                          </motion.button>
                      ))}
                  </div>
              </motion.div>
          </motion.div>
      </AnimatePresence>
   );
}
