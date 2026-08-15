import type { Challenge } from './types';

export const operatorChallenges: Challenge[] = [
  {
    id: 'operator-01',
    title: 'Delete a log line',
    description: 'Delete the console.log statement.',
    category: 'operator',
    difficulty: 'easy',
    initialContent: [
      'const response = await fetch(url);',
      'console.log(response);',
      'return response;',
    ].join('\n'),
    targetContent: [
      'const response = await fetch(url);',
      'return response;',
    ].join('\n'),
    initialCursor: { line: 1, column: 0 },
    concepts: ['dd'],
    hints: [
      'The whole current line should go away.',
      'Use a linewise delete.',
      'Try `dd`.',
    ],
    intendedMove: 'dd',
  },
  {
    id: 'operator-02',
    title: 'Change a word',
    description: 'Rename result to user.',
    category: 'operator',
    difficulty: 'easy',
    initialContent: 'return result.profile;',
    targetContent: 'return user.profile;',
    initialCursor: { line: 0, column: 7 },
    concepts: ['cw'],
    hints: [
      'The cursor starts on the word to replace.',
      'Change the current word.',
      'Try `cwuser`.',
    ],
    intendedMove: 'cw',
  },
];
