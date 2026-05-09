const crypto = require('crypto');

class Player {
  constructor(socketId, name, avatar = 'default', isBot = false) {
    this.id = crypto.randomUUID();
    this.socketId = socketId; // null for bots
    this.name = name;
    this.avatar = avatar;
    this.isBot = isBot;
    this.hand = [];
    this.isReady = false;
    this.connected = true;
    this.score = 0;
    this.hasSaidUno = false;
    this.isFrozen = false;
    this.balance = 1000; // Starting Rupees
    this.isFinished = false;
    this.finishRank = null;
  }

  addCards(cards) {
    this.hand.push(...cards);
  }

  removeCard(cardId) {
    const index = this.hand.findIndex(c => c.id === cardId);
    if (index !== -1) {
      return this.hand.splice(index, 1)[0];
    }
    return null;
  }

  hasCard(cardId) {
    return this.hand.some(c => c.id === cardId);
  }

  getHandSize() {
    return this.hand.length;
  }
}

module.exports = { Player };
