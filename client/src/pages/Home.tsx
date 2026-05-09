import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/firebase';

export default function Home() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(true);
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
     const savedName = localStorage.getItem('uno_player_name');
     if (savedName) setName(savedName);

     if (auth.currentUser) {
         setUser(auth.currentUser);
         setName(auth.currentUser.displayName || savedName || '');
         setShowLogin(false);
     }
  }, []);

  useEffect(() => {
    if (name) localStorage.setItem('uno_player_name', name);
  }, [name]);

  const handleGoogleLogin = async () => {
      try {
          const loggedUser = await auth.signInWithGoogle();
          setUser(loggedUser);
          setName(loggedUser.displayName || '');
          setShowLogin(false);
      } catch (e) {
          console.error("Firebase Login Failed (Likely missing .env API keys). Falling back to local mode.");
          const mockUser = { uid: 'local_user', displayName: 'Local Player', photoURL: null };
          setUser(mockUser);
          setName(mockUser.displayName);
          setShowLogin(false);
      }
  };

  const handleGuestLogin = async () => {
      try {
          const loggedUser = await auth.signInAsGuest();
          setUser(loggedUser);
          setName(loggedUser.displayName || '');
          setShowLogin(false);
      } catch (e) {
          console.error("Firebase Guest Login Failed (Likely missing .env API keys). Falling back to local mode.");
          const mockUser = { uid: 'guest_' + Math.floor(Math.random()*1000), displayName: 'Guest Player', photoURL: null };
          setUser(mockUser);
          setName(mockUser.displayName);
          setShowLogin(false);
      }
  };

  const handleCreateRoom = () => {
    if (!name || !socket) return;
    socket.emit('room:create', { name, avatar: user?.photoURL || 'default', options: {} }, (response: any) => {
      if (response.success) {
        navigate(`/room/${response.roomId}`);
      } else {
        alert(response.message);
      }
    });
  };

  const handleJoinRoom = () => {
    if (!name || !roomCode || !socket) return;
    socket.emit('room:join', { roomId: roomCode, name, avatar: user?.photoURL || 'default' }, (response: any) => {
      if (response.success) {
         navigate(`/room/${response.roomId}`);
      } else {
         alert(response.message);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-uno-darker">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-uno-accent rounded-full opacity-20 blur-[100px] pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {showLogin ? (
          <motion.div 
             key="login"
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 1.1, opacity: 0 }}
             className="z-10 bg-black/60 backdrop-blur-xl p-12 rounded-3xl border border-white/10 text-center shadow-2xl max-w-md w-full"
          >
             <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-uno-red via-yellow-500 to-uno-green drop-shadow-lg mb-2">
                 UNO<br/><span className="text-white">NO MERCY</span>
             </h1>
             <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-8">A game by amshumon</p>
             
             <p className="text-gray-400 mb-8 font-semibold">Sign in to save your progress, unlock skins, and play ranked.</p>
             
             <div className="space-y-4">
                 <button 
                     onClick={handleGoogleLogin}
                     className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                 >
                     <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                         <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.58c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                         <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.58-2.77c-.98.66-2.23 1.06-3.7 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                         <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                         <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                     </svg>
                     Sign in with Google
                 </button>
                 <button 
                     onClick={handleGuestLogin}
                     className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors border border-gray-600"
                 >
                     Play as Guest
                 </button>
             </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md z-10 flex flex-col items-center"
          >
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="z-10 text-center mb-8"
            >
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-uno-red via-uno-yellow to-uno-accent drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                NO MERCY
              </h1>
              <p className="text-xl md:text-2xl text-uno-red font-bold mt-2 neon-text-red tracking-widest">MULTIPLAYER</p>
            </motion.div>

            <div className="w-full bg-uno-dark/80 backdrop-blur-xl p-8 rounded-3xl border border-uno-accent/30 neon-border-accent">
              <div className="flex items-center space-x-4 mb-6 border-b border-gray-700 pb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden">
                      {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xl">{name.charAt(0).toUpperCase()}</div>}
                  </div>
                  <div>
                      <h3 className="text-white font-bold">{name}</h3>
                      <p className="text-xs text-uno-accent font-mono">Rank: Bronze III (MMR: 1200)</p>
                  </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">DISPLAY NAME</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-uno-accent transition-colors"
                    placeholder="Enter your name"
                    maxLength={12}
                  />
                </div>

                <div className="pt-4 space-y-4">
                  <button 
                    onClick={handleCreateRoom}
                    disabled={!name}
                    className="w-full bg-gradient-to-r from-uno-accent to-purple-600 hover:from-purple-500 hover:to-uno-accent text-white font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(157,0,255,0.4)] hover:shadow-[0_0_25px_rgba(157,0,255,0.6)]"
                  >
                    CREATE PRIVATE ROOM
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-sm font-bold">OR</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                  </div>

                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="flex-grow bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-uno-blue text-center font-mono text-xl tracking-widest uppercase"
                      placeholder="CODE"
                      maxLength={6}
                    />
                    <button 
                      onClick={handleJoinRoom}
                      disabled={!name || roomCode.length < 4}
                      className="bg-uno-blue hover:bg-blue-500 text-white font-bold px-8 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed neon-border-blue"
                    >
                      JOIN
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
