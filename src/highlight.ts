import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import { changedSpan } from './validator';

export const setTargetHighlight = StateEffect.define<{
  from: number;
  to: number;
} | null>();

const targetMark = Decoration.mark({ class: 'cm-target-span' });

export const targetHighlightField = StateField.define({
  create: () => Decoration.none,
  update(decorations, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setTargetHighlight)) {
        const span = effect.value;
        if (!span || span.from >= span.to) return Decoration.none;
        const from = Math.max(0, span.from);
        const to = Math.min(transaction.state.doc.length, span.to);
        if (from >= to) return Decoration.none;
        return Decoration.set([targetMark.range(from, to)]);
      }
    }
    if (transaction.docChanged) return decorations.map(transaction.changes);
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

export function targetHighlightEffect(currentContent: string, targetContent: string) {
  return setTargetHighlight.of(changedSpan(currentContent, targetContent));
}
