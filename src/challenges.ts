export type Category =
  | 'motion'
  | 'operator'
  | 'text-object'
  | 'visual';

export type Position = {
  line: number;
  column: number;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  category: Category;
  initialContent: string;
  targetContent: string;
  initialCursor?: Position;
  hints?: string[];
  concepts?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  intendedMove?: string;
};

export const vimChallenges: Challenge[] = [
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
  {
    id: 'text-object-01',
    title: 'Change quoted text',
    description: 'Change "production" to "staging".',
    category: 'text-object',
    difficulty: 'easy',
    initialContent: 'const environment = "production";',
    targetContent: 'const environment = "staging";',
    initialCursor: { line: 0, column: 22 },
    concepts: ['change', 'text-object', 'quote'],
    hints: [
      'Think about text objects.',
      'Change the contents inside the quotes.',
      'Try `ci"`.',
    ],
    intendedMove: 'ci"',
  },
  {
    id: 'text-object-02',
    title: 'Clear arguments',
    description: 'Remove all arguments from the function call.',
    category: 'text-object',
    difficulty: 'easy',
    initialContent: 'calculatePrice(basePrice, tax, discount)',
    targetContent: 'calculatePrice()',
    initialCursor: { line: 0, column: 21 },
    concepts: ['change', 'text-object', 'parentheses'],
    hints: [
      'The arguments are inside parentheses.',
      'Change the inside of the parentheses to nothing.',
      'Try `ci(`.',
    ],
    intendedMove: 'ci(',
  },
  {
    id: 'text-object-03',
    title: 'Replace an object value',
    description: 'Change the timeout value to 5000.',
    category: 'text-object',
    difficulty: 'easy',
    initialContent: 'const options = { timeout: 3000, retries: 2 };',
    targetContent: 'const options = { timeout: 5000, retries: 2 };',
    initialCursor: { line: 0, column: 28 },
    concepts: ['change', 'word'],
    hints: [
      'The cursor starts on the value to replace.',
      'Change the current word or number.',
      'Try `ciw5000`.',
    ],
    intendedMove: 'ciw',
  },
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
