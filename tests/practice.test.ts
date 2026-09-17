/** @vitest-environment jsdom */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mountVimDojo } from '../src/mount';
import { motionChallenges } from '../src/challenges/motion';
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
  expect(root.querySelector('[data-keystrokes]')?.textContent).toBe('2 keys · par 2');
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
