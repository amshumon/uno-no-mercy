import React, { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { CardType } from '../shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ShieldAlert, Zap, Users, Info, X } from 'lucide-react';
import Card from './Card';

export default function RulesPanel({ isHost }: { isHost: boolean }) {
    const socket = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [showDev, setShowDev] = useState(false);

    const rules = [
        { title: 'Mercy Rule', desc: 'If a player hits 25 cards in their hand, they are immediately ELIMINATED.', icon: <ShieldAlert className="text-red-500" /> },
        { title: 'Stacking', desc: 'You can stack DRAW cards (+2, +4, +6, +10) if they are equal or higher value than the current penalty.', icon: <Zap className="text-uno-accent" /> },
        { title: '0 & 7 Swap', desc: 'Playing a 0 passes all hands in the direction of play. Playing a 7 allows you to swap hands with anyone.', icon: <Users className="text-blue-500" /> },
    ];

    const cardPowers = [
        { type: CardType.WILD_DRAW_TEN, color: null, desc: 'Wild +10: Next player draws 10 cards. Stackable!' },
        { type: CardType.SKIP_EVERYONE, color: 'red', desc: 'Skip Everyone: Immediately ends all other players turns. It stays your turn!' },
        { type: CardType.DISCARD_ALL, color: 'blue', desc: 'Discard All: Discard every card in your hand that matches this color.' },
        { type: CardType.WILD_COLOR_ROULETTE, color: null, desc: 'Roulette: Next player draws until they find the color you choose!' },
    ];

    const spawnCard = (cardType: string, isWild: boolean, color: string | null = null) => {
        socket?.emit('game:dev_action', {
            action: 'spawn_card',
            payload: { cardType, isWild, color }
        });
    };

    return (
        <div className="fixed top-4 left-4 z-[9999]">
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-black/80 backdrop-blur-md text-white font-black text-[10px] px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center shadow-2xl tracking-[0.2em] uppercase"
            >
                <BookOpen size={16} className="mr-2 text-uno-accent" />
                Handbook
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="fixed inset-y-4 left-4 w-[90vw] max-w-md bg-[#0a0a0a]/95 border border-white/10 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-uno-accent/10 to-transparent">
                            <div>
                                <h2 className="text-2xl font-black italic text-white tracking-tighter uppercase">No Mercy</h2>
                                <p className="text-[10px] text-uno-accent font-bold tracking-widest uppercase">The Official Handbook</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {/* General Rules */}
                            <section>
                                <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] mb-4">Core Mechanics</h3>
                                <div className="space-y-4">
                                    {rules.map((r, i) => (
                                        <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="mt-1">{r.icon}</div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm uppercase">{r.title}</h4>
                                                <p className="text-gray-500 text-xs leading-relaxed mt-1 font-medium">{r.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Card Powers with Images */}
                            <section>
                                <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] mb-4">Specialty Cards</h3>
                                <div className="space-y-6">
                                    {cardPowers.map((cp, i) => (
                                        <div key={i} className="flex items-center gap-6 group">
                                            <div className="scale-75 origin-left -ml-4 transition-transform group-hover:scale-90">
                                                <Card 
                                                    card={{ id: 'preview', type: cp.type as any, color: cp.color as any, value: null, isWild: !cp.color }} 
                                                    disabled={false}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-white font-black italic text-xs uppercase tracking-widest mb-1">
                                                    {cp.type.replace(/_/g, ' ')}
                                                </h4>
                                                <p className="text-gray-500 text-[10px] leading-relaxed font-bold uppercase">{cp.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Host Tools */}
                            {isHost && (
                                <section className="pt-4 border-t border-white/5">
                                    <button 
                                        onClick={() => setShowDev(!showDev)}
                                        className="text-[10px] text-gray-600 font-mono hover:text-green-500 transition-colors uppercase tracking-widest"
                                    >
                                        {showDev ? '[ Close Admin Console ]' : '[ Open Admin Console ]'}
                                    </button>
                                    
                                    {showDev && (
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <button onClick={() => socket?.emit('game:dev_action', { action: 'force_turn', payload: {} })} className="bg-green-500/10 text-green-500 text-[9px] py-2 rounded-lg font-black uppercase border border-green-500/20">Force My Turn</button>
                                            <button onClick={() => socket?.emit('game:dev_action', { action: 'clear_hand', payload: {} })} className="bg-red-500/10 text-red-500 text-[9px] py-2 rounded-lg font-black uppercase border border-red-500/20">Reset My Hand</button>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-black/40 text-center">
                            <p className="text-[8px] text-gray-600 font-black tracking-[0.5em] uppercase">Built for Mobile Domination</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
