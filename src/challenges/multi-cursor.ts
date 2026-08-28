import type { Challenge } from './types';

export const multiCursorChallenges: Challenge[] = [
  {
    id: 'multi-cursor-01',
    title: 'Insert a prefix on every line',
    description: 'Prefix each identifier with req. in one visual-block insert.',
    category: 'multi-cursor',
    difficulty: 'hard',
    initialContent: ['user,', 'path,', 'id,'].join('\n'),
    targetContent: ['req.user,', 'req.path,', 'req.id,'].join('\n'),
    initialCursor: { line: 0, column: 0 },
    concepts: ['Ctrl-v', 'I'],
    hints: [
      'This is the Vim version of several cursors: a block, then insert.',
      'Select the first column visually, then insert at the start of every line.',
      'Try `<C-v>jjI` then type `req.`.',
    ],
    intendedMove: '<C-v>jjI',
  },
  {
    id: 'multi-cursor-02',
    title: 'Append a suffix on every line',
    description: 'Add a trailing comma to every line in one visual-block append.',
    category: 'multi-cursor',
    difficulty: 'hard',
    initialContent: ['user', 'path', 'id'].join('\n'),
    targetContent: ['user,', 'path,', 'id,'].join('\n'),
    initialCursor: { line: 0, column: 0 },
    concepts: ['$', 'Ctrl-v', 'A'],
    hints: [
      'Append belongs at the end of each line, so start by jumping there.',
      'Go to the line end, extend a visual block down, then append.',
      'Try `$<C-v>jjA` then type `,`.',
    ],
    intendedMove: '$<C-v>jjA',
  },
];
