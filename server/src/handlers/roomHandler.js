const roomManager = require('../services/RoomManager');

module.exports = (io, socket) => {
  socket.on('room:create', ({ name, avatar, options }, callback) => {
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const game = roomManager.createRoom(roomId, options);
      const { player } = roomManager.joinRoom(roomId, socket.id, name, avatar);
      
      game.onTimeout = (timedOutPlayerId, drawnCards) => {
         io.to(game.id).emit('game:update', game.getState());
         if (timedOutPlayerId && drawnCards) {
             const timedOutPlayer = game.players.find(p => p.id === timedOutPlayerId);
             if (timedOutPlayer && timedOutPlayer.socketId) {
                 io.to(timedOutPlayer.socketId).emit('game:hand', timedOutPlayer.hand);
             }
         }
      };

      socket.join(roomId);
      
      callback({
        success: true,
        roomId,
        playerId: player.id,
        gameState: game.getState()
      });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });

  socket.on('room:join', ({ roomId, name, avatar }, callback) => {
    try {
      const roomIdUpper = roomId.toUpperCase();
      const { game, player } = roomManager.joinRoom(roomIdUpper, socket.id, name, avatar);
      
      socket.join(roomIdUpper);
      socket.to(roomIdUpper).emit('room:update', game.getState());
      
      callback({
        success: true,
        roomId: roomIdUpper,
        playerId: player.id,
        gameState: game.getState()
      });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });

  socket.on('room:add_bot', () => {
    try {
        const game = roomManager.getRoomBySocket(socket.id);
        if (game && game.state === 'lobby') {
            const botCount = game.players.filter(p => p.isBot).length;
            game.addPlayer(null, `Bot ${botCount + 1}`, 'default', true);
            io.to(game.id).emit('room:update', game.getState());
        }
    } catch(e) {
        console.error("Add bot failed", e);
    }
  });

  socket.on('room:update_options', (options) => {
    try {
        const game = roomManager.getRoomBySocket(socket.id);
        if (game && game.state === 'lobby') {
            // Only allow room creator (first player) to update options
            if (game.players[0].socketId === socket.id) {
                game.mercyRule = options.mercyRule !== undefined ? options.mercyRule : game.mercyRule;
                game.stacking = options.stacking !== undefined ? options.stacking : game.stacking;
                game.maxPlayers = options.maxPlayers || game.maxPlayers;
                io.to(game.id).emit('room:update', game.getState());
            }
        }
    } catch(e) {
        console.error("Update options failed", e);
    }
  });

  socket.on('room:get_state', ({ roomId, name }) => {
    const game = roomManager.getRoom(roomId);
    if (game) {
      if (name) {
          const player = game.players.find(p => p.name === name);
          if (player) {
              player.socketId = socket.id;
              player.connected = true;
          }
      }
      socket.join(roomId);
      socket.emit('room:update', game.getState());
      io.to(game.id).emit('room:update', game.getState()); // Update others too
    }
  });

  socket.on('disconnect', () => {
    const result = roomManager.leaveRoom(socket.id);
    if (result && result.game) {
      io.to(result.roomId).emit('room:update', result.game.getState());
    }
  });
};
