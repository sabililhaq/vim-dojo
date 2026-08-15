import type { Challenge } from './types';

export const motionChallenges: Challenge[] = [
  {
    id: 'motion-01',
    title: 'Start of line',
    description: 'Move to the beginning of the line, then change debug to trace.',
    category: 'motion',
    difficulty: 'easy',
    initialContent: 'debugLogger.info("ready");',
    targetContent: 'traceLogger.info("ready");',
    initialCursor: { line: 0, column: 22 },
    concepts: ['0', 'cw'],
    hints: [
      'The cursor starts near the end of the line.',
      'Move to the beginning before changing the first word.',
      'Try `0cwtrace`.',
    ],
    intendedMove: '0cw',
  },
  {
    id: 'motion-02',
    title: 'End of line',
    description: 'Append the missing semicolon.',
    category: 'motion',
    difficulty: 'easy',
    initialContent: 'const retries = 3',
    targetContent: 'const retries = 3;',
    initialCursor: { line: 0, column: 0 },
    concepts: ['$', 'a'],
    hints: [
      'The change belongs at the end of the line.',
      'Jump to the line end before appending.',
      'Try `$a;`.',
    ],
    intendedMove: '$a',
  },
];
