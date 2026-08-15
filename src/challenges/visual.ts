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
];
