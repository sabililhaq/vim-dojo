import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { challengeSets, vimChallenges } from '../src/challenges';
import { classifyAttempt, methodLabel } from '../src/classifier';
import { summarizeTelemetry, type InteractionEvent } from '../src/telemetry';
import { contentDiffSize, isChallengeComplete } from '../src/validator';

const mountPath = fileURLToPath(new URL('../src/mount.ts', import.meta.url));
const templatePath = fileURLToPath(new URL('../src/template.ts', import.meta.url));
const stylesPath = fileURLToPath(new URL('../src/styles.css', import.meta.url));

describe('Vim Dojo', () => {
  it('keeps every challenge complete, unique, and in its category set', () => {
    const ids = vimChallenges.map((challenge) => challenge.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(vimChallenges.length).toBeGreaterThan(0);

    for (const challenge of vimChallenges) {
      expect(challenge.id.startsWith(`${challenge.category}-`)).toBe(true);
      expect(challenge.title.length).toBeGreaterThan(0);
      expect(challenge.description.length).toBeGreaterThan(0);
      expect(challenge.initialContent).not.toBe(challenge.targetContent);
      expect(challenge.hints?.length).toBeGreaterThan(0);
      expect(challenge.concepts?.length).toBeGreaterThan(0);
      expect(challenge.intendedMove).toBeTruthy();
      expect(['easy', 'medium', 'hard']).toContain(challenge.difficulty);
    }

    for (const [category, set] of Object.entries(challengeSets)) {
      expect(set.length).toBeGreaterThan(0);
      expect(set.every((challenge) => challenge.category === category)).toBe(true);
    }

    expect(vimChallenges).toHaveLength(
      Object.values(challengeSets).reduce((total, set) => total + set.length, 0),
    );
  });

  it('initializes CodeMirror with the Replit Vim extension', () => {
    const source = readFileSync(mountPath, 'utf-8');

    expect(source).toMatch(/from ['"]@replit\/codemirror-vim['"]/);
    expect(source).toContain('vim()');
    expect(source).toContain('EditorView.updateListener.of(onEditorUpdate)');
    expect(source).not.toContain('defaultKeymap');
    expect(source).toContain('forceNormalMode');
    expect(source).toContain("localStorage.getItem('vim-dojo:lastChallenge')");
  });

  it('themes editor and buttons from host surface tokens instead of hardcoded white', () => {
    const styles = readFileSync(stylesPath, 'utf-8');

    expect(styles).toContain('--vd-bg: var(--bg, 255 255 255)');
    expect(styles).toContain('--vd-surface: var(--surface, var(--bg, 255 255 255))');
    expect(styles).toContain('background: rgb(var(--vd-surface))');
    expect(styles).toContain('color: rgb(var(--vd-bg))');
    expect(styles).not.toMatch(/background:\s*#fff/);
    expect(styles).not.toMatch(/color:\s*#fff/);
  });

  it('resets the session to the first challenge and auto-continues after 5s', () => {
    const source = readFileSync(mountPath, 'utf-8');
    const template = readFileSync(templatePath, 'utf-8');
    const styles = readFileSync(stylesPath, 'utf-8');

    expect(template).toContain('data-reset-button');
    expect(source).toContain('function resetSession');
    expect(source).toContain('challengeIndex = 0');
    expect(template).toContain('data-auto-continue');
    expect(source).toContain('const AUTO_CONTINUE_MS = 5000');
    expect(source).toContain('function startAutoContinue');
    expect(source).toContain('Continuing in ${seconds}s');
    expect(source).not.toContain('Next in ${seconds}s');
    expect(styles).toContain('dojo-auto-continue 5s linear forwards');
  });

  it('validates completed content after normalizing line endings and trim', () => {
    expect(isChallengeComplete('const x = 1;\r\n', 'const x = 1;')).toBe(true);
    expect(isChallengeComplete('const x = 2;', 'const x = 1;')).toBe(false);
  });

  it('measures same-length substitutions by edit distance, not length delta', () => {
    expect(contentDiffSize('debugLogger.info("ready");', 'traceLogger.info("ready");')).toBe(5);
    expect(contentDiffSize('timeout: 3000', 'timeout: 5000')).toBe(1);
  });

  it('classifies paste and manual attempts separately from Vim attempts', () => {
    const vimEvents: InteractionEvent[] = [
      { type: 'key', key: 'c', mode: 'normal', t: 1 },
      { type: 'mode-change', from: 'normal', to: 'insert', t: 2 },
      { type: 'key', key: 'a', mode: 'insert', t: 3 },
    ];
    const deleteLineEvents: InteractionEvent[] = [
      { type: 'key', key: 'd', mode: 'normal', t: 1 },
      { type: 'key', key: 'd', mode: 'normal', t: 2 },
    ];
    const manualEvents: InteractionEvent[] = [
      { type: 'mouse-down', t: 1 },
      { type: 'mouse-selection', length: 10, t: 2 },
      { type: 'key', key: 'a', mode: 'normal', t: 3 },
    ];
    const mouseOnlyEvents: InteractionEvent[] = [
      { type: 'mouse-down', t: 1 },
      { type: 'mouse-selection', length: 4, t: 2 },
    ];
    const pasteEvents: InteractionEvent[] = [
      { type: 'paste', length: 20, t: 1 },
      { type: 'mode-change', from: 'normal', to: 'insert', t: 2 },
    ];

    expect(classifyAttempt(vimEvents, 'const x = "old";', 'const x = "new";')).toBe('vim');
    expect(classifyAttempt(deleteLineEvents, 'a\nconsole.log(x);\nb', 'a\nb')).toBe('vim');
    expect(classifyAttempt(manualEvents, 'const x = "old";', 'const x = "new";')).toBe('manual');
    expect(classifyAttempt(mouseOnlyEvents, 'timeout: 3000', 'timeout: 5000')).toBe('manual');
    expect(classifyAttempt(pasteEvents, 'const x = "old";', 'const x = "new";')).toBe('paste');
  });

  it('classifies a single click as mostly-vim and extra mouse work as mixed', () => {
    const mostlyVimEvents: InteractionEvent[] = [
      { type: 'mouse-down', t: 1 },
      { type: 'key', key: 'c', mode: 'normal', t: 2 },
      { type: 'key', key: 'w', mode: 'normal', t: 3 },
    ];
    const mixedEvents: InteractionEvent[] = [
      { type: 'mouse-down', t: 1 },
      { type: 'mouse-down', t: 2 },
      { type: 'key', key: 'd', mode: 'normal', t: 3 },
      { type: 'key', key: 'd', mode: 'normal', t: 4 },
    ];

    expect(classifyAttempt(mostlyVimEvents, 'const x = "old";', 'const x = "new";')).toBe('mostly-vim');
    expect(classifyAttempt(mixedEvents, 'a\nconsole.log(x);\nb', 'a\nb')).toBe('mixed');
  });

  it('labels every attempt method in language a learner can act on', () => {
    expect(methodLabel('vim')).toBe('Vim');
    expect(methodLabel('mostly-vim')).toBe('Mostly Vim');
    expect(methodLabel('mixed')).toBe('Mixed');
    expect(methodLabel('manual')).toBe('Manual');
    expect(methodLabel('paste')).toBe('Paste');
  });

  it('summarizes telemetry so learning feedback can score keys vs mouse vs paste', () => {
    const snapshot = summarizeTelemetry([
      { type: 'key', key: 'd', mode: 'normal', t: 1 },
      { type: 'mode-change', from: 'normal', to: 'insert', t: 2 },
      { type: 'mouse-down', t: 3 },
      { type: 'mouse-selection', length: 4, t: 4 },
      { type: 'paste', length: 8, t: 5 },
    ]);

    expect(snapshot).toEqual({
      mouseDownCount: 1,
      mouseSelectionChars: 4,
      pasteChars: 8,
      keyEventCount: 1,
      changedModes: true,
    });
  });

  it('uses a visual change sequence for the visual challenge', () => {
    const visual = vimChallenges.find((challenge) => challenge.id === 'visual-01');

    expect(visual?.intendedMove).toBe('vec');
    expect(visual?.targetContent).toContain('runJob');
  });

  it('keeps intended moves for the new practice cases', () => {
    const byId = Object.fromEntries(vimChallenges.map((challenge) => [challenge.id, challenge]));

    expect(byId['motion-03']?.intendedMove).toBe('fecw');
    expect(byId['motion-03']?.targetContent).toContain('disabled');
    expect(byId['motion-04']?.intendedMove).toBe('wcw');
    expect(byId['motion-05']?.intendedMove).toBe('bcw');
    expect(byId['motion-06']?.intendedMove).toBe('ct-');
    expect(byId['operator-03']?.intendedMove).toBe('dw');
    expect(byId['operator-04']?.intendedMove).toBe('dW');
    expect(byId['operator-05']?.intendedMove).toBe('x');
    expect(byId['operator-06']?.intendedMove).toBe('D');
    expect(byId['text-object-04']?.intendedMove).toBe('ci{');
    expect(byId['text-object-05']?.intendedMove).toBe('daw');
    expect(byId['visual-02']?.intendedMove).toBe('Vd');
    expect(byId['visual-03']?.intendedMove).toBe('vi"c');
  });
});

describe('Vim Dojo learning', () => {
  function lastHintKeys(hint: string): string {
    return [...hint.matchAll(/`([^`]+)`/g)].map((match) => match[1]).join('');
  }

  it('teaches with progressive hints that finish on the intended keys', () => {
    for (const challenge of vimChallenges) {
      const hints = challenge.hints ?? [];
      const lastHint = hints.at(-1) ?? '';

      expect(hints.length, challenge.id).toBeGreaterThanOrEqual(2);
      expect(lastHint, challenge.id).toMatch(/Try `/);
      expect(lastHintKeys(lastHint), challenge.id).toContain(challenge.intendedMove ?? '');
    }
  });

  it('covers a core motion, operator, text-object, and visual curriculum', () => {
    const intended = vimChallenges.map((challenge) => challenge.intendedMove);
    const concepts = vimChallenges.flatMap((challenge) => challenge.concepts ?? []);
    const practiced = [...intended, ...concepts].join(' ');

    for (const key of ['0', '$', 'w', 'b', 'f', 't', 'x', 'D', 'dd', 'dw', 'cw', 'dW', 'ci"', 'ci(', 'ciw', 'ci{', 'daw', 'v', 'V']) {
      expect(practiced, key).toContain(key);
    }

    expect(challengeSets.motion.some((challenge) => challenge.intendedMove?.includes('b'))).toBe(true);
    expect(challengeSets.motion.some((challenge) => challenge.intendedMove?.includes('t'))).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'x')).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'D')).toBe(true);
    expect(challengeSets['text-object'].some((challenge) => challenge.intendedMove === 'daw')).toBe(true);
    expect(challengeSets.visual.some((challenge) => challenge.intendedMove === 'vi"c')).toBe(true);
  });

  it('places the cursor so the intended move is the natural first action', () => {
    for (const challenge of vimChallenges) {
      expect(challenge.initialCursor, challenge.id).toEqual(
        expect.objectContaining({ line: expect.any(Number), column: expect.any(Number) }),
      );
      expect(challenge.initialCursor!.line, challenge.id).toBeGreaterThanOrEqual(0);
      expect(challenge.initialCursor!.column, challenge.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps buffers short enough to study, not hunt through', () => {
    for (const challenge of vimChallenges) {
      const lines = challenge.initialContent.split('\n');
      expect(lines.length, challenge.id).toBeLessThanOrEqual(5);
      expect(challenge.initialContent.length, challenge.id).toBeLessThan(160);
    }
  });

  it('points beginners to VimHero and exposes a hint button', () => {
    const template = readFileSync(templatePath, 'utf-8');
    const source = readFileSync(mountPath, 'utf-8');

    expect(template).toContain('Practice Vim. Don\'t learn Vim.');
    expect(template).toContain('This is not a beginner Vim tutorial.');
    expect(template).toContain('https://www.vim-hero.com/lessons/basic-movement');
    expect(template).toContain('data-hint-button');
    expect(template).toContain('data-hint');
    expect(source).toContain('function renderHint');
    expect(source).toContain('challenge.intendedMove ? `${challenge.intendedMove} was the intended move.`');
    expect(source).toContain('You pasted the solution.');
    expect(source).toContain('You solved it, but you missed some Vim practice.');
    expect(source).toContain('One mouse interaction nudged this into mostly Vim.');
  });

  it('teaches daw from the middle of unused, where dw would leave a prefix', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'text-object-05');
    const unusedAt = challenge?.initialContent.indexOf('unused') ?? -1;

    expect(challenge?.initialCursor?.column).toBeGreaterThan(unusedAt);
    expect(challenge?.initialCursor?.column).toBeLessThan(unusedAt + 'unused'.length);
    expect(challenge?.concepts).toContain('daw');
  });

  it('pairs change-till with a visual inner-quote case', () => {
    const till = vimChallenges.find((entry) => entry.id === 'motion-06');
    const visualQuote = vimChallenges.find((entry) => entry.id === 'visual-03');

    expect(till?.initialContent).toContain('legacy-name');
    expect(till?.targetContent).toContain('current-name');
    expect(visualQuote?.initialContent).toContain('"production"');
    expect(visualQuote?.targetContent).toContain('"staging"');
    expect(visualQuote?.concepts).toEqual(['v', 'i"', 'c']);
  });
});
