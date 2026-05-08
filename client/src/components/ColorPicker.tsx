import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ColorPicker({ onSelect }) {
   const colors = [
       { id: 'red', color: 'bg-red-500 neon-border-red' },
       { id: 'blue', color: 'bg-blue-500 neon-border-blue' },
       { id: 'green', color: 'bg-green-500 neon-border-green' },
       { id: 'yellow', color: 'bg-yellow-400 neon-border-yellow' },
   ];

   return (
      <AnimatePresence>
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
              <motion.div 
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-uno-dark/90 p-8 rounded-3xl border border-white/10 text-center"
              >
                  <h3 className="text-2xl font-bold mb-6 text-white">CHOOSE WILD COLOR</h3>
                  <div className="grid grid-cols-2 gap-4">
                      {colors.map(c => (
                          <button
                            key={c.id}
                            onClick={() => onSelect(c.id)}
                            className={`w-24 h-24 rounded-2xl ${c.color} transform transition-transform hover:scale-110 active:scale-95`}
                          />
                      ))}
                  </div>
              </motion.div>
          </motion.div>
      </AnimatePresence>
   );
}
