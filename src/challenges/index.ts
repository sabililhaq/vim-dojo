// Play order is the order of these spreads. Add a new category file, then register it here.
import { motionChallenges } from './motion';
import { operatorChallenges } from './operator';
import { textObjectChallenges } from './text-object';
import { visualChallenges } from './visual';
import type { Challenge } from './types';

export type { Category, Challenge, Position } from './types';

export const challengeSets = {
  motion: motionChallenges,
  operator: operatorChallenges,
  'text-object': textObjectChallenges,
  visual: visualChallenges,
} as const;

export const vimChallenges: Challenge[] = [
  ...motionChallenges,
  ...operatorChallenges,
  ...textObjectChallenges,
  ...visualChallenges,
];
