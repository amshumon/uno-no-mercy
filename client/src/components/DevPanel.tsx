import React, { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { CardType } from '../../../shared/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function DevPanel() {
    const socket = useSocket();
    const [isOpen, setIsOpen] = useState(false);

    const spawnCard = (cardType: string, isWild: boolean, color: string | null = null) => {
        socket?.emit('game:dev_action', {
            action: 'spawn_card',
            payload: { cardType, isWild, color }
        });
    };

    const forceTurn = () => socket?.emit('game:dev_action', { action: 'force_turn', payload: {} });
    const clearHand = () => socket?.emit('game:dev_action', { action: 'clear_hand', payload: {} });

    return (
        <div className="fixed top-4 left-4 z-[9999]">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-black/80 text-green-500 font-mono text-xs px-2 py-1 rounded border border-green-500/50 hover:bg-green-500/20 transition-colors"
            >
                [DEV PANEL]
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 bg-black/90 border border-green-500/30 p-4 rounded-xl shadow-2xl backdrop-blur-md w-80 max-h-96 overflow-y-auto"
                    >
                        <h4 className="text-green-400 font-mono font-bold mb-3 border-b border-green-500/30 pb-2">TESTING MODE</h4>
                        
                        <div className="space-y-2 mb-4">
                            <button onClick={forceTurn} className="w-full bg-blue-900/50 hover:bg-blue-800 text-blue-200 text-xs py-1.5 rounded font-mono">Force My Turn</button>
                            <button onClick={clearHand} className="w-full bg-red-900/50 hover:bg-red-800 text-red-200 text-xs py-1.5 rounded font-mono">Set Hand to 1 Card (UNO Test)</button>
                        </div>

                        <h5 className="text-gray-400 text-xs font-bold mb-2">SPAWN CARDS</h5>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => spawnCard(CardType.SWAP_HANDS, true)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded">Swap Hands</button>
                            <button onClick={() => spawnCard(CardType.TARGETED_DRAW, true)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded">Target Draw</button>
                            <button onClick={() => spawnCard(CardType.BOMB_CARD, true)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded">Bomb Card</button>
                            <button onClick={() => spawnCard(CardType.STEAL_TURN, true)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded">Steal Turn</button>
                            <button onClick={() => spawnCard(CardType.SHIELD_CARD, true)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded">Shield Card</button>
                            <button onClick={() => spawnCard(CardType.MEGA_DRAW, true)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded">Mega Draw +10</button>
                            <button onClick={() => spawnCard(CardType.DOUBLE_SKIP, true)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded">Double Skip</button>
                            <button onClick={() => spawnCard(CardType.EVERYONE_DRAW, true)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded">Everyone Draw</button>
                            <button onClick={() => spawnCard(CardType.SHUFFLE_HANDS, true)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded">Shuffle Hands</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
