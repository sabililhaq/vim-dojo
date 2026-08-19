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

  it('keeps the editor a fixed scrollable viewport', () => {
    const styles = readFileSync(stylesPath, 'utf-8');

    expect(styles).toMatch(/\.cm-editor \{[\s\S]*?height: 12rem;/);
    expect(styles).not.toContain('min-height: 7rem');
    expect(styles).toMatch(/\.cm-scroller \{[\s\S]*?overflow: auto;/);
  });

  it('goes to the previous challenge and auto-continues after 5s', () => {
    const source = readFileSync(mountPath, 'utf-8');
    const template = readFileSync(templatePath, 'utf-8');
    const styles = readFileSync(stylesPath, 'utf-8');

    expect(template).toContain('data-previous-button');
    expect(template).not.toContain('data-reset-button');
    expect(source).toContain('function goToPrevious');
    expect(source).not.toContain('function resetSession');
    expect(source).toContain('challengeIndex -= 1');
    expect(template).toContain('data-auto-continue');
    expect(source).toContain('const AUTO_CONTINUE_MS = 5000');
    expect(source).toContain('function startAutoContinue');
    expect(source).toContain('Continuing in ${seconds}s');
    expect(source).not.toContain('Next in ${seconds}s');
    expect(styles).toContain('dojo-auto-continue 5s linear forwards');
  });

  it('marks a passed case from vim-dojo:completed', () => {
    const source = readFileSync(mountPath, 'utf-8');
    const template = readFileSync(templatePath, 'utf-8');

    expect(template).toContain('data-passed');
    expect(source).toContain('function updatePassedMark');
    expect(source).toContain("localStorage.setItem(");
    expect(source).toContain('vim-dojo:completed');
    expect(source).toContain('${done} done');
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

  it('does not treat a tiny paste as the whole solution', () => {
    const events: InteractionEvent[] = [
      { type: 'key', key: 'c', mode: 'normal', t: 1 },
      { type: 'key', key: 'w', mode: 'normal', t: 2 },
      { type: 'paste', length: 1, t: 3 },
    ];

    expect(classifyAttempt(events, 'const x = "oldvalue";', 'const x = "newvalue";')).toBe('vim');
  });

  it('treats blank and whitespace-only buffers as the same empty solution', () => {
    expect(isChallengeComplete('  \n', '')).toBe(true);
    expect(isChallengeComplete('', 'x')).toBe(false);
    expect(contentDiffSize('same', 'same')).toBe(1);
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
    expect(byId['motion-07']?.intendedMove).toBe('Ftcw');
    expect(byId['motion-08']?.intendedMove).toBe('ea');
    expect(byId['motion-09']?.intendedMove).toBe('dT"');
    expect(byId['motion-10']?.intendedMove).toBe('%a');
    expect(byId['operator-03']?.intendedMove).toBe('dw');
    expect(byId['operator-04']?.intendedMove).toBe('dW');
    expect(byId['operator-05']?.intendedMove).toBe('x');
    expect(byId['operator-06']?.intendedMove).toBe('D');
    expect(byId['operator-07']?.intendedMove).toBe('C');
    expect(byId['operator-08']?.intendedMove).toBe('dt"');
    expect(byId['operator-09']?.intendedMove).toBe('r');
    expect(byId['operator-10']?.intendedMove).toBe('cc');
    expect(byId['text-object-04']?.intendedMove).toBe('ci{');
    expect(byId['text-object-05']?.intendedMove).toBe('daw');
    expect(byId['text-object-06']?.intendedMove).toBe('ca"');
    expect(byId['text-object-07']?.intendedMove).toBe("ci'");
    expect(byId['visual-02']?.intendedMove).toBe('Vd');
    expect(byId['visual-03']?.intendedMove).toBe('vi"c');
    expect(byId['visual-04']?.intendedMove).toBe('viwc');
    expect(byId['visual-05']?.intendedMove).toBe('vi(c');
    expect(byId['motion-11']?.intendedMove).toBe('Gcw');
    expect(byId['operator-11']?.intendedMove).toBe('Gdd');
    expect(byId['text-object-08']?.intendedMove).toBe('Gci"');
    expect(byId['visual-06']?.intendedMove).toBe('GVkkd');
    expect(byId['search-01']?.intendedMove).toBe('/legacycw');
    expect(byId['search-02']?.intendedMove).toBe('/betanci"');
    expect(byId['search-03']?.intendedMove).toBe('*cw');
    expect(byId['search-04']?.intendedMove).toBe('#cw');
    expect(byId['replace-01']?.intendedMove).toBe(':s/colour/color');
    expect(byId['replace-02']?.intendedMove).toBe(':%s/colour/color/g');
    expect(byId['replace-03']?.intendedMove).toBe(':s/colour/color/g');
    expect(byId['motion-12']?.intendedMove).toBe('^cw');
    expect(byId['operator-12']?.intendedMove).toBe('xp');
    expect(byId['text-object-09']?.intendedMove).toBe('ci[');
    expect(byId['visual-07']?.intendedMove).toBe('vi{c');
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

    for (const key of ['0', '$', '^', 'w', 'b', 'e', 'f', 'F', 't', 'T', '%', 'G', '/', 'n', '*', '#', ':s', ':%s', 'x', 'p', 'C', 'D', 'r', 'cc', 'dd', 'dw', 'cw', 'dW', 'dt', 'ci"', "ci'", 'ci(', 'ciw', 'ci{', 'ci[', 'ca"', 'daw', 'v', 'V', 'iw', 'i(', 'i{']) {
      expect(practiced, key).toContain(key);
    }

    expect(challengeSets.motion.some((challenge) => challenge.intendedMove?.includes('b'))).toBe(true);
    expect(challengeSets.motion.some((challenge) => challenge.intendedMove?.includes('t'))).toBe(true);
    expect(challengeSets.motion.some((challenge) => challenge.intendedMove?.includes('F'))).toBe(true);
    expect(challengeSets.motion.some((challenge) => challenge.intendedMove?.includes('e'))).toBe(true);
    expect(challengeSets.motion.some((challenge) => challenge.intendedMove?.includes('T'))).toBe(true);
    expect(challengeSets.motion.some((challenge) => challenge.intendedMove?.includes('%'))).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'x')).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'D')).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'C')).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'dt"')).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'r')).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'cc')).toBe(true);
    expect(challengeSets['text-object'].some((challenge) => challenge.intendedMove === 'daw')).toBe(true);
    expect(challengeSets['text-object'].some((challenge) => challenge.intendedMove === 'ca"')).toBe(true);
    expect(challengeSets['text-object'].some((challenge) => challenge.intendedMove === "ci'")).toBe(true);
    expect(challengeSets.visual.some((challenge) => challenge.intendedMove === 'vi"c')).toBe(true);
    expect(challengeSets.visual.some((challenge) => challenge.intendedMove === 'viwc')).toBe(true);
    expect(challengeSets.visual.some((challenge) => challenge.intendedMove === 'vi(c')).toBe(true);
    expect(challengeSets.motion.some((challenge) => challenge.intendedMove === 'Gcw')).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'Gdd')).toBe(true);
    expect(challengeSets['text-object'].some((challenge) => challenge.intendedMove === 'Gci"')).toBe(true);
    expect(challengeSets.visual.some((challenge) => challenge.intendedMove === 'GVkkd')).toBe(true);
    expect(challengeSets.search.some((challenge) => challenge.intendedMove === '/legacycw')).toBe(true);
    expect(challengeSets.search.some((challenge) => challenge.intendedMove === '/betanci"')).toBe(true);
    expect(challengeSets.search.some((challenge) => challenge.intendedMove === '*cw')).toBe(true);
    expect(challengeSets.search.some((challenge) => challenge.intendedMove === '#cw')).toBe(true);
    expect(challengeSets.replace.some((challenge) => challenge.intendedMove === ':s/colour/color')).toBe(true);
    expect(challengeSets.replace.some((challenge) => challenge.intendedMove === ':%s/colour/color/g')).toBe(true);
    expect(challengeSets.replace.some((challenge) => challenge.intendedMove === ':s/colour/color/g')).toBe(true);
    expect(challengeSets.motion.some((challenge) => challenge.intendedMove === '^cw')).toBe(true);
    expect(challengeSets.operator.some((challenge) => challenge.intendedMove === 'xp')).toBe(true);
    expect(challengeSets['text-object'].some((challenge) => challenge.intendedMove === 'ci[')).toBe(true);
    expect(challengeSets.visual.some((challenge) => challenge.intendedMove === 'vi{c')).toBe(true);
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

  it('keeps most buffers short, and viewport cases long enough to scroll', () => {
    const viewportIds = new Set([
      'motion-11',
      'operator-11',
      'text-object-08',
      'visual-06',
      'search-01',
      'search-02',
      'search-03',
      'replace-02',
    ]);

    for (const challenge of vimChallenges) {
      const lines = challenge.initialContent.split('\n');

      if (viewportIds.has(challenge.id)) {
        expect(lines.length, challenge.id).toBeGreaterThan(12);
        expect(lines.length, challenge.id).toBeLessThanOrEqual(24);
        expect(challenge.intendedMove, challenge.id).toMatch(/^([G/*]|:%s)/);
        continue;
      }

      expect(lines.length, challenge.id).toBeLessThanOrEqual(5);
      expect(challenge.initialContent.length, challenge.id).toBeLessThan(160);
    }
  });

  it('puts the challenge above the intro so practice is the first thing on the page', () => {
    const template = readFileSync(templatePath, 'utf-8');
    const styles = readFileSync(stylesPath, 'utf-8');

    expect(template.indexOf('challenge-shell')).toBeLessThan(template.indexOf('class="intro"'));
    expect(styles).toContain('.vim-dojo .intro {\n  border-top: 1px solid rgb(var(--vd-gray-light));');
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

  it('publishes a learning roadmap for category, random, daily, and interactive hints', () => {
    const readmePath = fileURLToPath(new URL('../README.md', import.meta.url));
    const roadmapPath = fileURLToPath(new URL('../ROADMAP.md', import.meta.url));
    const contributingPath = fileURLToPath(new URL('../CONTRIBUTING.md', import.meta.url));
    const readme = readFileSync(readmePath, 'utf-8');
    const roadmap = readFileSync(roadmapPath, 'utf-8');
    const contributing = readFileSync(contributingPath, 'utf-8');

    expect(readme).toContain('[ROADMAP.md](ROADMAP.md)');
    expect(contributing).toContain('ROADMAP.md');
    expect(roadmap).toMatch(/learning tool/i);
    expect(roadmap).toMatch(/Play by category/);
    expect(roadmap).toMatch(/Randomized practice/);
    expect(roadmap).toMatch(/Daily kata/);
    expect(roadmap).toMatch(/Interactive hints/);
    expect(roadmap).toContain('?category=');
    expect(roadmap).toContain('?mode=random');
    expect(roadmap).toContain('?mode=daily');
    expect(roadmap).toMatch(/Ghost the next character/);
    expect(roadmap).toMatch(/No accounts/);
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

  it('finds true from after the closing paren, where f would miss it', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'motion-07');
    const trueAt = challenge?.initialContent.indexOf('true') ?? -1;

    expect(challenge?.initialCursor?.column).toBeGreaterThan(trueAt + 'true'.length - 1);
    expect(challenge?.targetContent).toContain('false');
    expect(challenge?.concepts).toContain('F');
  });

  it('appends a suffix with e instead of rewriting the word', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'motion-08');
    const userAt = challenge?.initialContent.indexOf('user') ?? -1;

    expect(challenge?.initialCursor?.column).toBe(userAt);
    expect(challenge?.initialContent).toBe('return user;');
    expect(challenge?.targetContent).toBe('return userId;');
    expect(challenge?.concepts).toEqual(['e', 'a']);
  });

  it('changes the rest of the line with C, not a single word', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'operator-07');

    expect(challenge?.initialContent).toBe('return user.profile;');
    expect(challenge?.targetContent).toBe('return user.id;');
    expect(challenge?.initialCursor?.column).toBe(challenge?.initialContent.indexOf('user'));
    expect(challenge?.concepts).toContain('C');
  });

  it('deletes till the quote and leaves the filename quoted', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'operator-08');

    expect(challenge?.initialContent).toContain('path + "backup.json"');
    expect(challenge?.targetContent).toBe('open("backup.json")');
    expect(challenge?.targetContent).toContain('"backup.json"');
    expect(challenge?.initialCursor?.column).toBe(challenge?.initialContent.indexOf('path'));
  });

  it('teaches around-quotes as the opposite of inside-quotes', () => {
    const inside = vimChallenges.find((entry) => entry.id === 'text-object-01');
    const around = vimChallenges.find((entry) => entry.id === 'text-object-06');

    expect(inside?.intendedMove).toBe('ci"');
    expect(inside?.targetContent).toContain('"staging"');
    expect(around?.intendedMove).toBe('ca"');
    expect(around?.initialContent).toContain('"idle"');
    expect(around?.targetContent).toBe('status: ready;');
    expect(around?.targetContent).not.toContain('"');
  });

  it('teaches viw from the middle of retryCount, where ve would miss the prefix', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'visual-04');
    const wordAt = challenge?.initialContent.indexOf('retryCount') ?? -1;

    expect(challenge?.initialCursor?.column).toBeGreaterThan(wordAt);
    expect(challenge?.initialCursor?.column).toBeLessThan(wordAt + 'retryCount'.length);
    expect(challenge?.targetContent).toContain('attemptCount');
    expect(challenge?.concepts).toEqual(['v', 'iw', 'c']);
  });

  it('deletes a path prefix with till-backward from the filename', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'motion-09');
    const appAt = challenge?.initialContent.indexOf('app.json') ?? -1;

    expect(challenge?.initialCursor?.column).toBe(appAt);
    expect(challenge?.initialContent).toContain('config/');
    expect(challenge?.targetContent).toBe('open("app.json")');
    expect(challenge?.targetContent).not.toContain('config');
    expect(challenge?.concepts).toEqual(['T', 'd']);
  });

  it('starts on the opening paren so % jumps to the match before append', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'motion-10');

    expect(challenge?.initialContent).toBe('save(user)');
    expect(challenge?.targetContent).toBe('save(user);');
    expect(challenge?.initialCursor?.column).toBe(challenge?.initialContent.indexOf('('));
    expect(challenge?.concepts).toEqual(['%', 'a']);
  });

  it('replaces the wrong digit in place with r', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'operator-09');

    expect(challenge?.initialContent).toBe('listen(8081);');
    expect(challenge?.targetContent).toBe('listen(8080);');
    expect(challenge?.initialCursor?.column).toBe(challenge?.initialContent.indexOf('1'));
    expect(challenge?.concepts).toContain('r');
  });

  it('rewrites the whole line with cc instead of a single word', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'operator-10');

    expect(challenge?.initialContent).toBe('return legacyHandler(event);');
    expect(challenge?.targetContent).toBe('return null;');
    expect(challenge?.initialCursor?.column).toBe(0);
    expect(challenge?.concepts).toContain('cc');
  });

  it('teaches single-quote text objects as the pair of double quotes', () => {
    const doubles = vimChallenges.find((entry) => entry.id === 'text-object-01');
    const singles = vimChallenges.find((entry) => entry.id === 'text-object-07');
    const darkAt = singles?.initialContent.indexOf('dark') ?? -1;

    expect(doubles?.intendedMove).toBe('ci"');
    expect(singles?.intendedMove).toBe("ci'");
    expect(singles?.initialCursor?.column).toBeGreaterThan(darkAt);
    expect(singles?.initialCursor?.column).toBeLessThan(darkAt + 'dark'.length);
    expect(singles?.targetContent).toContain("'light'");
  });

  it('starts star-search on experimental so * jumps to the later match', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'search-03');
    const wordAt = challenge?.initialContent.indexOf('experimental') ?? -1;

    expect(challenge?.initialCursor?.line).toBe(0);
    expect(challenge?.initialCursor?.column).toBe(wordAt);
    expect(challenge?.initialContent.split('\n').at(-1)).toBe('return experimental;');
    expect(challenge?.targetContent.split('\n').at(-1)).toBe('return stable;');
  });

  it('teaches visual inner-paren from the opening parenthesis', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'visual-05');

    expect(challenge?.initialContent).toBe('sum(left, right)');
    expect(challenge?.targetContent).toBe('sum(1, 2)');
    expect(challenge?.initialCursor?.column).toBe(challenge?.initialContent.indexOf('('));
    expect(challenge?.concepts).toEqual(['v', 'i(', 'c']);
  });

  it('jumps to the first non-blank so 0 would change the indent', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'motion-12');

    expect(challenge?.initialContent.startsWith(' ')).toBe(true);
    expect(challenge?.initialCursor?.column).toBe(challenge?.initialContent.indexOf(';'));
    expect(challenge?.targetContent).toContain('trace');
    expect(challenge?.targetContent.startsWith(' ')).toBe(true);
    expect(challenge?.concepts).toEqual(['^', 'cw']);
  });

  it('swaps a transposed pair with xp instead of rewriting the word', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'operator-12');
    const formAt = challenge?.initialContent.indexOf('form') ?? -1;

    expect(challenge?.initialContent).toContain('form');
    expect(challenge?.targetContent).toContain('from');
    expect(challenge?.targetContent).not.toContain('form');
    expect(challenge?.initialCursor?.column).toBe(formAt + 1);
    expect(challenge?.concepts).toEqual(['x', 'p']);
  });

  it('changes inside brackets as the pair of parentheses and braces', () => {
    const parens = vimChallenges.find((entry) => entry.id === 'text-object-02');
    const braces = vimChallenges.find((entry) => entry.id === 'text-object-04');
    const brackets = vimChallenges.find((entry) => entry.id === 'text-object-09');
    const twoAt = brackets?.initialContent.indexOf('2') ?? -1;

    expect(parens?.intendedMove).toBe('ci(');
    expect(braces?.intendedMove).toBe('ci{');
    expect(brackets?.intendedMove).toBe('ci[');
    expect(brackets?.initialContent).toContain('[1, 2, 3]');
    expect(brackets?.targetContent).toBe('const ids = [id];');
    expect(brackets?.initialCursor?.column).toBe(twoAt);
  });

  it('teaches visual inner-brace as the pair of ci{', () => {
    const inner = vimChallenges.find((entry) => entry.id === 'text-object-04');
    const visual = vimChallenges.find((entry) => entry.id === 'visual-07');
    const waitAt = visual?.initialContent.indexOf('wait') ?? -1;

    expect(inner?.intendedMove).toBe('ci{');
    expect(visual?.intendedMove).toBe('vi{c');
    expect(visual?.initialContent).toContain('{ wait(); }');
    expect(visual?.targetContent).toContain('{ break; }');
    expect(visual?.initialCursor?.column).toBe(waitAt);
    expect(visual?.concepts).toEqual(['v', 'i{', 'c']);
  });

  it('starts hash-search on the later experimental so # jumps backward', () => {
    const challenge = vimChallenges.find((entry) => entry.id === 'search-04');
    const lines = challenge?.initialContent.split('\n') ?? [];
    const wordAt = lines.at(-1)?.indexOf('experimental') ?? -1;

    expect(challenge?.initialCursor?.line).toBe(lines.length - 1);
    expect(challenge?.initialCursor?.column).toBe(wordAt);
    expect(lines[0]).toContain('experimental');
    expect(challenge?.targetContent.split('\n')[0]).toContain('stable');
    expect(lines.at(-1)).toBe(challenge?.targetContent.split('\n').at(-1));
    expect(challenge?.concepts).toContain('#');
  });

  it('substitutes every match on the line, not just the first', () => {
    const once = vimChallenges.find((entry) => entry.id === 'replace-01');
    const lineGlobal = vimChallenges.find((entry) => entry.id === 'replace-03');

    expect(once?.intendedMove).toBe(':s/colour/color');
    expect(lineGlobal?.intendedMove).toBe(':s/colour/color/g');
    expect(lineGlobal?.initialContent.match(/colour/g)?.length).toBeGreaterThan(1);
    expect(lineGlobal?.targetContent).not.toContain('colour');
    expect(lineGlobal?.initialContent.split('\n')).toHaveLength(1);
    expect(lineGlobal?.concepts).toEqual([':s', 'g']);
  });
});
