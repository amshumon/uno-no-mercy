import type { Card } from './types';
import { CardType } from './types';

export default class Rules {
  static canPlayCard(card: Card, topDiscard: Card | null, activeDrawPenalty: number, currentColor: string | null, isColorLocked: boolean = false): boolean {
    if (!topDiscard) return true;

    // If color is locked (FORCED COLOR LOCK), only cards of that color can be played
    if (isColorLocked && currentColor && card.color !== currentColor && !card.isWild) {
        return false;
    }

    // If there's an active draw penalty (Stacking Rule)
    if (activeDrawPenalty > 0) {
      const drawValues: Record<string, number> = {
        [CardType.DRAW_TWO]: 2,
        [CardType.WILD_DRAW_FOUR]: 4,
        [CardType.WILD_REVERSE_DRAW]: 4,
        [CardType.WILD_DRAW_SIX]: 6,
        [CardType.WILD_DRAW_TEN]: 10
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
      if (card.type === CardType.NUMBER) {
        return card.value === topDiscard.value;
      }
      return true;
    }
    
    return false;
  }
}
