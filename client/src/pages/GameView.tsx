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
    const { playCard, drawCard, winGame, errorSound, turnNotify, unlockAudio } = useSound();
    
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
    const [activeAlert, setActiveAlert] = useState<string | null>(null);
    const [emojiParticles, setEmojiParticles] = useState<{id: number, emoji: string, x: number, y: number}[]>([]);

    useEffect(() => {
        if (!socket) return;

        socket.on('room:update', (state) => setGameState(state));
        socket.on('game:update', (state) => {
             setGameState(prev => {
                 // Check for Emoji particles from chat
                 const latestMsg = state.history[state.history.length - 1];
                 if (latestMsg?.type === 'chat' && ['🔥', '😂', '🃏', '😡', '💨'].includes(latestMsg.message)) {
                     const newId = Date.now();
                     setEmojiParticles(prev => [...prev, { id: newId, emoji: latestMsg.message, x: Math.random() * 80 + 10, y: 100 }]);
                     setTimeout(() => setEmojiParticles(current => current.filter(p => p.id !== newId)), 2000);
                 }

                 // Check for eliminations
                 state.players.forEach((p: any) => {
                    const wasActive = prev?.players.find((oldP: any) => oldP.id === p.id)?.handSize < 25;
                    if (p.handSize >= 25 && wasActive) {
                        fartSound();
                    }
                 });

                 // Check for 1st place winner
                 const newWinnerId = state.players.find((p: any) => p.isFinished && p.finishRank === 1)?.id;
                 const oldWinnerId = prev?.players.find((p: any) => p.isFinished && p.finishRank === 1)?.id;
                 if (newWinnerId && newWinnerId !== oldWinnerId) {
                     winPotSound();
                 }

                 // Dramatic Flash for Power Cards
                 if (state.activeDrawPenalty > (prev?.activeDrawPenalty || 0)) {
                     setShake(true);
                     sadTrombone();
                     // Add a temporary 'flash' class to the body or a div
                     document.body.style.backgroundColor = 'rgba(255,255,255,0.1)';
                     setTimeout(() => {
                         setShake(false);
                         document.body.style.backgroundColor = '';
                     }, 400);
                 }
                 
                 // UNO alerts... (previous logic)
                 state.players.forEach((p: any) => {
                     const wasAboveOne = prev?.players.find((oldP: any) => oldP.id === p.id)?.handSize > 1;
                     if (p.handSize === 1 && wasAboveOne) {
                         setActiveAlert(`${p.name} IS ON UNO!`);
                         setTimeout(() => setActiveAlert(null), 3000);
                     }
                 });

                 // Re-link/Sounds logic...
                 const name = localStorage.getItem('uno_player_name');
                 const myId = state.players.find((p: any) => p.name === name)?.id;
                 if (state.players[state.currentTurnIndex]?.id === myId && prev?.players[prev.currentTurnIndex]?.id !== myId) {
                     turnNotify();
                     if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
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
    }, [socket, roomId, navigate, winGame, turnNotify]);

    const myPlayer = useMemo(() => {
        if (!gameState || !socket) return null;
        const name = localStorage.getItem('uno_player_name');
        return gameState.players.find((p: any) => p.name === name) || gameState.players.find((p: any) => p.socketId === socket.id);
    }, [gameState, socket]);

    const opponents = useMemo(() => {
        if (!gameState || !myPlayer) return [];
        const otherPlayers = gameState.players.filter((p: any) => p.id !== myPlayer.id);
        const count = otherPlayers.length;
        
        // Dynamic radius and spacing to prevent overlaps
        const radiusX = count > 5 ? 42 : 38; 
        const radiusY = count > 5 ? 38 : 34;

        return otherPlayers.map((p: any, index: number) => {
            // Spread players evenly across the top arc
            const angle = ((index + 1) / (count + 1)) * Math.PI;
            const x = Math.cos(angle + Math.PI) * radiusX; 
            const y = Math.sin(angle + Math.PI) * radiusY;
            return { ...p, x, y };
        });
    }, [gameState, myPlayer]);

    if (!gameState) {
        return <div className="min-h-screen bg-uno-darker text-white flex items-center justify-center font-bold">Loading Game...</div>;
    }

    const currentPlayer = gameState.players[gameState.currentTurnIndex];
    const isMyTurn = myPlayer?.id === currentPlayer?.id;

    const handlePlayCard = (card: any) => {
        if (!isMyTurn) {
            errorSound();
            return;
        }

        const isPlayable = Rules.canPlayCard(card, gameState.topDiscard, gameState.activeDrawPenalty, gameState.currentColor, gameState.isColorLocked);
        
        if (!isPlayable) {
            errorSound();
            // Show temporary message (optional: add state for a toast)
            return;
        }
        
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
            socket.emit('game:play_card', { 
                cardId: pendingTargetCard.id, 
                targetPlayerId: targetId,
                chosenColor: pendingColorForTarget || undefined
            }, (res: any) => {
                if (res.success) playCard();
            });
            setPendingTargetCard(null);
            setPendingColorForTarget(null);
        }
    };

    const handleDraw = () => {
        if (!isMyTurn) return;
        socket.emit('game:draw', (res: any) => {
            if (res.success) drawCard();
        });
    };

    const handleSayUno = () => {
        socket.emit('game:say_uno');
    };

    const isHost = gameState?.players[0]?.socketId === socket?.id;

    return (
        <motion.div 
            onClick={unlockAudio}
            animate={shake ? { x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="h-screen w-full bg-[#050505] flex flex-col relative overflow-hidden select-none"
        >
            <RulesPanel isHost={isHost} />
            <GameLog history={gameState.history} />
            
            {/* Emoji Particles */}
            {emojiParticles.map(p => (
                <motion.div key={p.id} initial={{ y: '100vh', opacity: 1 }} animate={{ y: -100, opacity: 0 }} transition={{ duration: 2 }} className="fixed text-4xl z-[9999]" style={{ left: `${p.x}vw` }}>
                    {p.emoji}
                </motion.div>
            ))}
            
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
                    {opponents.map((p: any) => {
                        const isCurrent = gameState.players[gameState.currentTurnIndex].id === p.id;
                        return (
                        <motion.div 
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1, x: `${p.x}vw`, y: `${p.y}vh` }}
                            className="absolute pointer-events-auto"
                        >
                            {/* Dangerous Fire Streak */}
                            {p.handSize <= 3 && !p.isFinished && (
                                <motion.div 
                                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl"
                                >
                                    🔥
                                </motion.div>
                            )}
                            
                            <div className={`flex flex-col items-center bg-uno-dark/80 backdrop-blur-md rounded-2xl p-2 border-2 transition-all ${
                                isCurrent 
                                ? 'border-uno-accent shadow-[0_0_20px_rgba(157,0,255,0.4)] scale-105' 
                                : 'border-white/5'
                            } ${isEliminated ? 'grayscale opacity-40 blur-[0.5px]' : ''}`}>
                                <div className="relative">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-lg shadow-2xl relative transition-all duration-500 ${isCurrent ? 'ring-2 ring-uno-accent ring-offset-2 ring-offset-black' : 'opacity-80'}`}
                                         style={{ background: isEliminated ? '#111' : `linear-gradient(135deg, ${p.isBot ? '#333' : '#9d00ff'}, #6b21a8)` }}>
                                        {isEliminated ? '💀' : (p.isBot ? '🤖' : p.name.charAt(0).toUpperCase())}
                                        
                                        {/* Card Count Badge */}
                                        {!p.isFinished && !isEliminated && (
                                            <div className="absolute -bottom-1 -right-1 bg-uno-red text-[10px] font-black px-1.5 py-0.5 rounded border border-white/20 shadow-lg z-20">
                                                {p.handSize}
                                            </div>
                                        )}
                                        
                                        {/* Thinking Bubble */}
                                        {isCurrent && !isEliminated && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute -right-2 -top-2 bg-white text-black text-[8px] px-2 py-1 rounded-full font-bold shadow-lg"
                                            >
                                                ...
                                            </motion.div>
                                        )}
                                    </div>
                                    {p.hasSaidUno && (
                                        <div className="absolute -top-2 -left-2 bg-uno-yellow text-black text-[8px] font-black px-1 py-0.5 rounded shadow-lg animate-bounce">UNO</div>
                                    )}
                                    {p.isFrozen && (
                                        <div className="absolute inset-0 bg-blue-400/30 rounded-full flex items-center justify-center">❄️</div>
                                    )}
                                </div>
                                <div className="mt-1 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-[9px] font-black text-white italic truncate max-w-[60px] uppercase">{p.name}</span>
                                        {p.balance > 2000 && <span className="text-[8px]">👑</span>}
                                    </div>
                                    <div className="text-[7px] font-black text-uno-accent tracking-widest uppercase">LVL {Math.floor(p.balance / 500)}</div>
                                </div>
                                {p.handSize === 1 && !p.hasSaidUno && !isEliminated && (
                                    <button onClick={() => socket.emit('game:challenge_uno', { targetId: p.id })} className="mt-2 bg-uno-red hover:bg-red-500 text-[10px] font-black px-2 py-1 rounded-full text-white shadow-lg flex items-center gap-1">
                                        <ShieldAlert size={10} /> CHALLENGE
                                    </button>
                                )}
                            </div>
                        </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Center Area: Discard, Draw, and Pot */}
            <div className="flex-1 flex flex-col justify-center items-center relative z-10 gap-4">
                {/* Pot Display */}
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-yellow-500/30 flex items-center gap-3 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                >
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-[10px]">₹</div>
                    <span className="text-yellow-500 font-black italic tracking-widest text-sm">POT: ₹{gameState.pot}</span>
                </motion.div>

                <div className="flex items-center gap-8">
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
                                isUnplayable={!isMyTurn || !Rules.canPlayCard(card, gameState.topDiscard, gameState.activeDrawPenalty, gameState.currentColor, gameState.isColorLocked)}
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
            
            {/* Dramatic Alerts */}
            <AnimatePresence>
                {activeAlert && (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
                    >
                        <h2 className="text-6xl md:text-8xl font-black italic text-white text-center drop-shadow-[0_0_30px_rgba(157,0,255,1)] uppercase tracking-tighter">
                            {activeAlert}
                        </h2>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dynamic Background Glow */}
            <div 
                className="absolute inset-0 transition-colors duration-1000 opacity-20 pointer-events-none"
                style={{ 
                    background: `radial-gradient(circle at center, ${
                        gameState.currentColor === 'red' ? '#ff003c' :
                        gameState.currentColor === 'blue' ? '#00d2ff' :
                        gameState.currentColor === 'green' ? '#00ff87' :
                        gameState.currentColor === 'yellow' ? '#ffcc00' :
                        '#9d00ff'
                    }88, transparent 70%)` 
                }}
            />

            {/* Reactions & Taunts Bar */}
            <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
                <div className="flex flex-col gap-2 mb-4">
                    {['GG', 'NO MERCY!', 'REALLY?', 'UNLUCKY'].map(text => (
                        <motion.button
                            key={text}
                            whileHover={{ x: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => socket.emit('game:chat_send', { message: text })}
                            className="bg-black/60 backdrop-blur-md text-[8px] font-black text-white px-3 py-2 rounded-lg border border-white/10 hover:border-uno-accent transition-colors uppercase tracking-widest"
                        >
                            {text}
                        </motion.button>
                    ))}
                </div>
                {['🔥', '😂', '🃏', '😡', '💨'].map(emoji => (
                    <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        whileTap={{ scale: 0.8 }}
                        onClick={() => {
                            socket.emit('game:chat_send', { message: emoji });
                            if (emoji === '💨') fartSound();
                        }}
                        className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-2xl shadow-xl hover:border-uno-accent transition-colors"
                    >
                        {emoji}
                    </motion.button>
                ))}
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
