import React, { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { CardType } from '../shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ShieldAlert, Zap, Users, Info } from 'lucide-react';

export default function RulesPanel({ isHost }: { isHost: boolean }) {
    const socket = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [showDev, setShowDev] = useState(false);

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
                className="bg-black/60 backdrop-blur-md text-white font-bold text-xs px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center shadow-xl"
            >
                <BookOpen size={16} className="mr-2 text-uno-accent" />
                RULES & INFO
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="mt-2 bg-uno-dark/95 border border-white/10 p-6 rounded-2xl shadow-2xl backdrop-blur-xl w-80 max-h-[80vh] overflow-y-auto custom-scrollbar"
                    >
                        <h4 className="text-white font-black italic text-xl mb-4 flex items-center border-b border-white/5 pb-2">
                            NO MERCY RULES
                        </h4>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg text-red-500"><ShieldAlert size={18}/></div>
                                <div>
                                    <h5 className="text-white font-bold text-sm uppercase">Mercy Rule</h5>
                                    <p className="text-gray-400 text-xs">If you hit 25 cards, you are out!</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-uno-accent/20 rounded-lg text-uno-accent"><Zap size={18}/></div>
                                <div>
                                    <h5 className="text-white font-bold text-sm uppercase">Stacking</h5>
                                    <p className="text-gray-400 text-xs">Stack Draw cards to pass the penalty.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500"><Users size={18}/></div>
                                <div>
                                    <h5 className="text-white font-bold text-sm uppercase">0 & 7 Rule</h5>
                                    <p className="text-gray-400 text-xs">7 swaps hands. 0 passes hands around.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 mb-6">
                            <h5 className="text-white font-bold text-xs mb-2 flex items-center uppercase">
                                <Info size={14} className="mr-1 text-uno-blue" /> Draw Rule
                            </h5>
                            <p className="text-gray-500 text-[10px] leading-relaxed font-bold">
                                If you cannot play, you keep drawing until you find a playable card or hit the 25-card limit.
                            </p>
                        </div>

                        {isHost && (
                            <div className="mt-8 pt-4 border-t border-white/10">
                                <button 
                                    onClick={() => setShowDev(!showDev)}
                                    className="text-[10px] text-gray-600 font-mono hover:text-green-500 transition-colors uppercase tracking-widest"
                                >
                                    {showDev ? '[ Hide Admin Tools ]' : '[ Admin Console ]'}
                                </button>
                                
                                {showDev && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="mt-4 space-y-4 overflow-hidden"
                                    >
                                        <div className="space-y-2">
                                            <button onClick={forceTurn} className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-500 text-[10px] py-2 rounded font-mono uppercase border border-green-500/20">Force My Turn</button>
                                            <button onClick={clearHand} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-500 text-[10px] py-2 rounded font-mono uppercase border border-red-500/20">Reset My Hand</button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => spawnCard(CardType.WILD_DRAW_TEN, true)} className="bg-white/5 hover:bg-white/10 text-white text-[9px] py-1.5 rounded font-bold uppercase">Spawn +10</button>
                                            <button onClick={() => spawnCard(CardType.SKIP_EVERYONE, false, 'red')} className="bg-white/5 hover:bg-white/10 text-white text-[9px] py-1.5 rounded font-bold uppercase">Spawn Skip All</button>
                                            <button onClick={() => spawnCard(CardType.DISCARD_ALL, false, 'blue')} className="bg-white/5 hover:bg-white/10 text-white text-[9px] py-1.5 rounded font-bold uppercase">Spawn Discard All</button>
                                            <button onClick={() => spawnCard(CardType.WILD_COLOR_ROULETTE, true)} className="bg-white/5 hover:bg-white/10 text-white text-[9px] py-1.5 rounded font-bold uppercase">Spawn Roulette</button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
