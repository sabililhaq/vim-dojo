import type { InteractionEvent } from './telemetry';

const SKIP_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'CapsLock',
  'Enter',
  'Escape',
  'Tab',
]);

export function tokenizeKeys(sequence: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < sequence.length; i += 1) {
    if (sequence[i] === '<') {
      const end = sequence.indexOf('>', i + 1);
      if (end !== -1 && end - i < 12) {
        keys.push(sequence.slice(i, end + 1));
        i = end;
        continue;
      }
    }
    keys.push(sequence[i]!);
  }
  return keys;
}

export function parFor(intendedMove: string | undefined): number {
  const tokens = tokenizeKeys(intendedMove ?? '');
  return Math.max(1, tokens.length);
}

export function practiceKeyCount(events: readonly InteractionEvent[]): number {
  return events.filter(
    (event) =>
      event.type === 'key' &&
      event.mode !== 'insert' &&
      !SKIP_KEYS.has(event.key),
  ).length;
}
