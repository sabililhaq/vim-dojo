import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { vimChallenges } from '../src/challenges';
import { classifyAttempt } from '../src/classifier';
import { contentDiffSize, isChallengeComplete } from '../src/validator';
import type { InteractionEvent } from '../src/telemetry';

const mountPath = fileURLToPath(new URL('../src/mount.ts', import.meta.url));
const templatePath = fileURLToPath(new URL('../src/template.ts', import.meta.url));
const stylesPath = fileURLToPath(new URL('../src/styles.css', import.meta.url));

describe('Vim Dojo', () => {
  it('ships the Phase 0 challenge set from the spec', () => {
    expect(vimChallenges).toHaveLength(8);
    expect(vimChallenges.filter((challenge) => challenge.category === 'motion')).toHaveLength(2);
    expect(vimChallenges.filter((challenge) => challenge.category === 'operator')).toHaveLength(2);
    expect(vimChallenges.filter((challenge) => challenge.category === 'text-object')).toHaveLength(3);
    expect(vimChallenges.filter((challenge) => challenge.category === 'visual')).toHaveLength(1);
    expect(vimChallenges.every((challenge) => challenge.hints && challenge.hints.length > 0)).toBe(true);
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

  it('uses a visual change sequence for the visual challenge', () => {
    const visual = vimChallenges.find((challenge) => challenge.id === 'visual-01');

    expect(visual?.intendedMove).toBe('vec');
    expect(visual?.targetContent).toContain('runJob');
  });
});
