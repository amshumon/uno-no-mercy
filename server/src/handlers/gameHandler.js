const roomManager = require('../services/RoomManager');

module.exports = (io, socket) => {
  socket.on('game:start', (callback) => {
    try {
      const game = roomManager.getRoomBySocket(socket.id);
      if (!game) throw new Error("Not in a room");
      
      game.startGame();
      
      io.to(game.id).emit('game:update', game.getState());
      
      game.players.forEach(player => {
        if (!player.isBot && player.socketId) {
            io.to(player.socketId).emit('game:hand', player.hand);
        }
      });

      if (callback) callback({ success: true });
    } catch (error) {
      if (callback) callback({ success: false, message: error.message });
    }
  });

  socket.on('game:play_card', ({ cardId, chosenColor, targetId }, callback) => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) throw new Error("Not in a room");
      
      const result = room.playCard(socket.id, cardId, chosenColor, targetId);
      io.to(room.id).emit('game:update', room.getState());
      
      // Update hands for ALL players (in case of swap or steal)
      room.players.forEach(p => {
          if (p.socketId) io.to(p.socketId).emit('game:hand', p.hand);
      });
      
      if (result && result.winner) {
        io.to(room.id).emit('game:over', { winner: { name: result.winner.name } });
      }
      
      callback({ success: true });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });

  socket.on('game:draw', (callback) => {
      try {
          const game = roomManager.getRoomBySocket(socket.id);
          if (!game) throw new Error("Not in a room");
          
          const player = game.players.find(p => p.socketId === socket.id);
          if (!player) throw new Error("Player not found");

          const drawnCards = game.drawCards(player.id);
          
          io.to(game.id).emit('game:update', game.getState());
          io.to(socket.id).emit('game:hand', player.hand);
          io.to(socket.id).emit('game:drawn_cards', drawnCards);

          if (callback) callback({ success: true, drawnCards });
      } catch (error) {
          if (callback) callback({ success: false, message: error.message });
      }
  });

  socket.on('game:dev_action', ({ action, payload }, callback) => {
    try {
       const room = roomManager.getRoomBySocket(socket.id);
       if (!room) throw new Error("Not in a room");
       
       const player = room.players.find(p => p.socketId === socket.id);
       if (!player) throw new Error("Not a player");

       if (action === 'spawn_card') {
           const { cardType, color, isWild } = payload;
           const newCard = {
               id: Math.random().toString(36).substring(2),
               type: cardType,
               color: color || null,
               value: null,
               isWild: isWild
           };
           player.addCards([newCard]);
       } else if (action === 'force_turn') {
           room.currentTurnIndex = room.players.findIndex(p => p.id === player.id);
           room.clearTurnTimer();
           room.startTurnTimer();
       } else if (action === 'clear_hand') {
           player.hand = [player.hand[0]]; // leave 1 card
       }

       io.to(room.id).emit('game:update', room.getState());
       socket.emit('game:hand', player.hand);
       
       if (callback) callback({ success: true });
    } catch(error) {
       if (callback) callback({ success: false, message: error.message });
    }
  });

  socket.on('game:chat', (message) => {
     const game = roomManager.getRoomBySocket(socket.id);
     if (game) {
         const player = game.players.find(p => p.socketId === socket.id);
         if (player) {
             const chatMsg = { sender: player.name, text: message, time: Date.now() };
             game.chat.push(chatMsg);
             io.to(game.id).emit('game:chat_new', chatMsg);
         }
     }
  });

  socket.on('game:say_uno', (callback) => {
      try {
          const game = roomManager.getRoomBySocket(socket.id);
          if (!game) throw new Error("Not in a room");
          
          const result = game.sayUno(socket.id);
          if (result.success) {
              io.to(game.id).emit('game:update', game.getState());
          }
          if (callback) callback(result);
      } catch (error) {
          if (callback) callback({ success: false, message: error.message });
      }
  });

  socket.on('game:challenge_uno', ({ targetId }, callback) => {
      try {
          const game = roomManager.getRoomBySocket(socket.id);
          if (!game) throw new Error("Not in a room");
          
          const result = game.challengeUno(socket.id, targetId);
          if (result.success) {
              io.to(game.id).emit('game:update', game.getState());
              // Update target hand
              const target = game.players.find(p => p.id === targetId);
              if (target && target.socketId) {
                  io.to(target.socketId).emit('game:hand', target.hand);
              }
          }
          if (callback) callback(result);
      } catch (error) {
          if (callback) callback({ success: false, message: error.message });
      }
  });
};
