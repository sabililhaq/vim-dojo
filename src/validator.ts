export type ContentSpan = {
  from: number;
  to: number;
};

export function normalizeChallengeContent(content: string): string {
  return content.replace(/\r\n?/g, '\n').trim();
}

export function changedSpan(
  currentContent: string,
  targetContent: string,
): ContentSpan | null {
  const current = currentContent.replace(/\r\n?/g, '\n');
  const target = targetContent.replace(/\r\n?/g, '\n');
  if (current === target) return null;

  let prefix = 0;
  const maxPrefix = Math.min(current.length, target.length);
  while (prefix < maxPrefix && current[prefix] === target[prefix]) prefix += 1;

  let suffix = 0;
  while (
    suffix < current.length - prefix &&
    suffix < target.length - prefix &&
    current[current.length - 1 - suffix] === target[target.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const from = prefix;
  const to = current.length - suffix;
  if (from < to) return { from, to };
  if (from < current.length) return { from, to: from + 1 };
  if (from > 0) return { from: from - 1, to: from };
  return null;
}

export function isChallengeComplete(currentContent: string, targetContent: string): boolean {
  return normalizeChallengeContent(currentContent) === normalizeChallengeContent(targetContent);
}

export function contentDiffSize(initialContent: string, targetContent: string): number {
  const initial = normalizeChallengeContent(initialContent);
  const target = normalizeChallengeContent(targetContent);
  return Math.max(1, levenshtein(initial, target));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
}
