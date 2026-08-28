import { history } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { EditorSelection, EditorState } from '@codemirror/state';
import { drawSelection, EditorView } from '@codemirror/view';
import { getCM, vim, Vim } from '@replit/codemirror-vim';
import type { Position } from '../src/challenges/types';

type VimCm = NonNullable<ReturnType<typeof getCM>> & {
  replaceSelection(text: string): void;
  operation<T>(fn: () => T): T;
};

type VimState = {
  insertMode?: boolean;
};

const emptyRect = {
  x: 0,
  y: 0,
  width: 8,
  height: 16,
  top: 0,
  left: 0,
  right: 8,
  bottom: 16,
  toJSON() {
    return this;
  },
};

let layoutInstalled = false;

function installJsdomLayout(): void {
  if (layoutInstalled) return;
  layoutInstalled = true;

  Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return emptyRect as DOMRect;
  };
  Range.prototype.getClientRects = function getClientRects() {
    return {
      length: 1,
      item: (index: number) => (index === 0 ? (emptyRect as DOMRect) : null),
      0: emptyRect as DOMRect,
      [Symbol.iterator]: function* () {
        yield emptyRect as DOMRect;
      },
    } as unknown as DOMRectList;
  };

  EditorView.prototype.moveVertically = function moveVertically(start, forward) {
    const doc = this.state.doc;
    const line = doc.lineAt(start.head);
    const col = start.goalColumn ?? start.head - line.from;
    const nextNumber = forward ? line.number + 1 : line.number - 1;
    if (nextNumber < 1 || nextNumber > doc.lines) {
      return EditorSelection.cursor(start.head, start.assoc, undefined, col);
    }
    const next = doc.line(nextNumber);
    return EditorSelection.cursor(Math.min(next.from + col, next.to), start.assoc, undefined, col);
  };
}

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

function createEditor(content: string, cursor: Position): { view: EditorView; cm: VimCm } {
  installJsdomLayout();
  Vim.resetVimGlobalState_();

  const parent = document.createElement('div');
  document.body.appendChild(parent);

  const view = new EditorView({
    state: EditorState.create({
      doc: content,
      extensions: [
        vim(),
        history(),
        drawSelection(),
        javascript(),
        EditorState.allowMultipleSelections.of(true),
        EditorView.lineWrapping,
      ],
    }),
    parent,
  });

  const cm = getCM(view) as VimCm | null;
  if (!cm) throw new Error('Vim adapter missing');
  cm.setCursor(cursor.line, cursor.column);
  return { view, cm };
}

function sendKeys(cm: VimCm, keys: string): void {
  for (const key of tokenizeKeys(keys)) {
    const handled = Vim.handleKey(cm, key, 'user');
    const vimState = cm.state.vim as VimState | undefined;
    if (!handled && vimState?.insertMode && key.length === 1) {
      cm.operation(() => {
        cm.replaceSelection(key);
      });
    }
  }
}

export function playKeys(args: {
  content: string;
  cursor: Position;
  keys: string;
}): string {
  const { view, cm } = createEditor(args.content, args.cursor);
  sendKeys(cm, args.keys);
  const result = view.state.doc.toString();
  view.destroy();
  view.dom.parentElement?.remove();
  return result;
}


