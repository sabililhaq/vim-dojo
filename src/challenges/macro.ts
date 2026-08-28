import type { Challenge } from './types';

export const macroChallenges: Challenge[] = [
  {
    id: 'macro-01',
    title: 'Replay a word delete',
    description: 'Strip the flag prefix from every line. Record the edit once, then replay it.',
    category: 'macro',
    difficulty: 'hard',
    initialContent: ['flag user = 1;', 'flag path = 2;', 'flag id = 3;'].join('\n'),
    targetContent: ['user = 1;', 'path = 2;', 'id = 3;'].join('\n'),
    initialCursor: { line: 0, column: 0 },
    concepts: ['q', '@', 'dw'],
    hints: [
      'The same two motions apply on every line: delete a word, then go down.',
      'Record that pair into register a, then replay it for the remaining lines.',
      'Try `qadwjq2@a`.',
    ],
    intendedMove: 'qadwjq2@a',
  },
  {
    id: 'macro-02',
    title: 'Replay a trailing delete',
    description: 'Drop the trailing comma on every line. Record it once, then replay it.',
    category: 'macro',
    difficulty: 'hard',
    initialContent: ['user,', 'path,', 'id,'].join('\n'),
    targetContent: ['user', 'path', 'id'].join('\n'),
    initialCursor: { line: 0, column: 0 },
    concepts: ['q', '@', '$', 'x'],
    hints: [
      'Each line needs the same trip: jump to the end, delete a character, go down.',
      'Record that into register a, then replay it twice.',
      'Try `qa$xjq2@a`.',
    ],
    intendedMove: 'qa$xjq2@a',
  },
];
