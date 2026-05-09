const { CARD_TYPES } = require('./Deck');

class Rules {
  static canPlayCard(card, topDiscard, activeDrawPenalty, currentColor, isColorLocked = false) {
    // If color is locked (FORCED COLOR LOCK), only cards of that color can be played
    // even if the type matches. Wilds might still be allowed unless explicitly forbidden.
    if (isColorLocked && currentColor && card.color !== currentColor && !card.isWild) {
        return false;
    }

    // If there's an active draw penalty
    if (activeDrawPenalty > 0) {
      const drawValues = {
        [CARD_TYPES.DRAW_TWO]: 2,
        [CARD_TYPES.WILD_DRAW_FOUR]: 4,
        [CARD_TYPES.WILD_REVERSE_DRAW]: 4,
        [CARD_TYPES.WILD_DRAW_SIX]: 6,
        [CARD_TYPES.WILD_DRAW_TEN]: 10
      };

      const cardVal = drawValues[card.type] || 0;
      const topVal = drawValues[topDiscard.type] || 0;

      // In UNO No Mercy, you can stack a + card of equal or higher value
      return cardVal > 0 && cardVal >= topVal;
    }

    // Normal play
    if (card.isWild) return true;
    
    // Match by current color
    if (currentColor && card.color === currentColor) return true;
    
    // Match by type
    if (card.type === topDiscard.type) {
      if (card.type === CARD_TYPES.NUMBER) {
        return card.value === topDiscard.value;
      }
      return true;
    }
    
    return false;
  }
}

module.exports = { Rules };
