const { Game } = require('../engine/Game');

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Game instance
    this.socketToRoom = new Map(); // socketId -> roomId
  }

  createRoom(roomId, options) {
    if (this.rooms.has(roomId)) {
      throw new Error("Room already exists");
    }
    const game = new Game(roomId, options);
    this.rooms.set(roomId, game);
    return game;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, socketId, name, avatar) {
    const game = this.rooms.get(roomId);
    if (!game) {
      throw new Error("Room not found");
    }
    const player = game.addPlayer(socketId, name, avatar);
    this.socketToRoom.set(socketId, roomId);
    return { game, player };
  }

  leaveRoom(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (roomId) {
      const game = this.rooms.get(roomId);
      if (game) {
        const player = game.players.find(p => p.socketId === socketId);
        if (player) {
            game.removePlayer(player.id);
        }
        
        if (game.players.filter(p => !p.isBot).length === 0) {
            this.rooms.delete(roomId);
        }
      }
      this.socketToRoom.delete(socketId);
      return { roomId, game };
    }
    return null;
  }

  getRoomBySocket(socketId) {
     const roomId = this.socketToRoom.get(socketId);
     return roomId ? this.rooms.get(roomId) : null;
  }
}

module.exports = new RoomManager();
