export type VimMode = 'normal' | 'insert' | 'visual';

export type InteractionEvent =
  | { type: 'key'; key: string; mode: VimMode; t: number }
  | { type: 'mode-change'; from: VimMode; to: VimMode; t: number }
  | { type: 'mouse-down'; t: number }
  | { type: 'mouse-selection'; length: number; t: number }
  | { type: 'paste'; length: number; t: number }
  | { type: 'undo' | 'redo'; t: number };

export type TelemetrySnapshot = {
  mouseDownCount: number;
  mouseSelectionChars: number;
  pasteChars: number;
  keyEventCount: number;
  changedModes: boolean;
};

export function summarizeTelemetry(events: InteractionEvent[]): TelemetrySnapshot {
  return events.reduce<TelemetrySnapshot>(
    (snapshot, event) => {
      if (event.type === 'mouse-down') snapshot.mouseDownCount += 1;
      if (event.type === 'mouse-selection') snapshot.mouseSelectionChars += event.length;
      if (event.type === 'paste') snapshot.pasteChars += event.length;
      if (event.type === 'key') snapshot.keyEventCount += 1;
      if (event.type === 'mode-change' && event.from !== event.to) snapshot.changedModes = true;

      return snapshot;
    },
    {
      mouseDownCount: 0,
      mouseSelectionChars: 0,
      pasteChars: 0,
      keyEventCount: 0,
      changedModes: false,
    },
  );
}
