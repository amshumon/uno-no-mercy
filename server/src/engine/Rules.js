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
        [CARD_TYPES.WILD_DRAW_TEN]: 10,
        [CARD_TYPES.TOXIC_DRAW]: 5,
        [CARD_TYPES.MEGA_DRAW]: 10,
        [CARD_TYPES.TRAP_CARD]: 3,
      };

      const cardVal = drawValues[card.type] || 0;
      const topVal = drawValues[topDiscard.type] || 0;

      // In UNO No Mercy, you can stack a + card of equal or higher value
      if (cardVal > 0 && cardVal >= topVal) {
        return true;
      }
      
      // Mirror cards can be played on any draw penalty
      if (card.type === CARD_TYPES.MIRROR_CARD || card.type === CARD_TYPES.REFLECT_DRAW || card.type === CARD_TYPES.SHIELD_CARD) {
          return true;
      }

      return false; // Cannot play any other card if there's a penalty
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
