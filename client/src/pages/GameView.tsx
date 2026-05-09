import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import Card from '../components/Card';
import ColorPicker from '../components/ColorPicker';
import TargetSelector from '../components/TargetSelector';
import RulesPanel from '../components/RulesPanel';
import Rules from '../shared/Rules';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../hooks/useSound';
import { MessageSquare, Smile, AlertCircle, ShieldAlert, ArrowRight, ArrowLeft, RotateCw, RotateCcw, Trophy } from 'lucide-react';



function GameLog({ history }: { history: any[] }) {
    return (
        <div className="absolute top-24 left-4 w-48 h-32 overflow-hidden pointer-events-none hidden md:block">
            <div className="flex flex-col-reverse gap-1">
                {history.map((item, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className="text-[10px] text-white/40 font-bold bg-black/20 px-2 py-1 rounded border-l-2 border-uno-accent"
                    >
                        {item.message || `${item.player} played ${item.card?.type || ''}`}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function WinnerModal({ winner, onHome }: { winner: any, onHome: () => void }) {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
        >
            <motion.div 
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-uno-dark border-2 border-uno-accent p-8 rounded-[40px] text-center max-w-sm w-full shadow-[0_0_50px_rgba(157,0,255,0.3)]"
            >
                <div className="w-24 h-24 bg-uno-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy size={48} className="text-uno-accent" />
                </div>
                <h2 className="text-4xl font-black italic text-white mb-2 uppercase tracking-tighter">Winner!</h2>
                <p className="text-gray-400 font-bold mb-8 uppercase tracking-widest text-xs">
                    {winner.name} has claimed victory
                </p>
                <button 
                    onClick={onHome}
                    className="w-full bg-uno-accent hover:bg-purple-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg uppercase tracking-widest text-sm"
                >
                    Back to Lobby
                </button>
            </motion.div>
        </motion.div>
    );
}

export default function GameView() {
    const { roomId } = useParams();
    const socket = useSocket();
    const navigate = useNavigate();
    const { playCard, drawCard, winGame, errorSound } = useSound();
    
    const [gameState, setGameState] = useState<any>(null);
    const [hand, setHand] = useState<any[]>([]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [pendingCard, setPendingCard] = useState<any>(null);
    const [showWinnerModal, setShowWinnerModal] = useState<any>(null);
    
    const [showTargetSelector, setShowTargetSelector] = useState(false);
    const [pendingTargetCard, setPendingTargetCard] = useState<any>(null);
    const [pendingColorForTarget, setPendingColorForTarget] = useState<string | null>(null);

    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.on('room:update', (state) => setGameState(state));
        socket.on('game:update', (state) => {
             setGameState(prev => {
                 if (prev && state.activeDrawPenalty > prev.activeDrawPenalty && state.activeDrawPenalty >= 4) {
                     setShake(true);
                     setTimeout(() => setShake(false), 500);
                 }
                 return state;
             });
        });
        socket.on('game:hand', (newHand) => setHand(newHand));
        
        socket.on('game:over', ({ winner }) => {
            winGame();
            setShowWinnerModal(winner);
        });

        socket.on('game:chat_new', (msg) => {
            setChatMessages(prev => [...prev, msg].slice(-20));
        });

        // Request initial state and re-link socket
        const playerName = localStorage.getItem('uno_player_name');
        socket.emit('room:get_state', { roomId, name: playerName });

        return () => {
            socket.off('room:update');
            socket.off('game:update');
            socket.off('game:hand');
            socket.off('game:over');
            socket.off('game:chat_new');
        };
    }, [socket, roomId, navigate, winGame]);

    const myPlayer = useMemo(() => {
        if (!gameState || !socket) return null;
        return gameState.players.find((p: any) => p.handSize === hand.length);
    }, [gameState, hand.length, socket]);

    const opponents = useMemo(() => {
        if (!gameState || !myPlayer) return [];
        const otherPlayers = gameState.players.filter((p: any) => p.id !== myPlayer.id);
        return otherPlayers.map((p: any, index: number) => {
            const angle = (index + 1) * (Math.PI / (otherPlayers.length + 1));
            const x = Math.cos(angle + Math.PI) * 40; 
            const y = Math.sin(angle + Math.PI) * 35;
            return { ...p, x, y };
        });
    }, [gameState, myPlayer]);

    if (!gameState) {
        return <div className="min-h-screen bg-uno-darker text-white flex items-center justify-center font-bold">Loading Game...</div>;
    }

    const currentPlayer = gameState.players[gameState.currentTurnIndex];
    const isMyTurn = myPlayer?.id === currentPlayer?.id;

    const handlePlayCard = (card: any) => {
        if (!isMyTurn) return;
        
        const checkRequiresTarget = (cardType: string) => {
            return ['swap_hands', 'targeted_draw', 'take_from_opponent', 'steal_turn', 'bomb_card'].includes(cardType);
        };

        if (card.isWild) {
            setPendingCard(card);
            setShowColorPicker(true);
        } else if (checkRequiresTarget(card.type)) {
            setPendingTargetCard(card);
            setShowTargetSelector(true);
        } else {
            socket.emit('game:play_card', { cardId: card.id }, (res: any) => {
                if (res.success) playCard();
                else errorSound();
            });
        }
    };

    const handleColorSelected = (color: string) => {
        setShowColorPicker(false);
        if (pendingCard) {
            socket.emit('game:play_card', { cardId: pendingCard.id, chosenColor: color }, (res: any) => {
                if (res.success) playCard();
            });
            setPendingCard(null);
        }
    };

    const handleTargetSelected = (targetId: string) => {
        setShowTargetSelector(false);
        if (pendingTargetCard) {
            socket.emit('game:play_card', { cardId: pendingTargetCard.id, targetId, chosenColor: pendingColorForTarget }, (res: any) => {
                if (res.success) playCard();
            });
            setPendingTargetCard(null);
            setPendingColorForTarget(null);
        }
    };

    const isHost = gameState?.players[0]?.socketId === socket?.id;

    return (
        <motion.div 
            animate={shake ? { x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="h-screen w-full bg-uno-darker flex flex-col relative overflow-hidden select-none"
        >
            <RulesPanel isHost={isHost} />
            <GameLog history={gameState.history} />
            
            {/* Background Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-10 blur-[150px] pointer-events-none transition-colors duration-1000 ${
                gameState.currentColor === 'red' ? 'bg-red-500' :
                gameState.currentColor === 'blue' ? 'bg-blue-500' :
                gameState.currentColor === 'green' ? 'bg-green-500' :
                gameState.currentColor === 'yellow' ? 'bg-yellow-500' : 'bg-uno-accent'
            }`}></div>

            {/* Direction Indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <motion.div 
                    animate={{ rotate: gameState.direction === 1 ? 360 : -360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="w-[400px] h-[400px] md:w-[600px] md:h-[600px] border-2 border-white/5 rounded-full relative"
                 >
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20">
                         {gameState.direction === 1 ? <RotateCw size={40} /> : <RotateCcw size={40} />}
                     </div>
                     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-white/20">
                         {gameState.direction === 1 ? <RotateCw size={40} /> : <RotateCcw size={40} />}
                     </div>
                 </motion.div>
            </div>

            {/* Circular Opponents */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-full h-full max-w-[1200px] max-h-[800px] flex items-center justify-center">
                    {opponents.map((p: any) => (
                        <motion.div 
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1, x: `${p.x}vw`, y: `${p.y}vh` }}
                            className="absolute pointer-events-auto"
                        >
                            <div className={`flex flex-col items-center bg-uno-dark/60 backdrop-blur-md rounded-2xl p-3 border-2 transition-all ${
                                gameState.players[gameState.currentTurnIndex].id === p.id 
                                ? 'border-uno-accent shadow-[0_0_20px_rgba(157,0,255,0.4)] scale-110' 
                                : 'border-white/5'
                            }`}>
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center font-bold text-white shadow-lg">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    {p.hasSaidUno && (
                                        <div className="absolute -top-2 -right-2 bg-uno-red text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg animate-bounce">UNO</div>
                                    )}
                                    {p.isFrozen && (
                                        <div className="absolute inset-0 bg-blue-400/30 rounded-full flex items-center justify-center">❄️</div>
                                    )}
                                </div>
                                <span className="text-white text-xs font-bold mt-2 max-w-[80px] truncate">{p.name}</span>
                                <div className="flex gap-1 mt-1">
                                    {Array.from({ length: Math.min(p.handSize, 5) }).map((_, idx) => (
                                        <div key={idx} className="w-2 h-3 bg-uno-red rounded-[2px] border-[1px] border-white/20 shadow-sm" />
                                    ))}
                                    {p.handSize > 5 && <span className="text-[10px] text-uno-accent font-bold">+{p.handSize - 5}</span>}
                                </div>
                                {p.handSize === 1 && !p.hasSaidUno && (
                                    <button onClick={() => socket.emit('game:challenge_uno', { targetId: p.id })} className="mt-2 bg-uno-red hover:bg-red-500 text-[10px] font-black px-2 py-1 rounded-full text-white shadow-lg flex items-center gap-1">
                                        <ShieldAlert size={10} /> CHALLENGE
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Center Area */}
            <div className="flex-1 flex items-center justify-center relative z-10">
                <div className="flex gap-12 md:gap-24 items-center">
                    {/* Draw Pile */}
                    <div className="relative group cursor-pointer" onClick={() => socket.emit('game:draw', (res: any) => res.success && drawCard())}>
                        <div className="w-24 h-36 md:w-32 md:h-48 bg-uno-dark rounded-2xl border-2 border-white/10 shadow-2xl relative overflow-hidden" />
                        <motion.div whileHover={{ y: -10, rotate: -5 }} className="absolute inset-0 w-24 h-36 md:w-32 md:h-48 bg-uno-dark rounded-2xl border-2 border-uno-accent shadow-2xl -translate-y-2 translate-x-2 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-4 border-uno-accent flex items-center justify-center font-black text-2xl text-uno-accent italic">!</div>
                            <span className="text-[10px] font-black text-uno-accent mt-2 tracking-widest">DRAW</span>
                        </motion.div>
                    </div>

                    {/* Discard Pile */}
                    <div className="relative">
                        <AnimatePresence mode="popLayout">
                            {gameState.topDiscard && (
                                <motion.div
                                    key={gameState.topDiscard.id}
                                    initial={{ y: -500, rotate: 180, opacity: 0 }}
                                    animate={{ y: 0, rotate: (Math.random() * 20 - 10), opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                >
                                    <Card card={gameState.topDiscard} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {gameState.activeDrawPenalty > 0 && (
                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} className="absolute -top-12 left-1/2 -translate-x-1/2 bg-uno-red px-6 py-2 rounded-full font-black text-xl italic text-white shadow-[0_0_20px_rgba(255,0,0,0.5)] border-2 border-white/20 z-50 whitespace-nowrap">
                                +{gameState.activeDrawPenalty}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Turn Info */}
                <div className="absolute bottom-4 md:bottom-auto md:right-12 bg-uno-dark/80 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl min-w-[160px]">
                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Current Player</div>
                    <div className="text-xl font-black text-white italic truncate">{currentPlayer?.name}</div>

                    <div className={`mt-3 flex items-center justify-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                        gameState.currentColor === 'red' ? 'bg-red-500/20 border-red-500 text-red-500' :
                        gameState.currentColor === 'blue' ? 'bg-blue-500/20 border-blue-500 text-blue-500' :
                        gameState.currentColor === 'green' ? 'bg-green-500/20 border-green-500 text-green-500' :
                        gameState.currentColor === 'yellow' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-gray-800 border-gray-600 text-gray-400'
                    }`}>
                        <div className={`w-2 h-2 rounded-full bg-${gameState.currentColor}-500`} />
                        {gameState.currentColor || 'No Color'}
                    </div>
                </div>
            </div>

            {/* Bottom Section: My Hand */}
            <div className="pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent z-20">
                <div className="px-6 mb-3 flex justify-between items-end">
                    <div>
                        <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">My Cards</span>
                        <div className="text-xl font-black text-white italic">{hand.length}</div>
                    </div>
                    {isMyTurn && (
                        <motion.div 
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-[10px] text-uno-accent font-black uppercase tracking-widest flex items-center"
                        >
                            Your Turn <ArrowRight size={12} className="ml-1" />
                        </motion.div>
                    )}
                </div>

                {/* Horizontal Scrollable Hand */}
                <div className="flex overflow-x-auto overflow-y-hidden px-6 pb-4 gap-3 custom-scrollbar snap-x no-scrollbar">
                    {hand.map((card) => (
                        <div key={card.id} className="snap-center flex-shrink-0">
                            <Card 
                                card={card} 
                                onClick={handlePlayCard}
                                disabled={!isMyTurn || !Rules.canPlayCard(card, gameState.topDiscard, gameState.activeDrawPenalty, gameState.currentColor, gameState.isColorLocked)}
                                className="!w-24 !h-36 active:scale-110"
                            />
                        </div>
                    ))}
                    <div className="w-12 flex-shrink-0" />
                </div>
            </div>
                
                {/* Action Buttons */}
                <div className="flex gap-4 mt-2">
                    <AnimatePresence>
                        {hand.length <= 2 && (
                            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => socket.emit('game:say_uno')} className={`px-8 py-2 rounded-full font-black italic shadow-lg ${myPlayer?.hasSaidUno ? 'bg-gray-700 text-gray-500' : 'bg-uno-red text-white'}`}>UNO</motion.button>
                        )}
                    </AnimatePresence>
                </div>
            
            {/* Overlays */}
            <AnimatePresence>
                {showColorPicker && <ColorPicker onSelect={handleColorSelected} />}
                {showTargetSelector && (
                    <TargetSelector 
                        players={gameState.players} 
                        currentPlayerId={myPlayer?.id || ''} 
                        onSelect={handleTargetSelected} 
                        onCancel={() => setShowTargetSelector(false)} 
                    />
                )}
                {showWinnerModal && (
                    <WinnerModal winner={showWinnerModal} onHome={() => navigate('/')} />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
