import type { Challenge } from './types';

export const visualChallenges: Challenge[] = [
  {
    id: 'visual-01',
    title: 'Change a selected word',
    description: 'Select startJob visually, then change it to runJob.',
    category: 'visual',
    difficulty: 'medium',
    initialContent: [
      'if (isReady) {',
      '  return startJob();',
      '}',
    ].join('\n'),
    targetContent: [
      'if (isReady) {',
      '  return runJob();',
      '}',
    ].join('\n'),
    initialCursor: { line: 1, column: 9 },
    concepts: ['visual', 'change'],
    hints: [
      'The word to change is under the cursor.',
      'Enter Visual mode and extend to the end of the word.',
      'Try `vecrunJob`.',
    ],
    intendedMove: 'vec',
  },
  {
    id: 'visual-02',
    title: 'Delete a visual line',
    description: 'Visually select the deprecated comment and delete it.',
    category: 'visual',
    difficulty: 'medium',
    initialContent: [
      'function start() {',
      '  // deprecated path',
      '  return boot();',
      '}',
    ].join('\n'),
    targetContent: [
      'function start() {',
      '  return boot();',
      '}',
    ].join('\n'),
    initialCursor: { line: 1, column: 2 },
    concepts: ['V', 'd'],
    hints: [
      'The whole current line should go away.',
      'Enter Visual-Line mode, then delete the selection.',
      'Try `Vd`.',
    ],
    intendedMove: 'Vd',
  },
  {
    id: 'visual-03',
    title: 'Change inside quotes visually',
    description: 'Select the quoted text visually, then change it to staging.',
    category: 'visual',
    difficulty: 'medium',
    initialContent: 'const environment = "production";',
    targetContent: 'const environment = "staging";',
    initialCursor: { line: 0, column: 22 },
    concepts: ['v', 'i"', 'c'],
    hints: [
      'The cursor starts inside the quotes.',
      'Visually select the inner quoted text, then change it.',
      'Try `vi"cstaging`.',
    ],
    intendedMove: 'vi"c',
  },
];
