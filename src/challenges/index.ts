// Play order is the order of these spreads. Add a new category file, then register it here.
import { motionChallenges } from './motion';
import { operatorChallenges } from './operator';
import { textObjectChallenges } from './text-object';
import { visualChallenges } from './visual';
import { searchChallenges } from './search';
import { replaceChallenges } from './replace';
import { registerChallenges } from './register';
import { markChallenges } from './mark';
import { macroChallenges } from './macro';
import { formatChallenges } from './format';
import { multiCursorChallenges } from './multi-cursor';
import type { Challenge } from './types';

export type { Category, Challenge, Position } from './types';

export const challengeSets = {
  motion: motionChallenges,
  operator: operatorChallenges,
  'text-object': textObjectChallenges,
  visual: visualChallenges,
  search: searchChallenges,
  replace: replaceChallenges,
  register: registerChallenges,
  mark: markChallenges,
  macro: macroChallenges,
  format: formatChallenges,
  'multi-cursor': multiCursorChallenges,
} as const;

export const vimChallenges: Challenge[] = [
  ...motionChallenges,
  ...operatorChallenges,
  ...textObjectChallenges,
  ...visualChallenges,
  ...searchChallenges,
  ...replaceChallenges,
  ...registerChallenges,
  ...markChallenges,
  ...macroChallenges,
  ...formatChallenges,
  ...multiCursorChallenges,
];
