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
    this.mercyRule = options.mercyRule !== undefined ? options.mercyRule : true; // Eliminate at 25 cards
    this.stacking = options.stacking !== undefined ? options.stacking : true;
    this.sevenZeroRule = options.sevenZeroRule || false; // Pass hands on 0/7
  }

  addPlayer(socketId, name, avatar, isBot = false) {
    if (this.players.length >= this.maxPlayers && this.state === GAME_STATE.LOBBY) {
      throw new Error("Room is full");
    }
    if (this.state !== GAME_STATE.LOBBY) {
       // Could support reconnecting here
       const existingPlayer = this.players.find(p => p.name === name && !p.connected);
       if (existingPlayer) {
           existingPlayer.socketId = socketId;
           existingPlayer.connected = true;
           return existingPlayer;
       }
       throw new Error("Game has already started");
    }
    const player = new Player(socketId, name, avatar, isBot);
    this.players.push(player);
    return player;
  }

  removePlayer(playerId) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      if (this.state === GAME_STATE.LOBBY) {
        this.players.splice(playerIndex, 1);
      } else {
        // Mark as disconnected or eliminate
        this.players[playerIndex].connected = false;
        // Optional: Replace with bot
        this.players[playerIndex].isBot = true; 
      }
    }
  }

  startGame() {
    if (this.players.length < 2) throw new Error("Need at least 2 players");
    
    this.state = GAME_STATE.PLAYING;
    this.deckManager = new DeckManager();
    this.activeDrawPenalty = 0;
    this.direction = 1;
    
    // Deal 7 cards to each player
    for (const player of this.players) {
      player.hand = this.deckManager.draw(7);
    }

    // Draw initial card
    let initialCard;
    do {
      initialCard = this.deckManager.draw(1)[0];
      this.deckManager.discard(initialCard);
    } while (
        initialCard.isWild || 
        initialCard.type === CARD_TYPES.SKIP || 
        initialCard.type === CARD_TYPES.REVERSE || 
        initialCard.type === CARD_TYPES.DRAW_TWO || 
        initialCard.type === CARD_TYPES.DISCARD_ALL || 
        initialCard.type === CARD_TYPES.SKIP_EVERYONE
    );

    this.currentColor = initialCard.color;
    this.currentTurnIndex = Math.floor(Math.random() * this.players.length);
    this.history.push({ type: 'start', message: 'Game started' });
  }

  startTurnTimer() {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    if (this.state !== GAME_STATE.PLAYING) return;
    
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) return;

    // Fast-track bot turns
    if (currentPlayer.isBot) {
        this.turnDuration = 3000; // Bots play in 3 seconds
    } else {
        this.turnDuration = this.maxTurnDuration || 15000;
    }

    this.turnEndTime = Date.now() + this.turnDuration;
    this.turnTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.turnDuration);
  }

  handleTimeout() {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) return;
    
    this.history.push({ type: 'timeout', player: currentPlayer.name });
    
    try {
        if (currentPlayer.isBot) {
             // Basic Bot Logic: find first valid card
             const topDiscard = this.deckManager.getTopDiscard();
             let played = false;
             for (const card of currentPlayer.hand) {
                 if (Rules.canPlayCard(card, topDiscard, this.activeDrawPenalty, this.currentColor, this.isColorLocked)) {
                     // Play card
                     this.playCard(currentPlayer.socketId, card.id, card.isWild ? COLORS[Math.floor(Math.random() * COLORS.length)] : null, null);
                     played = true;
                     break;
                 }
             }
             if (!played) {
                 const drawnCards = this.drawCards(currentPlayer.id, 1);
                 if (this.onTimeout) this.onTimeout(currentPlayer.id, drawnCards);
             }
        } else {
             // Human timed out -> draw card
             const drawnCards = this.drawCards(currentPlayer.id, 1);
             if (this.onTimeout) {
                 this.onTimeout(currentPlayer.id, drawnCards);
             }
        }
    } catch (e) {
        console.error("Auto-play draw failed", e);
        this.nextTurn();
        if (this.onTimeout) this.onTimeout(null, null);
    }
  }

  clearTurnTimer() {
    if (this.turnTimer) {
        clearTimeout(this.turnTimer);
        this.turnTimer = null;
    }
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  nextTurn(skipCount = 1) {
    for (let i = 0; i < skipCount; i++) {
        this.currentTurnIndex = (this.currentTurnIndex + this.direction + this.players.length) % this.players.length;
        
        // Handle frozen players (No Mercy specialty)
        if (this.players[this.currentTurnIndex].isFrozen) {
            this.players[this.currentTurnIndex].isFrozen = false; // Consume freeze
            this.history.push({ type: 'effect', message: `${this.players[this.currentTurnIndex].name} is frozen and skips their turn!` });
            i--; // Effectively skip this player without consuming a skipCount step
            this.currentTurnIndex = (this.currentTurnIndex + this.direction + this.players.length) % this.players.length;
        }

        // Skip eliminated players
        while (this.players[this.currentTurnIndex].hand.length >= 25 && this.mercyRule) {
            this.currentTurnIndex = (this.currentTurnIndex + this.direction + this.players.length) % this.players.length;
        }
    }
  }

  drawCards(playerId, count = 1) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error("Player not found");
    if (player.id !== this.getCurrentPlayer().id) throw new Error("Not your turn");

    const topDiscard = this.deckManager.getTopDiscard();
    let drawnCards = [];

    if (this.activeDrawPenalty === -1) {
        // Color Roulette: Draw until chosen color matches
        let found = false;
        while (!found) {
            const card = this.deckManager.draw(1)[0];
            drawnCards.push(card);
            player.addCards([card]);
            if (card.color === this.currentColor || card.isWild) {
                found = true;
            }
            if (this.mercyRule && player.getHandSize() >= 25) break;
        }
        this.activeDrawPenalty = 0;
        this.history.push({ type: 'draw', player: player.name, reason: 'roulette', count: drawnCards.length });
    } else if (this.activeDrawPenalty > 0) {
        // Normal penalty draw
        drawnCards = this.deckManager.draw(this.activeDrawPenalty);
        player.addCards(drawnCards);
        this.history.push({ type: 'draw', player: player.name, count: this.activeDrawPenalty });
        this.activeDrawPenalty = 0;
    } else {
        // No Mercy Rule: Draw until playable
        let found = false;
        while (!found) {
            const card = this.deckManager.draw(1)[0];
            drawnCards.push(card);
            player.addCards([card]);
            if (Rules.canPlayCard(card, topDiscard, 0, this.currentColor)) {
                found = true;
            }
            // In No Mercy, you can choose to STOP drawing after 1 card if you want? 
            // Actually, official rules say "Keep drawing until you can play".
            if (this.mercyRule && player.getHandSize() >= 25) break;
        }
        this.history.push({ type: 'draw', player: player.name, reason: 'no_mercy', count: drawnCards.length });
    }
    
    // Check Mercy Rule
    if (this.mercyRule && player.getHandSize() >= 25) {
       this.history.push({ type: 'eliminated', player: player.name, reason: 'mercy_rule' });
       // Logic to remove player or skip their turns is handled in nextTurn()
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

    // Check Win Condition
    if (player.getHandSize() === 0) {
        this.state = GAME_STATE.FINISHED;
        this.history.push({ type: 'win', player: player.name });
        return { winner: player };
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

  challengeUno(socketId, targetId) {
    const challenger = this.players.find(p => p.socketId === socketId);
    const target = this.players.find(p => p.id === targetId);
    if (!challenger || !target) return { success: false, message: "Player not found" };

    if (target.getHandSize() === 1 && !target.hasSaidUno) {
        const penalty = 4; // Harsh No Mercy penalty
        target.addCards(this.deckManager.draw(penalty));
        this.history.push({ type: 'challenge', challenger: challenger.name, target: target.name, penalty });
        return { success: true, caught: true };
    }
    return { success: true, caught: false };
  }

  getState() {
    return {
      id: this.id,
      state: this.state,
      players: this.players.map(p => ({
         id: p.id,
         name: p.name,
         avatar: p.avatar,
         handSize: p.getHandSize(),
         hasSaidUno: p.hasSaidUno,
         isFrozen: p.isFrozen,
         isBot: p.isBot,
         socketId: p.socketId,
         connected: p.connected
      })),
      currentTurnIndex: this.currentTurnIndex,
      direction: this.direction,
      topDiscard: this.deckManager.getTopDiscard(),
      currentColor: this.currentColor,
      activeDrawPenalty: this.activeDrawPenalty,
      mercyRule: this.mercyRule,
      stacking: this.stacking,
      maxPlayers: this.maxPlayers,
      history: this.history.slice(-10),
      turnEndTime: this.turnEndTime
    };
  }
}

module.exports = { Game, GAME_STATE };
