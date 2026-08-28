/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import { vimChallenges } from '../src/challenges';
import { playKeys, tokenizeKeys } from './play-keys';

const advancedReplays: Record<string, string> = {
  'visual-08': '<C-v>jjr1',
  'visual-09': 'Vjd',
  'register-01': '"ayyjdd"ap',
  'register-02': '"ayiwjwciw<C-r>a<Esc>',
  'mark-01': "maggdd'acwboot<Esc>",
  'mark-02': "maggcwdelay<Esc>'acwkept<Esc>",
  'macro-01': 'qadwjq2@a',
  'macro-02': 'qa$xjq2@a',
  'format-01': '>>',
  'format-02': '==',
  'format-03': '>j',
  'multi-cursor-01': '<C-v>jjIreq.<Esc>',
  'multi-cursor-02': '$<C-v>jjA,<Esc>',
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('play-keys tokenizer', () => {
  it('keeps angle-bracket vim keys together', () => {
    expect(tokenizeKeys('<C-v>jjIreq.<Esc>')).toEqual([
      '<C-v>',
      'j',
      'j',
      'I',
      'r',
      'e',
      'q',
      '.',
      '<Esc>',
    ]);
    expect(tokenizeKeys('"ayyjdd"ap')).toEqual(['"', 'a', 'y', 'y', 'j', 'd', 'd', '"', 'a', 'p']);
    expect(tokenizeKeys('<C-r>a')).toEqual(['<C-r>', 'a']);
  });
});

describe('Vim engine: registers', () => {
  it('yanks a line to a named register so a later delete does not clobber it', () => {
    expect(
      playKeys({
        content: ['const retries = 3;', 'unused();', 'const timeout = 5000;'].join('\n'),
        cursor: { line: 0, column: 0 },
        keys: '"ayyjdd"ap',
      }),
    ).toBe(['const retries = 3;', 'const timeout = 5000;', 'const retries = 3;'].join('\n'));
  });

  it('inserts a named register with Ctrl-r in Insert mode', () => {
    expect(
      playKeys({
        content: ['const user = load();', 'return id;'].join('\n'),
        cursor: { line: 0, column: 6 },
        keys: '"ayiwjwciw<C-r>a<Esc>',
      }),
    ).toBe(['const user = load();', 'return user;'].join('\n'));
  });
});

describe('Vim engine: visual block and visual line', () => {
  it('replaces a column in visual-block mode', () => {
    expect(
      playKeys({
        content: ['timeout: 0,', 'retries: 0,', 'workers: 0,'].join('\n'),
        cursor: { line: 0, column: 9 },
        keys: '<C-v>jjr1',
      }),
    ).toBe(['timeout: 1,', 'retries: 1,', 'workers: 1,'].join('\n'));
  });

  it('deletes two lines in visual-line mode', () => {
    expect(
      playKeys({
        content: ['function start() {', '  unused();', '  leftover();', '  return boot();', '}'].join('\n'),
        cursor: { line: 1, column: 2 },
        keys: 'Vjd',
      }),
    ).toBe(['function start() {', '  return boot();', '}'].join('\n'));
  });
});

describe('Vim engine: multi-cursor via visual-block insert', () => {
  it('inserts a prefix on every line of a block', () => {
    expect(
      playKeys({
        content: ['user,', 'path,', 'id,'].join('\n'),
        cursor: { line: 0, column: 0 },
        keys: '<C-v>jjIreq.<Esc>',
      }),
    ).toBe(['req.user,', 'req.path,', 'req.id,'].join('\n'));
  });

  it('appends a suffix on every line of a block', () => {
    expect(
      playKeys({
        content: ['user', 'path', 'id'].join('\n'),
        cursor: { line: 0, column: 0 },
        keys: '$<C-v>jjA,<Esc>',
      }),
    ).toBe(['user,', 'path,', 'id,'].join('\n'));
  });
});

describe('Vim engine: macros', () => {
  it('records a word delete and replays it down the file', () => {
    expect(
      playKeys({
        content: ['flag user = 1;', 'flag path = 2;', 'flag id = 3;'].join('\n'),
        cursor: { line: 0, column: 0 },
        keys: 'qadwjq2@a',
      }),
    ).toBe(['user = 1;', 'path = 2;', 'id = 3;'].join('\n'));
  });

  it('records a trailing-character delete and replays it', () => {
    expect(
      playKeys({
        content: ['user,', 'path,', 'id,'].join('\n'),
        cursor: { line: 0, column: 0 },
        keys: 'qa$xjq2@a',
      }),
    ).toBe(['user', 'path', 'id'].join('\n'));
  });
});

describe('Vim engine: marks', () => {
  it('jumps back to a mark after deleting an earlier line', () => {
    expect(
      playKeys({
        content: ['unused();', 'start();', 'finish();'].join('\n'),
        cursor: { line: 1, column: 0 },
        keys: 'maggdd\'acwboot<Esc>',
      }),
    ).toBe(['boot();', 'finish();'].join('\n'));
  });

  it('returns to a marked edit site after changing the top of the file', () => {
    expect(
      playKeys({
        content: ['timeout = 3000;', 'retries = 3;', 'leftover = 1;'].join('\n'),
        cursor: { line: 2, column: 0 },
        keys: "maggcwdelay<Esc>'acwkept<Esc>",
      }),
    ).toBe(['delay = 3000;', 'retries = 3;', 'kept = 1;'].join('\n'));
  });
});

describe('Vim engine: formatting', () => {
  it('indents the current line with >>', () => {
    expect(
      playKeys({
        content: ['function start() {', 'return boot();', '}'].join('\n'),
        cursor: { line: 1, column: 0 },
        keys: '>>',
      }),
    ).toBe(['function start() {', '  return boot();', '}'].join('\n'));
  });

  it('auto-indents a top-level line with ==', () => {
    expect(
      playKeys({
        content: '  const retries = 3;',
        cursor: { line: 0, column: 2 },
        keys: '==',
      }),
    ).toBe('const retries = 3;');
  });

  it('indents two lines with >j', () => {
    expect(
      playKeys({
        content: ['user,', 'path,', 'id,'].join('\n'),
        cursor: { line: 0, column: 0 },
        keys: '>j',
      }),
    ).toBe(['  user,', '  path,', 'id,'].join('\n'));
  });

  it('auto-indents a function body with ==', () => {
    expect(
      playKeys({
        content: ['function start() {', 'return boot();', '}'].join('\n'),
        cursor: { line: 1, column: 0 },
        keys: '==',
      }),
    ).toBe(['function start() {', '  return boot();', '}'].join('\n'));
  });
});

describe('Vim engine: advanced challenges', () => {
  it('replays each advanced case to its target buffer', () => {
    for (const [id, keys] of Object.entries(advancedReplays)) {
      const challenge = vimChallenges.find((entry) => entry.id === id);
      expect(challenge, id).toBeTruthy();
      expect(
        playKeys({
          content: challenge!.initialContent,
          cursor: challenge!.initialCursor ?? { line: 0, column: 0 },
          keys,
        }),
        id,
      ).toBe(challenge!.targetContent);
    }
  });
});
