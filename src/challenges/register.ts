import type { Challenge } from './types';

export const registerChallenges: Challenge[] = [
  {
    id: 'register-01',
    title: 'Yank to a named register',
    description: 'Copy the retries line, delete unused, then put the copy after timeout.',
    category: 'register',
    difficulty: 'hard',
    initialContent: ['const retries = 3;', 'unused();', 'const timeout = 5000;'].join('\n'),
    targetContent: ['const retries = 3;', 'const timeout = 5000;', 'const retries = 3;'].join('\n'),
    initialCursor: { line: 0, column: 0 },
    concepts: ['"', 'yy', 'p'],
    hints: [
      'A later delete will overwrite the unnamed register. Park the yank somewhere safer.',
      'Yank the current line into register a, delete unused, then put from a.',
      'Try `"ayyjdd"ap`.',
    ],
    intendedMove: '"ayyjdd"ap',
  },
  {
    id: 'register-02',
    title: 'Insert from a register',
    description: 'Yank user, then insert it in place of id.',
    category: 'register',
    difficulty: 'hard',
    initialContent: ['const user = load();', 'return id;'].join('\n'),
    targetContent: ['const user = load();', 'return user;'].join('\n'),
    initialCursor: { line: 0, column: 6 },
    concepts: ['"', 'iw', '<C-r>'],
    hints: [
      'The cursor starts on user. You need that word again on the next line.',
      'Yank the inner word to register a, change id, then paste the register in Insert mode.',
      'Try `"ayiwjwciw<C-r>a`.',
    ],
    intendedMove: '"ayiwjwciw<C-r>a',
  },
];
