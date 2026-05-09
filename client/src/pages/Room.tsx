import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { motion } from 'framer-motion';
import { Users, Copy, Play, Bot, Settings as SettingsIcon } from 'lucide-react';

export default function Room() {
  const { roomId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<any>(null);
  
  useEffect(() => {
    if (!socket) return;

    socket.on('room:update', (state) => {
      setGameState(state);
      if (state.state === 'playing') {
          navigate(`/game/${roomId}`);
      }
    });

    socket.on('game:update', (state) => {
        if (state.state === 'playing') {
            navigate(`/game/${roomId}`);
        }
    });

    // Request initial state if not received
    const name = localStorage.getItem('uno_player_name');
    socket.emit('room:get_state', { roomId, name });

    return () => {
      socket.off('room:update');
      socket.off('game:update');
    };
  }, [socket, navigate, roomId]);

  const startGame = () => {
      socket?.emit('game:start', (response: any) => {
          if (!response.success) {
              alert("Error starting game: " + response.message);
          }
      });
  };

  const copyCode = () => {
      if (roomId) navigator.clipboard.writeText(roomId);
  };

  const addBot = () => {
      socket?.emit('room:add_bot');
  };

  const updateOption = (key: string, value: any) => {
      if (!isHost) return;
      socket?.emit('room:update_options', { [key]: value });
  };

  if (!gameState) {
      return <div className="min-h-screen bg-uno-darker flex items-center justify-center text-white font-bold tracking-widest">LOADING LOBBY...</div>;
  }

  const isHost = gameState.players[0]?.socketId === socket?.id;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-12 relative bg-uno-darker overflow-x-hidden">
       {/* Background Glows */}
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-uno-blue rounded-full opacity-10 blur-[100px] pointer-events-none"></div>
       <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-uno-red rounded-full opacity-10 blur-[100px] pointer-events-none"></div>
       
       <div className="w-full max-w-5xl z-10 flex flex-col lg:flex-row lg:items-stretch gap-8">
           {/* Left Panel: Players */}
           <div className="flex-1 bg-uno-dark/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                   <div>
                       <h2 className="text-4xl font-black text-white italic tracking-tighter">LOBBY</h2>
                       <p className="text-uno-accent font-bold text-xs tracking-widest mt-1 uppercase">Waiting for players...</p>
                   </div>
                   <div className="flex items-center space-x-2 bg-black/50 px-5 py-3 rounded-2xl border border-white/5 shadow-inner">
                       <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Room Code</span>
                       <span className="font-mono text-2xl text-white font-black tracking-[0.2em]">{roomId}</span>
                       <button onClick={copyCode} className="ml-2 text-uno-accent hover:text-white transition-colors">
                           <Copy size={20} />
                       </button>
                   </div>
               </div>

               <div className="space-y-6">
                   <div className="flex justify-between items-center border-b border-white/5 pb-4">
                       <h3 className="text-gray-400 font-black text-sm tracking-widest flex items-center uppercase">
                           <Users size={18} className="mr-2 text-uno-accent" />
                           Players ({gameState.players.length}/{gameState.maxPlayers || 10})
                       </h3>
                       {isHost && (
                           <button 
                               onClick={addBot}
                               disabled={gameState.players.length >= (gameState.maxPlayers || 10)}
                               className="flex items-center text-xs font-black bg-uno-accent/10 text-uno-accent hover:bg-uno-accent hover:text-white px-4 py-2 rounded-xl transition-all border border-uno-accent/20 uppercase tracking-widest"
                           >
                               <Bot size={16} className="mr-2" />
                               Add Bot
                           </button>
                       )}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {gameState.players.map((player: any, idx: number) => (
                           <motion.div 
                             initial={{ x: -20, opacity: 0 }}
                             animate={{ x: 0, opacity: 1 }}
                             transition={{ delay: idx * 0.1 }}
                             key={player.id} 
                             className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center space-x-4 relative overflow-hidden group"
                           >
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-lg relative z-10 ${player.isBot ? 'bg-gray-800 border-2 border-gray-600' : 'bg-gradient-to-br from-uno-accent to-purple-600'}`}>
                                   {player.isBot ? <Bot size={24} className="text-gray-400" /> : player.name.charAt(0).toUpperCase()}
                               </div>
                               <div className="relative z-10">
                                   <div className="font-black text-white italic">{player.name} {idx === 0 && <span className="text-[10px] bg-uno-accent text-white px-2 py-0.5 rounded ml-2 not-italic">HOST</span>}</div>
                                   <div className={`text-[10px] font-black uppercase tracking-tighter ${player.connected ? 'text-green-500' : 'text-red-500'}`}>
                                       {player.isBot ? 'AI Ready' : player.connected ? 'Online' : 'Disconnected'}
                                   </div>
                               </div>
                               <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                   <Users size={60} />
                               </div>
                           </motion.div>
                       ))}
                   </div>
               </div>
           </div>

           {/* Right Panel: Settings */}
           <div className="w-full lg:w-96 bg-uno-dark/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 flex flex-col shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <SettingsIcon className="text-uno-accent" size={24} />
                    <h3 className="text-2xl font-black text-white italic tracking-tighter">SETTINGS</h3>
                </div>
                
                <div className="flex-grow space-y-6">
                    <div className="p-4 bg-black/30 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-white text-sm font-black italic tracking-tighter">MERCY RULE</span>
                            <button 
                                onClick={() => updateOption('mercyRule', !gameState.mercyRule)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${gameState.mercyRule ? 'bg-uno-green' : 'bg-gray-700'}`}
                            >
                                <motion.div 
                                    animate={{ x: gameState.mercyRule ? 24 : 4 }}
                                    className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-md"
                                />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold leading-tight">Eliminate players who reach 25 cards in hand.</p>
                    </div>

                    <div className="p-4 bg-black/30 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-white text-sm font-black italic tracking-tighter">STACKING</span>
                            <button 
                                onClick={() => updateOption('stacking', !gameState.stacking)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${gameState.stacking ? 'bg-uno-accent' : 'bg-gray-700'}`}
                            >
                                <motion.div 
                                    animate={{ x: gameState.stacking ? 24 : 4 }}
                                    className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-md"
                                />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold leading-tight">Allow stacking +2, +4, +6, and +10 cards on top of each other.</p>
                    </div>

                    <div className="p-4 bg-black/30 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white text-sm font-black italic tracking-tighter uppercase">Starting Hand</span>
                            <span className="text-uno-accent font-black">{gameState.startingHandSize || 7}</span>
                        </div>
                        <input 
                            type="range" 
                            min="5" 
                            max="15" 
                            step="1"
                            value={gameState.startingHandSize || 7} 
                            onChange={(e) => updateOption('startingHandSize', parseInt(e.target.value))}
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-uno-accent touch-none relative z-[100]"
                        />
                    </div>

                    <div className="p-4 bg-black/30 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white text-sm font-black italic tracking-tighter uppercase">Mercy Limit</span>
                            <span className="text-uno-red font-black">{gameState.mercyLimit || 25}</span>
                        </div>
                        <input 
                            type="range" 
                            min="10" 
                            max="40" 
                            step="1"
                            value={gameState.mercyLimit || 25} 
                            onChange={(e) => updateOption('mercyLimit', parseInt(e.target.value))}
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-uno-red touch-none relative z-[100]"
                        />
                    </div>

                    <div className="p-4 bg-black/30 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white text-sm font-black italic tracking-tighter uppercase">Bet Amount (₹)</span>
                            <span className="text-uno-accent font-black">₹{gameState.betAmount || 0}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="500" 
                            step="10"
                            value={gameState.betAmount || 0} 
                            onChange={(e) => updateOption('betAmount', parseInt(e.target.value))}
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-uno-accent touch-none relative z-[100]"
                        />
                        <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-widest">Total Pot: ₹{(gameState.betAmount || 0) * gameState.players.length}</p>
                    </div>

                    <div className="p-4 bg-black/30 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white text-sm font-black italic tracking-tighter">MAX PLAYERS</span>
                            <span className="text-uno-accent font-black">{gameState.maxPlayers}</span>
                        </div>
                        <input 
                            type="range" 
                            min="2" 
                            max="10" 
                            value={gameState.maxPlayers} 
                            onChange={(e) => updateOption('maxPlayers', parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-uno-accent"
                        />
                    </div>
                </div>

                <div className="mt-12 space-y-4">
                    <button 
                      onClick={startGame}
                      disabled={!isHost || gameState.players.length < 2}
                      className="w-full bg-uno-green hover:bg-green-500 text-black font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center neon-border-green shadow-[0_0_20px_rgba(85,255,85,0.3)] group"
                    >
                      <Play size={24} fill="currentColor" className="mr-2 group-hover:scale-110 transition-transform" />
                      START MISSION
                    </button>
                    {!isHost && (
                        <p className="text-[10px] text-gray-500 text-center font-bold animate-pulse">WAITING FOR HOST TO START...</p>
                    )}
                </div>
           </div>
       </div>
    </div>
  );
}
