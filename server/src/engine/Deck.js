// UNO No Mercy Deck - All card types and deck management

const COLORS = ['red', 'blue', 'green', 'yellow'];

const CARD_TYPES = {
  NUMBER: 'number',
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'draw_two',
  DISCARD_ALL: 'discard_all',
  SKIP_EVERYONE: 'skip_everyone',
  WILD: 'wild',
  WILD_DRAW_FOUR: 'wild_draw_four',
  WILD_DRAW_SIX: 'wild_draw_six',
  WILD_DRAW_TEN: 'wild_draw_ten',
  WILD_REVERSE_DRAW: 'wild_reverse_draw',
  WILD_COLOR_ROULETTE: 'wild_color_roulette'
};

let cardIdCounter = 0;

function createCard(type, color = null, value = null) {
  return {
    id: `card_${++cardIdCounter}`,
    type,
    color,
    value,
    isWild: type.startsWith('wild'),
  };
}

function createDeck() {
  cardIdCounter = 0;
  const deck = [];
  
  // 1-9 for each color (no 0s in No Mercy action set, but some versions have them)
  // Show 'em No Mercy actually has 1-9 (2 of each) and action cards.
  for (const color of COLORS) {
    for (let i = 1; i <= 9; i++) {
      deck.push(createCard(CARD_TYPES.NUMBER, color, i));
      deck.push(createCard(CARD_TYPES.NUMBER, color, i));
    }
    
    // Action Cards (2 of each per color)
    for (let i = 0; i < 2; i++) {
      deck.push(createCard(CARD_TYPES.SKIP, color));
      deck.push(createCard(CARD_TYPES.REVERSE, color));
      deck.push(createCard(CARD_TYPES.DRAW_TWO, color));
      deck.push(createCard(CARD_TYPES.DISCARD_ALL, color));
    }
    
    // 0s (special rule: swap hands) - 1 per color
    deck.push(createCard(CARD_TYPES.NUMBER, color, 0));
    
    // 1 Skip Everyone per color
    deck.push(createCard(CARD_TYPES.SKIP_EVERYONE, color));
  }

  // Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push(createCard(CARD_TYPES.WILD));
    deck.push(createCard(CARD_TYPES.WILD_DRAW_FOUR));
  }
  
  // No Mercy Super Wilds
  for (let i = 0; i < 2; i++) {
    deck.push(createCard(CARD_TYPES.WILD_DRAW_SIX));
    deck.push(createCard(CARD_TYPES.WILD_DRAW_TEN));
    deck.push(createCard(CARD_TYPES.WILD_REVERSE_DRAW));
    deck.push(createCard(CARD_TYPES.WILD_COLOR_ROULETTE));
  }

  return deck;
}

// Fisher-Yates shuffle
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

class DeckManager {
  constructor() {
    this.drawPile = shuffleDeck(createDeck());
    this.discardPile = [];
  }

  draw(count = 1) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) {
        this.reshuffleDiscard();
      }
      if (this.drawPile.length === 0) {
        break; // No cards left at all
      }
      drawn.push(this.drawPile.pop());
    }
    return drawn;
  }

  drawUntilColor(targetColor) {
    const drawn = [];
    while (this.drawPile.length > 0 || this.discardPile.length > 1) {
      if (this.drawPile.length === 0) {
        this.reshuffleDiscard();
      }
      if (this.drawPile.length === 0) break;
      const card = this.drawPile.pop();
      drawn.push(card);
      if (card.color === targetColor) break;
    }
    return drawn;
  }

  discard(card) {
    this.discardPile.push(card);
  }

  getTopDiscard() {
    return this.discardPile[this.discardPile.length - 1] || null;
  }

  reshuffleDiscard() {
    if (this.discardPile.length <= 1) return;
    const topCard = this.discardPile.pop();
    // Reset wild card colors before reshuffling
    this.drawPile = shuffleDeck(
      this.discardPile.map((card) => {
        if (card.isWild) {
          return { ...card, color: null };
        }
        return card;
      })
    );
    this.discardPile = [topCard];
  }

  getDrawPileCount() {
    return this.drawPile.length;
  }

  getDiscardPileCount() {
    return this.discardPile.length;
  }
}

module.exports = { DeckManager, CARD_TYPES, COLORS, createDeck, shuffleDeck };
