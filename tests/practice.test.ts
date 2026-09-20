/** @vitest-environment jsdom */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mountVimDojo } from '../src/mount';
import { motionChallenges } from '../src/challenges/motion';
import { operatorChallenges } from '../src/challenges/operator';
import { EditorView } from '@codemirror/view';
import { installJsdomLayout, playKeys } from './play-keys';

let root: HTMLElement;
let unmount: () => void;

beforeEach(() => {
  installJsdomLayout();
  vi.useFakeTimers();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} });
  const storage = new Map<string, string>();
  vi.spyOn(window, 'localStorage', 'get').mockReturnValue({
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
  } as Storage);
  window.history.replaceState(null, '', '/');
  root = document.createElement('div');
  document.body.append(root);
  const challenge = { ...motionChallenges[0]!, initialContent: 'abc', targetContent: 'c', initialCursor: { line: 0, column: 0 }, intendedMove: 'xx' };
  unmount = mountVimDojo(root, { basePath: '/', challenges: [challenge, { ...challenge, id: 'motion-02', title: 'Second' }] });
});

afterEach(() => {
  unmount();
  root.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function solve() {
  const editor = root.querySelector('.cm-content')!;
  editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true }));
  vi.advanceTimersByTime(1000);
  editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true }));
}

it('captures Vim keys before they are consumed, including the completing key', () => {
  solve();
  expect(root.querySelector('.cm-content')?.textContent).toBe('c');
  expect(root.querySelector('[data-keystrokes]')?.textContent).toBe('2 command keys · par 2');
  expect(root.querySelector('[data-time]')?.textContent).toBe('1.00s');
});

it('cancels an active countdown and remembers the opt-out', () => {
  solve();
  const checkbox = root.querySelector<HTMLInputElement>('[data-auto-advance]')!;
  checkbox.click();
  vi.advanceTimersByTime(6000);
  expect(root.querySelector('[data-title]')?.textContent).not.toBe('Second');
  expect(root.querySelector('[data-auto-continue]')?.hasAttribute('hidden')).toBe(true);
  expect(window.localStorage.getItem('vim-dojo:autoAdvance')).toBe('false');
  root.querySelector<HTMLButtonElement>('[data-next-button]')!.click();
  expect(root.querySelector('[data-title]')?.textContent).toBe('Second');
});

it('advances automatically when enabled', () => {
  solve();
  vi.advanceTimersByTime(5000);
  expect(root.querySelector('[data-title]')?.textContent).toBe('Second');
});

it('replays the first challenge final hint to the exact target', () => {
  const challenge = motionChallenges[0]!;
  const keys = challenge.hints!.at(-1)!.match(/`([^`]+)`/)![1]!;
  expect(playKeys({ content: challenge.initialContent, cursor: challenge.initialCursor!, keys })).toBe(challenge.targetContent);
});


it('adds history for navigation but not retry, and restores on popstate', () => {
  const push = vi.spyOn(window.history, 'pushState');
  root.querySelector<HTMLButtonElement>('[data-next-button]')!.click();
  expect(push).toHaveBeenCalledTimes(1);
  expect(window.location.search).toContain('motion-02');
  root.querySelector<HTMLButtonElement>('[data-retry-button]')!.click();
  expect(push).toHaveBeenCalledTimes(1);
  window.history.replaceState({ host: 'preserved' }, '', '/?challenge=motion-01');
  window.dispatchEvent(new PopStateEvent('popstate'));
  expect(root.querySelector('[data-title]')?.textContent).toBe('Start of line');
  expect(window.history.state).toEqual({ host: 'preserved' });
  expect(push).toHaveBeenCalledTimes(1);
});

it('stops countdowns on history navigation and ignores other host routes', () => {
  solve();
  window.history.replaceState(null, '', '/?challenge=motion-01');
  window.dispatchEvent(new PopStateEvent('popstate'));
  vi.advanceTimersByTime(6000);
  expect(root.querySelector('[data-title]')?.textContent).toBe('Start of line');
  window.history.replaceState(null, '', '/about');
  window.dispatchEvent(new PopStateEvent('popstate'));
  expect(window.location.pathname).toBe('/about');
});

function exCommand(command: string) {
  root.querySelector('.cm-content')!.dispatchEvent(new KeyboardEvent('keydown', { key: ':', bubbles: true, cancelable: true }));
  const input = root.querySelector<HTMLInputElement>('.cm-vim-panel input')!;
  for (const key of command) {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    input.value += key;
  }
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
}

it('deletes all Python comment lines using the global command hint', () => {
  unmount();
  const challenge = operatorChallenges.find((entry) => entry.id === 'operator-18')!;
  unmount = mountVimDojo(root, { basePath: '/', challenges: [challenge] });
  const command = challenge.hints!.at(-1)!.match(/`([^`]+)`/)![1]!;
  exCommand(command.slice(1));
  const view = EditorView.findFromDOM(root.querySelector('.cm-editor')! as HTMLElement)!;
  expect(view.state.doc.toString()).toBe(challenge.targetContent);
  expect(root.querySelector('[data-toast]')?.hasAttribute('hidden')).toBe(false);
});

it.each(['hint', 'hi'])('scores :%s the same as the Hint button', (command) => {
  root.querySelector<HTMLButtonElement>('[data-hint-button]')!.click();
  solve();
  const buttonScore = root.querySelector('[data-keystrokes]')!.textContent;
  root.querySelector<HTMLButtonElement>('[data-retry-button]')!.click();
  exCommand(command);
  expect(root.querySelector('[data-hint]')?.hasAttribute('hidden')).toBe(false);
  solve();
  expect(root.querySelector('[data-keystrokes]')!.textContent).toBe(buttonScore);
  expect(root.querySelector('[data-time]')!.textContent).toBe('1.00s');
});

it('keeps editing Ex commands in the score', () => {
  exCommand('s/ab//');
  expect(root.querySelector('.cm-content')?.textContent).toBe('c');
  expect(root.querySelector('[data-keystrokes]')?.textContent).toBe('7 command keys · par 2');
});

it('preserves practice keys entered before a hint', () => {
  root.querySelector('.cm-content')!.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true, cancelable: true }));
  exCommand('hint');
  solve();
  expect(root.querySelector('[data-keystrokes]')?.textContent).toBe('3 command keys · par 2');
});
