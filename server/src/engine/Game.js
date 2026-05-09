const { DeckManager, CARD_TYPES, COLORS } = require('./Deck');
const { Player } = require('./Player');
const { Rules } = require('./Rules');

const GAME_STATE = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

class Game {
  constructor(roomId, options = {}) {
    this.id = roomId;
    this.players = [];
    this.spectators = [];
    this.state = GAME_STATE.LOBBY;
    this.deckManager = new DeckManager();
    this.currentTurnIndex = 0;
    this.direction = 1; // 1 for clockwise, -1 for counter-clockwise
    this.activeDrawPenalty = 0;
    this.currentColor = null;
    this.history = [];
    this.chat = [];
    
    // Timers & Queue
    this.turnTimer = null;
    this.turnDuration = options.turnDuration || 15000; // 15 seconds
    this.turnEndTime = null;
    this.actionQueue = []; // Future use for resolving complex chain effects
    
    // Settings
    this.maxPlayers = options.maxPlayers || 10;
    this.startingHandSize = options.startingHandSize || 7;
    this.mercyLimit = options.mercyLimit || 25;
    this.mercyRule = options.mercyRule !== undefined ? options.mercyRule : true; 
    this.stacking = options.stacking !== undefined ? options.stacking : true;
    this.betAmount = options.betAmount || 0;
    this.pot = 0;
    this.winners = [];
  }

  addPlayer(socketId, name, avatar, isBot = false) {
    if (this.players.length >= this.maxPlayers && this.state === GAME_STATE.LOBBY) {
      throw new Error("Room is full");
    }
    const player = new Player(socketId, name, avatar, isBot);
    this.players.push(player);
    return player;
  }

  startGame() {
    if (this.players.length < 2) throw new Error("Need at least 2 players");
    
    this.state = GAME_STATE.PLAYING;
    this.deckManager = new DeckManager();
    this.activeDrawPenalty = 0;
    this.direction = 1;
    this.pot = this.players.length * this.betAmount;
    
    // Deduct bet
    this.players.forEach(p => {
        p.balance -= this.betAmount;
        p.isFinished = false;
        p.finishRank = null;
    });

    this.winners = [];
    
    // Deal custom number of cards to each player
    for (const player of this.players) {
      player.hand = this.deckManager.draw(this.startingHandSize);
    }

    // Draw initial card
    let initialCard;
    do {
      initialCard = this.deckManager.draw(1)[0];
      this.deckManager.discard(initialCard);
    } while (initialCard.isWild || initialCard.type !== CARD_TYPES.NUMBER);

    this.currentColor = initialCard.color;
    this.currentTurnIndex = Math.floor(Math.random() * this.players.length);
    this.history.push({ type: 'start', message: `Game started! Pot: ₹${this.pot}` });
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  nextTurn(skipCount = 1) {
    for (let i = 0; i < skipCount; i++) {
        this.currentTurnIndex = (this.currentTurnIndex + this.direction + this.players.length) % this.players.length;
        
        // Skip finished or eliminated players
        let attempts = 0;
        while ((this.players[this.currentTurnIndex].isFinished || (this.players[this.currentTurnIndex].hand.length >= this.mercyLimit && this.mercyRule)) && attempts < this.players.length) {
            this.currentTurnIndex = (this.currentTurnIndex + this.direction + this.players.length) % this.players.length;
            attempts++;
        }
    }
  }

  drawCards(playerId, count = 1) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error("Player not found");
    if (player.id !== this.getCurrentPlayer().id) throw new Error("Not your turn");

    let drawnCards = [];

    if (this.activeDrawPenalty === -1) {
        // Color Roulette
        let found = false;
        while (!found) {
            const card = this.deckManager.draw(1)[0];
            drawnCards.push(card);
            player.addCards([card]);
            if (card.color === this.currentColor || card.isWild) found = true;
            if (this.mercyRule && player.getHandSize() >= this.mercyLimit) break;
        }
        this.activeDrawPenalty = 0;
    } else if (this.activeDrawPenalty > 0) {
        drawnCards = this.deckManager.draw(this.activeDrawPenalty);
        player.addCards(drawnCards);
        this.activeDrawPenalty = 0;
    } else {
        // DRAW ONLY ONE CARD (User Request)
        drawnCards = this.deckManager.draw(1);
        player.addCards(drawnCards);
    }
    
    this.history.push({ type: 'draw', player: player.name, count: drawnCards.length });

    // Check Mercy Rule
    if (this.mercyRule && player.getHandSize() >= this.mercyLimit) {
       this.history.push({ type: 'eliminated', player: player.name, reason: 'mercy_rule' });
    }

    this.nextTurn();
    return drawnCards;
  }

  playCard(socketId, cardId, chosenColor = null, targetId = null) {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) throw new Error("Player not found");
    if (player.id !== this.getCurrentPlayer().id) throw new Error("Not your turn");

    const card = player.hand.find(c => c.id === cardId);
    if (!card) throw new Error("Card not in hand");

    const topDiscard = this.deckManager.getTopDiscard();

    if (!Rules.canPlayCard(card, topDiscard, this.activeDrawPenalty, this.currentColor, this.isColorLocked)) {
       throw new Error("Invalid move");
    }

    // Play the card
    player.removeCard(cardId);
    this.deckManager.discard(card);
    
    if (card.isWild) {
        if (!chosenColor || !COLORS.includes(chosenColor)) {
             // Revert if invalid color
             player.addCards([card]);
             this.deckManager.discardPile.pop();
             throw new Error("Must choose a valid color");
        }
        this.currentColor = chosenColor;
    }
    this.currentColor = card.isWild ? chosenColor : card.color;
    this.history.push({ type: 'play', player: player.name, card: card });

    // Reset Uno status if player plays a card and still has more than 1 card
    if (player.getHandSize() > 1) {
        player.hasSaidUno = false;
    }

    // Handle card effects
    let skipNext = false;
    let targetPlayer = null;
    if (targetId) {
        targetPlayer = this.players.find(p => p.id === targetId);
    }

    switch (card.type) {
        case CARD_TYPES.NUMBER:
            if (card.value === 0) {
                // Pass hands around
                const hands = this.players.map(p => p.hand);
                if (this.direction === 1) {
                    hands.unshift(hands.pop());
                } else {
                    hands.push(hands.shift());
                }
                this.players.forEach((p, i) => p.hand = hands[i]);
                this.history.push({ type: 'effect', message: `Everyone passed their hands!`});
            } else if (card.value === 7) {
                // Swap hands with target
                if (targetPlayer) {
                    const tempHand = player.hand;
                    player.hand = targetPlayer.hand;
                    targetPlayer.hand = tempHand;
                    this.history.push({ type: 'effect', message: `${player.name} swapped hands with ${targetPlayer.name}!`});
                }
            }
            break;
        case CARD_TYPES.REVERSE:
            this.direction *= -1;
            if (this.players.length === 2) skipNext = true;
            break;
        case CARD_TYPES.SKIP:
            skipNext = true;
            break;
        case CARD_TYPES.SKIP_EVERYONE:
            // It's your turn again!
            this.currentTurnIndex = (this.players.indexOf(player) - this.direction + this.players.length) % this.players.length;
            break;
        case CARD_TYPES.DISCARD_ALL:
            const colorToDiscard = card.color;
            const sameColorCards = player.hand.filter(c => c.color === colorToDiscard);
            sameColorCards.forEach(c => {
                player.removeCard(c.id);
                this.deckManager.discard(c);
            });
            this.history.push({ type: 'effect', message: `${player.name} discarded all ${colorToDiscard} cards!`});
            break;
        case CARD_TYPES.DRAW_TWO:
            this.activeDrawPenalty += 2;
            break;
        case CARD_TYPES.WILD_DRAW_FOUR:
            this.activeDrawPenalty += 4;
            break;
        case CARD_TYPES.WILD_DRAW_SIX:
            this.activeDrawPenalty += 6;
            break;
        case CARD_TYPES.WILD_DRAW_TEN:
            this.activeDrawPenalty += 10;
            break;
        case CARD_TYPES.WILD_REVERSE_DRAW:
            this.direction *= -1;
            this.activeDrawPenalty += 4;
            // In 2 player, reverse acts like skip
            if (this.players.length === 2) skipNext = true;
            break;
        case CARD_TYPES.WILD_COLOR_ROULETTE:
            // Handled in next player's draw logic or as a special state
            this.activeDrawPenalty = -1; // Special flag for Color Roulette
            break;
    }

    // Check Win Condition (Elimination Mode)
    if (player.getHandSize() === 0) {
        player.isFinished = true;
        this.winners.push(player.id);
        player.finishRank = this.winners.length;
        
        // If 1st place, they get the pot
        if (player.finishRank === 1) {
            player.balance += this.pot;
            this.history.push({ type: 'win', message: `${player.name} takes 1st place and ₹${this.pot}!` });
        } else {
            this.history.push({ type: 'win', message: `${player.name} finished at rank ${player.finishRank}!` });
        }

        const remainingPlayers = this.players.filter(p => !p.isFinished && p.hand.length < this.mercyLimit);
        if (remainingPlayers.length <= 1) {
            this.state = GAME_STATE.FINISHED;
            this.history.push({ type: 'end', message: 'Game Over! The tournament has ended.' });
        }
    }

    if (card.type !== CARD_TYPES.SKIP_EVERYONE) {
         this.nextTurn(skipNext ? 2 : 1);
    }

    return { success: true };
  }

  sayUno(socketId) {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) return { success: false, message: "Player not found" };
    
    if (player.getHandSize() <= 2) {
        player.hasSaidUno = true;
        this.history.push({ type: 'uno', player: player.name });
        return { success: true };
    }
    return { success: false, message: "Can only say UNO when you have 2 or fewer cards" };
  }

  getState() {
    return {
      id: this.id,
      state: this.state,
      pot: this.pot,
      betAmount: this.betAmount,
      players: this.players.map(p => ({
         id: p.id,
         name: p.name,
         avatar: p.avatar,
         handSize: p.getHandSize(),
         hasSaidUno: p.hasSaidUno,
         isFrozen: p.isFrozen,
         isBot: p.isBot,
         socketId: p.socketId,
         connected: p.connected,
         balance: p.balance,
         isFinished: p.isFinished,
         finishRank: p.finishRank
      })),
      currentTurnIndex: this.currentTurnIndex,
      direction: this.direction,
      topDiscard: this.deckManager.getTopDiscard(),
      currentColor: this.currentColor,
      activeDrawPenalty: this.activeDrawPenalty,
      mercyRule: this.mercyRule,
      stacking: this.stacking,
      maxPlayers: this.maxPlayers,
      history: this.history.slice(-10)
    };
  }
}

module.exports = { Game, GAME_STATE };
