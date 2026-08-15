import { contentDiffSize } from './validator';
import { summarizeTelemetry, type InteractionEvent } from './telemetry';

export type Method = 'vim' | 'mostly-vim' | 'mixed' | 'manual' | 'paste';

export function classifyAttempt(
  events: InteractionEvent[],
  initialContent: string,
  targetContent: string,
): Method {
  const summary = summarizeTelemetry(events);
  const diffSize = contentDiffSize(initialContent, targetContent);

  if (summary.pasteChars >= diffSize * 0.5) return 'paste';
  if (summary.mouseSelectionChars >= diffSize * 0.5) return 'manual';

  // `dd` / `x` never leave Normal; only score that as manual when there were no keys.
  if (summary.keyEventCount === 0 && (summary.mouseDownCount > 0 || summary.mouseSelectionChars > 0)) {
    return 'manual';
  }

  if (summary.mouseDownCount > 1 || summary.mouseSelectionChars > 0) return 'mixed';
  if (summary.mouseDownCount === 1) return 'mostly-vim';

  return 'vim';
}

export function methodLabel(method: Method): string {
  const labels: Record<Method, string> = {
    vim: 'Vim',
    'mostly-vim': 'Mostly Vim',
    mixed: 'Mixed',
    manual: 'Manual',
    paste: 'Paste',
  };

  return labels[method];
}
