import { history } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { drawSelection, EditorView } from "@codemirror/view";
import { getCM, vim, Vim } from "@replit/codemirror-vim";
import {
  vimChallenges as defaultChallenges,
  type Category,
  type Challenge,
} from "./challenges";
import { classifyAttempt, methodLabel, type Method } from "./classifier";
import {
  categoriesIn,
  createPlaylist,
  parseQuery,
  playlistUrl,
  type Playlist,
  type PlaylistQuery,
} from "./playlist";
import { isChallengeComplete } from "./validator";
import { vimDojoMarkup } from "./template";
import type { InteractionEvent, VimMode } from "./telemetry";
import "./styles.css";

export type MountVimDojoOptions = {
  basePath?: string;
  challenges?: Challenge[];
};

type VimState = {
  visualMode?: boolean;
  insertMode?: boolean;
};

type ShuffleState = {
  category: Category | null;
  ids: string[];
};

export function mountVimDojo(
  root: HTMLElement,
  options: MountVimDojoOptions = {},
): () => void {
  const challenges = options.challenges ?? defaultChallenges;
  const basePath = options.basePath ?? "/vim";
  const categories = categoriesIn(challenges);

  if (!root.querySelector("[data-vim-dojo]")) {
    root.innerHTML = vimDojoMarkup;
  }

  const dojo = root.querySelector<HTMLElement>("[data-vim-dojo]");
  const editorParent = dojo?.querySelector<HTMLElement>("[data-editor]");

  const els = {
    shell: dojo?.querySelector<HTMLElement>("[data-state]"),
    count: dojo?.querySelector<HTMLElement>("[data-challenge-count]"),
    category: dojo?.querySelector<HTMLElement>("[data-category]"),
    title: dojo?.querySelector<HTMLElement>("[data-title]"),
    description: dojo?.querySelector<HTMLElement>("[data-description]"),
    toast: dojo?.querySelector<HTMLElement>("[data-toast]"),
    resultMessage: dojo?.querySelector<HTMLElement>("[data-result-message]"),
    method: dojo?.querySelector<HTMLElement>("[data-method]"),
    keystrokes: dojo?.querySelector<HTMLElement>("[data-keystrokes]"),
    time: dojo?.querySelector<HTMLElement>("[data-time]"),
    hint: dojo?.querySelector<HTMLElement>("[data-hint]"),
    hintButton: dojo?.querySelector<HTMLButtonElement>("[data-hint-button]"),
    retryButton: dojo?.querySelector<HTMLButtonElement>("[data-retry-button]"),
    nextButton: dojo?.querySelector<HTMLButtonElement>("[data-next-button]"),
    previousButton: dojo?.querySelector<HTMLButtonElement>(
      "[data-previous-button]",
    ),
    shuffleButton: dojo?.querySelector<HTMLButtonElement>(
      "[data-shuffle-button]",
    ),
    passed: dojo?.querySelector<HTMLElement>("[data-passed]"),
    autoContinue: dojo?.querySelector<HTMLElement>("[data-auto-continue]"),
    autoContinueLabel: dojo?.querySelector<HTMLElement>(
      "[data-auto-continue-label]",
    ),
    progress: dojo?.querySelector<HTMLElement>("[data-progress]"),
    mode: dojo?.querySelector<HTMLElement>("[data-mode]"),
    error: dojo?.querySelector<HTMLElement>("[data-error]"),
    categories: dojo?.querySelector<HTMLElement>("[data-categories]"),
  };

  const AUTO_CONTINUE_MS = 5000;

  let playlist: Playlist;
  let view: EditorView | undefined;
  let events: InteractionEvent[] = [];
  let startedAt: number | null = null;
  let completedAt: number | null = null;
  let completed = false;
  let hintIndex = 0;
  let currentMode: VimMode = "normal";
  let isMouseSelecting = false;
  let autoContinueTimer: ReturnType<typeof setTimeout> | null = null;
  let autoContinueTicker: ReturnType<typeof setInterval> | null = null;
  let autoContinueDeadline: number | null = null;

  function readLastChallenge(): string | null {
    try {
      return window.localStorage.getItem("vim-dojo:lastChallenge");
    } catch {
      return null;
    }
  }

  function readCompletedIds(): string[] {
    try {
      const parsed = JSON.parse(
        window.localStorage.getItem("vim-dojo:completed") ?? "[]",
      );
      return Array.isArray(parsed)
        ? parsed.filter((id) => typeof id === "string")
        : [];
    } catch {
      return [];
    }
  }

  function readShuffleState(): ShuffleState | null {
    try {
      const parsed = JSON.parse(
        window.sessionStorage.getItem("vim-dojo:shuffle") ?? "null",
      );
      if (!parsed || !Array.isArray(parsed.ids)) return null;
      return {
        category: categories.includes(parsed.category) ? parsed.category : null,
        ids: parsed.ids.filter((id: unknown) => typeof id === "string"),
      };
    } catch {
      return null;
    }
  }

  function writeShuffleState(
    category: Category | null,
    ids: string[] | null,
  ): void {
    if (!ids?.length) return;
    try {
      window.sessionStorage.setItem(
        "vim-dojo:shuffle",
        JSON.stringify({ category, ids }),
      );
    } catch {
      // sessionStorage may be unavailable in private browsing modes.
    }
  }

  function createInitialPlaylist(): Playlist {
    return buildPlaylist(parseQuery(window.location.search, categories), false);
  }

  function buildPlaylist(query: PlaylistQuery, reshuffle: boolean): Playlist {
    const shuffle = readShuffleState();
    const shuffleIds =
      !reshuffle &&
      query.mode === "random" &&
      shuffle &&
      shuffle.category === query.category
        ? shuffle.ids
        : null;
    const next = createPlaylist({
      challenges,
      query,
      completedIds: readCompletedIds(),
      lastChallengeId: readLastChallenge(),
      shuffleIds,
      reshuffle,
    });
    writeShuffleState(next.query.category, next.shuffleIds);
    return next;
  }

  function applyPlaylist(query: PlaylistQuery, reshuffle = false): void {
    playlist = buildPlaylist(query, reshuffle);
    renderChallenge();
  }

  function completedCount(): number {
    const known = new Set(playlist.items.map((challenge) => challenge.id));
    return readCompletedIds().filter((id) => known.has(id)).length;
  }

  function hasPassed(id: string): boolean {
    return readCompletedIds().includes(id);
  }

  function updatePassedMark(): void {
    const passed = hasPassed(currentChallenge().id);
    if (!els.passed) return;
    setText(els.passed, passed ? "✓" : "○");
    els.passed.setAttribute(
      "aria-label",
      passed ? "Challenge completed" : "Challenge not completed",
    );
    els.passed.setAttribute(
      "title",
      passed ? "Challenge completed" : "Challenge not completed",
    );
    els.passed.toggleAttribute("data-completed", passed);
  }

  function twoDigit(value: number): string {
    return String(value + 1).padStart(2, "0");
  }

  function currentChallenge(): Challenge {
    return playlist.items[playlist.index] ?? playlist.items[0] ?? challenges[0];
  }

  function setText(element: Element | null | undefined, text: string): void {
    if (element) element.textContent = text;
  }

  function modeFromView(): VimMode {
    const cm = view ? getCM(view) : null;
    const vimState = cm?.state?.vim as VimState | undefined;
    if (vimState?.visualMode) return "visual";
    if (vimState?.insertMode) return "insert";
    return "normal";
  }

  function record(event: InteractionEvent): void {
    if (!startedAt) startedAt = performance.now();
    events.push({ ...event, t: performance.now() });
  }

  function updateMode(): void {
    const nextMode = modeFromView();
    if (nextMode !== currentMode) {
      record({ type: "mode-change", from: currentMode, to: nextMode, t: 0 });
      currentMode = nextMode;
      setText(els.mode, `${nextMode[0].toUpperCase()}${nextMode.slice(1)}`);
    }
  }

  function contentOffset(
    position: { line: number; column: number },
    doc: EditorView["state"]["doc"],
  ): number {
    const line = doc.line(Math.min(position.line + 1, doc.lines));
    return Math.min(line.from + position.column, line.to);
  }

  function setInitialCursor(challenge: Challenge): void {
    if (!challenge.initialCursor || !view) return;
    const cursor = contentOffset(challenge.initialCursor, view.state.doc);
    view.dispatch({ selection: { anchor: cursor } });
  }

  function clearSearchHighlights(): void {
    const cm = view ? getCM(view) : null;
    if (!cm) return;

    // Clears CodeMirror search decorations (cm-searchMatch) left by /, ?, *, #.
    cm.removeOverlay();
    const vimState = cm.state?.vim as
      | (VimState & { searchState_?: { setOverlay(value: null): void } })
      | undefined;
    vimState?.searchState_?.setOverlay?.(null);
  }

  function forceNormalMode(): void {
    const cm = view ? getCM(view) : null;
    if (cm) {
      const vimState = cm.state?.vim as VimState | undefined;
      if (vimState?.insertMode) Vim.exitInsertMode(cm as never);
      if (vimState?.visualMode) Vim.exitVisualMode(cm as never);
      Vim.handleKey(cm, "<Esc>", "user");
      clearSearchHighlights();
    }

    currentMode = "normal";
    setText(els.mode, "Normal");
  }

  function resetTelemetry(): void {
    events = [];
    startedAt = null;
    completedAt = null;
    completed = false;
    hintIndex = 0;
    currentMode = "normal";
    setText(els.mode, "Normal");
  }

  function remainingAutoContinueSeconds(): number {
    if (autoContinueDeadline == null) return 0;
    return Math.max(
      0,
      Math.ceil((autoContinueDeadline - performance.now()) / 1000),
    );
  }

  function updateAutoContinueVisual(): void {
    const seconds = remainingAutoContinueSeconds();
    setText(els.autoContinueLabel, `Continuing in ${seconds}s`);
  }

  function cancelAutoContinue(): void {
    if (autoContinueTimer != null) {
      clearTimeout(autoContinueTimer);
      autoContinueTimer = null;
    }
    if (autoContinueTicker != null) {
      clearInterval(autoContinueTicker);
      autoContinueTicker = null;
    }
    autoContinueDeadline = null;
    els.autoContinue?.setAttribute("hidden", "");
    setText(els.autoContinueLabel, "");
  }

  function goToOffset(delta: number): void {
    const index = playlist.index + delta;
    if (index < 0 || index >= playlist.items.length) return;
    const challenge = playlist.items[index];
    playlist = {
      ...playlist,
      index,
      query: { ...playlist.query, challenge: challenge?.id ?? null },
    };
    renderChallenge();
  }

  function goToNext(): void {
    goToOffset(1);
  }

  function goToPrevious(): void {
    goToOffset(-1);
  }

  function goToAnotherChallenge(): void {
    if (playlist.items.length < 2) return;
    let index = playlist.index;
    while (index === playlist.index) {
      index = Math.floor(Math.random() * playlist.items.length);
    }
    const challenge = playlist.items[index];
    playlist = {
      ...playlist,
      index,
      query: { ...playlist.query, challenge: challenge?.id ?? null },
    };
    renderChallenge();
  }

  function registerExCommands(): void {
    Vim.defineEx("hint", "hi", renderHint);
    Vim.defineEx("retry", "r", renderChallenge);
    Vim.defineEx("previous", "p", goToPrevious);
    Vim.defineEx("next", "n", goToNext);
    Vim.defineEx("shuffle", "sh", goToAnotherChallenge);
  }

  function startAutoContinue(): void {
    cancelAutoContinue();
    if (playlist.index >= playlist.items.length - 1) return;

    autoContinueDeadline = performance.now() + AUTO_CONTINUE_MS;
    els.autoContinue?.removeAttribute("hidden");
    updateAutoContinueVisual();

    autoContinueTicker = setInterval(updateAutoContinueVisual, 200);
    autoContinueTimer = setTimeout(goToNext, AUTO_CONTINUE_MS);
  }

  function progressLabel(): string {
    if (playlist.query.mode === "daily") {
      return playlist.dailyDate ? `daily · ${playlist.dailyDate}` : "daily";
    }

    const total = String(playlist.items.length).padStart(2, "0");
    const done = completedCount();
    return `${twoDigit(playlist.index)} / ${total} · ${done} done`;
  }

  function replaceDocument(doc: string): void {
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: doc },
    });
  }

  function challengeUrl(id: string): string {
    return playlistUrl(basePath, { ...playlist.query, challenge: id });
  }

  function setPlaylistRow(
    row: HTMLElement | null | undefined,
    items: { href: string; label: string; current: boolean }[],
  ): void {
    if (!row) return;
    row.replaceChildren(
      ...items.map((item) => {
        const link = document.createElement("a");
        link.href = item.href;
        link.textContent = item.label;
        link.dataset.playlistLink = "";
        if (item.current) link.setAttribute("aria-current", "page");
        return link;
      }),
    );
  }

  function renderPlaylistNav(): void {
    const current = playlist.query;
    setPlaylistRow(els.categories, [
      {
        href: playlistUrl(basePath, {
          ...current,
          mode: current.mode === "daily" ? "sequence" : current.mode,
          category: null,
          challenge: null,
        }),
        label: "all",
        current: current.mode !== "daily" && current.category == null,
      },
      ...categories.map((category) => ({
        href: playlistUrl(basePath, {
          ...current,
          mode: current.mode === "daily" ? "sequence" : current.mode,
          category,
          challenge: null,
        }),
        label: category,
        current: current.mode !== "daily" && current.category === category,
      })),
    ]);
  }

  function renderChallenge(): void {
    const challenge = currentChallenge();
    cancelAutoContinue();
    forceNormalMode();
    resetTelemetry();
    renderPlaylistNav();

    const daily = playlist.query.mode === "daily";
    setText(
      els.count,
      daily ? "Daily kata" : `Challenge ${twoDigit(playlist.index)}`,
    );
    setText(els.category, `${challenge.category} / ${challenge.difficulty}`);
    setText(els.title, challenge.title);
    setText(els.description, challenge.description);
    setText(els.progress, progressLabel());
    setText(els.hint, "");
    setText(els.nextButton, "Next");
    els.hint?.setAttribute("hidden", "");
    els.toast?.setAttribute("hidden", "");
    els.previousButton?.toggleAttribute("hidden", daily);
    els.nextButton?.toggleAttribute("hidden", daily);
    els.shuffleButton?.removeAttribute("hidden");
    els.previousButton?.toggleAttribute(
      "disabled",
      playlist.index === 0 && playlist.query.mode !== "random",
    );
    els.nextButton?.toggleAttribute(
      "disabled",
      playlist.index >= playlist.items.length - 1,
    );
    els.hintButton?.removeAttribute("disabled");
    updatePassedMark();

    if (view) {
      replaceDocument(challenge.initialContent);
      setInitialCursor(challenge);
      view.focus();
    }

    window.history.replaceState(null, "", challengeUrl(challenge.id));
    try {
      window.localStorage.setItem("vim-dojo:lastChallenge", challenge.id);
    } catch {
      // localStorage may be unavailable in private browsing modes.
    }
  }

  function renderHint(): void {
    const challenge = currentChallenge();
    if (!challenge.hints?.length) return;

    const hint =
      challenge.hints[Math.min(hintIndex, challenge.hints.length - 1)];
    setText(els.hint, hint ?? "");
    els.hint?.removeAttribute("hidden");
    hintIndex += 1;

    if (hintIndex >= challenge.hints.length) {
      els.hintButton?.setAttribute("disabled", "");
    }

    view?.focus();
  }

  function completionMessage(method: Method, challenge: Challenge): string {
    if (method === "paste")
      return "You pasted the solution. Nothing wrong with that, but this dojo is for practicing Vim.";
    if (method === "manual" || method === "mixed")
      return "You solved it, but you missed some Vim practice.";
    if (method === "mostly-vim")
      return "Solved. One mouse interaction nudged this into mostly Vim.";
    return challenge.intendedMove
      ? `${challenge.intendedMove} was the intended move.`
      : "Nice.";
  }

  function completeChallenge(): void {
    if (completed) return;

    const challenge = currentChallenge();
    completed = true;
    completedAt = performance.now();
    const method = classifyAttempt(
      events,
      challenge.initialContent,
      challenge.targetContent,
    );
    const seconds = ((completedAt - (startedAt ?? completedAt)) / 1000).toFixed(
      2,
    );
    const keyEvents = events.filter((event) => event.type === "key").length;

    setText(els.resultMessage, completionMessage(method, challenge));
    setText(els.method, `Method: ${methodLabel(method)}`);
    setText(els.keystrokes, `${keyEvents} keystrokes`);
    setText(els.time, `${seconds}s`);
    els.toast?.removeAttribute("hidden");

    if (playlist.index >= playlist.items.length - 1) {
      setText(els.nextButton, "Set complete");
      els.nextButton?.setAttribute("disabled", "");
    } else {
      startAutoContinue();
    }

    try {
      window.localStorage.setItem(
        "vim-dojo:completed",
        JSON.stringify(
          Array.from(new Set([...readCompletedIds(), challenge.id])),
        ),
      );
      if (playlist.dailyDate) {
        window.localStorage.setItem(
          `vim-dojo:daily:${playlist.dailyDate}`,
          challenge.id,
        );
      }
    } catch {
      // Progress persistence is optional for the MVP.
    }

    updatePassedMark();
    setText(els.progress, progressLabel());
  }

  function onEditorUpdate(update: {
    docChanged: boolean;
    state: { doc: { toString(): string } };
  }): void {
    updateMode();
    if (!update.docChanged) return;

    const challenge = currentChallenge();
    if (
      isChallengeComplete(update.state.doc.toString(), challenge.targetContent)
    ) {
      completeChallenge();
    }
  }

  function prefersDarkTheme(): boolean {
    const theme = document.documentElement.dataset.theme;
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function createEditor(): void {
    if (!editorParent) throw new Error("Missing Vim Dojo editor");

    const challenge = currentChallenge();

    view = new EditorView({
      state: EditorState.create({
        doc: challenge.initialContent,
        extensions: [
          vim(),
          history(),
          drawSelection(),
          javascript(),
          EditorState.allowMultipleSelections.of(true),
          EditorView.lineWrapping,
          // Match host dark/light so CM panels/search chrome aren't stuck on light defaults.
          EditorView.theme({}, { dark: prefersDarkTheme() }),
          EditorView.updateListener.of(onEditorUpdate),
        ],
      }),
      parent: editorParent,
    });

    editorParent.addEventListener("keydown", (event) => {
      record({ type: "key", key: event.key, mode: currentMode, t: 0 });
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        record({ type: event.shiftKey ? "redo" : "undo", t: 0 });
      }
      if ((event.metaKey || event.ctrlKey) && key === "y")
        record({ type: "redo", t: 0 });
      queueMicrotask(updateMode);
    });

    editorParent.addEventListener(
      "mousedown",
      () => {
        const alreadyFocused = Boolean(view?.hasFocus);
        isMouseSelecting = true;
        if (alreadyFocused) record({ type: "mouse-down", t: 0 });
      },
      true,
    );

    window.addEventListener("mouseup", onWindowMouseUp);

    editorParent.addEventListener("paste", (event) => {
      const text = event.clipboardData?.getData("text") ?? "";
      record({ type: "paste", length: text.length, t: 0 });
    });

    setInitialCursor(challenge);
    view.focus();
  }

  function onWindowMouseUp(): void {
    if (!isMouseSelecting || !view) return;
    isMouseSelecting = false;
    const selectionLength = view.state.selection.ranges.reduce(
      (total, range) => total + Math.abs(range.to - range.from),
      0,
    );
    if (selectionLength > 0)
      record({ type: "mouse-selection", length: selectionLength, t: 0 });
  }

  function onPlaylistClick(event: MouseEvent): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link =
      event.target instanceof Element
        ? event.target.closest("a[data-playlist-link]")
        : null;
    if (!(link instanceof HTMLAnchorElement)) return;

    event.preventDefault();
    applyPlaylist(parseQuery(new URL(link.href).search, categories));
  }

  function unmount(): void {
    cancelAutoContinue();
    window.removeEventListener("mouseup", onWindowMouseUp);
    view?.destroy();
    view = undefined;
    root.replaceChildren();
  }

  try {
    if (!dojo || !editorParent) throw new Error("Missing Vim Dojo root");

    playlist = createInitialPlaylist();
    registerExCommands();
    createEditor();
    renderChallenge();
    els.shell?.setAttribute("data-state", "ready");

    els.hintButton?.addEventListener("click", renderHint);
    els.retryButton?.addEventListener("click", renderChallenge);
    els.nextButton?.addEventListener("click", goToNext);
    els.previousButton?.addEventListener("click", goToPrevious);
    els.shuffleButton?.addEventListener("click", () => {
      goToAnotherChallenge();
    });
    els.categories?.addEventListener("click", onPlaylistClick);
  } catch (error) {
    console.error(error);
    els.error?.removeAttribute("hidden");
    els.shell?.setAttribute("data-state", "error");
  }

  return unmount;
}
