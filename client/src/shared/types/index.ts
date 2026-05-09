export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | null;

export enum CardType {
  NUMBER = 'number',
  SKIP = 'skip',
  REVERSE = 'reverse',
  DRAW_TWO = 'draw_two',
  WILD = 'wild',
  WILD_DRAW_FOUR = 'wild_draw_four',
  // No Mercy Specials
  WILD_DRAW_SIX = 'wild_draw_six',
  WILD_DRAW_TEN = 'wild_draw_ten',
  DOUBLE_SKIP = 'double_skip',
  REVERSE_ALL = 'reverse_all',
  EVERYONE_DRAW = 'everyone_draw',
  SWAP_HANDS = 'swap_hands',
  SHUFFLE_HANDS = 'shuffle_hands',
  TARGETED_DRAW = 'targeted_draw',
  REFLECT_DRAW = 'reflect_draw',
  BLOCK_DRAW = 'block_draw',
  STACK_MULTIPLIER = 'stack_multiplier',
  INSTANT_SKIP = 'instant_skip',
  FORCED_COLOR_LOCK = 'forced_color_lock',
  WILD_CHAOS = 'wild_chaos',
  TRADE_ALL_HANDS = 'trade_all_hands',
  DISCARD_ALL_SAME_COLOR = 'discard_all_same_color',
  DISCARD_ALL_SAME_NUMBER = 'discard_all_same_number',
  TAKE_FROM_OPPONENT = 'take_from_opponent',
  TOXIC_DRAW = 'toxic_draw',
  MEGA_DRAW = 'mega_draw',
  WILD_REVERSE_DRAW = 'wild_reverse_draw',
  SUDDEN_DEATH = 'sudden_death',
  FREEZE_TURN = 'freeze_turn',
  STEAL_TURN = 'steal_turn',
  MIRROR_CARD = 'mirror_card',
  SHIELD_CARD = 'shield_card',
  BOMB_CARD = 'bomb_card',
  TRAP_CARD = 'trap_card'
}

export interface Card {
  id: string;
  type: CardType | string;
  color: CardColor;
  value: number | null;
  isWild: boolean;
}

export interface Player {
  id: string;
  socketId: string | null;
  name: string;
  avatar: string;
  isBot: boolean;
  handSize: number;
  connected: boolean;
  score: number;
}

export interface GameState {
  id: string;
  state: 'lobby' | 'playing' | 'finished';
  players: Player[];
  currentTurnIndex: number;
  direction: number;
  topDiscard: Card | null;
  currentColor: CardColor;
  activeDrawPenalty: number;
  history: any[];
  maxPlayers: number;
}
