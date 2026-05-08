// UNO No Mercy Deck - All card types and deck management

const COLORS = ['red', 'blue', 'green', 'yellow'];

const CARD_TYPES = {
  NUMBER: 'number',
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'draw_two',
  WILD: 'wild',
  WILD_DRAW_FOUR: 'wild_draw_four',
  // Special No Mercy Cards
  WILD_DRAW_SIX: 'wild_draw_six',
  WILD_DRAW_TEN: 'wild_draw_ten',
  DOUBLE_SKIP: 'double_skip',
  REVERSE_ALL: 'reverse_all',
  EVERYONE_DRAW: 'everyone_draw',
  SWAP_HANDS: 'swap_hands',
  SHUFFLE_HANDS: 'shuffle_hands',
  TARGETED_DRAW: 'targeted_draw',
  REFLECT_DRAW: 'reflect_draw',
  BLOCK_DRAW: 'block_draw',
  STACK_MULTIPLIER: 'stack_multiplier',
  INSTANT_SKIP: 'instant_skip',
  FORCED_COLOR_LOCK: 'forced_color_lock',
  WILD_CHAOS: 'wild_chaos',
  TRADE_ALL_HANDS: 'trade_all_hands',
  DISCARD_ALL_SAME_COLOR: 'discard_all_same_color',
  DISCARD_ALL_SAME_NUMBER: 'discard_all_same_number',
  TAKE_FROM_OPPONENT: 'take_from_opponent',
  TOXIC_DRAW: 'toxic_draw',
  MEGA_DRAW: 'mega_draw',
  WILD_REVERSE_DRAW: 'wild_reverse_draw',
  SUDDEN_DEATH: 'sudden_death',
  FREEZE_TURN: 'freeze_turn',
  STEAL_TURN: 'steal_turn',
  MIRROR_CARD: 'mirror_card',
  SHIELD_CARD: 'shield_card',
  BOMB_CARD: 'bomb_card',
  TRAP_CARD: 'trap_card'
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

  // Number cards: 0-9 in each color
  for (const color of COLORS) {
    // One 0 card per color
    deck.push(createCard(CARD_TYPES.NUMBER, color, 0));
    // Two of each 1-9 per color
    for (let num = 1; num <= 9; num++) {
      deck.push(createCard(CARD_TYPES.NUMBER, color, num));
      deck.push(createCard(CARD_TYPES.NUMBER, color, num));
    }
  }

  // Action cards: 2 of each per color
  for (const color of COLORS) {
    for (let i = 0; i < 2; i++) {
      deck.push(createCard(CARD_TYPES.SKIP, color));
      deck.push(createCard(CARD_TYPES.REVERSE, color));
      deck.push(createCard(CARD_TYPES.DRAW_TWO, color));
    }
    // 1 Discard All per color
    deck.push(createCard(CARD_TYPES.DISCARD_ALL, color));
    // 1 Skip Everyone per color
    deck.push(createCard(CARD_TYPES.SKIP_EVERYONE, color));
  }

  // Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push(createCard(CARD_TYPES.WILD));
    deck.push(createCard(CARD_TYPES.WILD_DRAW_FOUR));
  }
  for (let i = 0; i < 2; i++) {
    deck.push(createCard(CARD_TYPES.WILD_DRAW_SIX));
    deck.push(createCard(CARD_TYPES.WILD_DRAW_TEN));
    deck.push(createCard(CARD_TYPES.WILD_REVERSE_DRAW_FOUR));
  }
  // 1 Wild Color Roulette
  deck.push(createCard(CARD_TYPES.WILD_COLOR_ROULETTE));

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
