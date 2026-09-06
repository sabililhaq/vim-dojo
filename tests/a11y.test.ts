/** @vitest-environment jsdom */
import { EditorView } from "@codemirror/view";
import { getCM, Vim } from "@replit/codemirror-vim";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mountVimDojo } from "../src/mount";
import { installJsdomLayout } from "./play-keys";

function mockMatchMedia(): void {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }) as MediaQueryList;
}

function vimAdapter(root: HTMLElement) {
  const editor = root.querySelector<HTMLElement>(".cm-editor");
  if (!editor) throw new Error("Missing editor");
  const cm = getCM(EditorView.findFromDOM(editor)!);
  if (!cm) throw new Error("Missing vim adapter");
  return cm;
}

function openVimPanel(root: HTMLElement, key: string): HTMLInputElement | null {
  const cm = vimAdapter(root);
  Vim.handleKey(cm, key, "user");
  return (
    cm.state.dialog?.querySelector("input") ??
    root.querySelector(".cm-vim-panel input")
  );
}

describe("Vim Dojo a11y", () => {
  let root: HTMLElement;
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    installJsdomLayout();
    mockMatchMedia();
    root = document.createElement("div");
    document.body.append(root);
    unmount = mountVimDojo(root, { basePath: "/" });
  });

  afterEach(() => {
    unmount?.();
    root.remove();
  });

  it("uses the challenge title as the first heading", () => {
    expect(root.querySelector("[data-title]")?.tagName).toBe("H1");
    expect(root.querySelector(".intro-title")?.tagName).toBe("P");
    expect(root.querySelectorAll("h1")).toHaveLength(1);
  });

  it("marks the toast atomic and disables Previous on the first case", () => {
    expect(root.querySelector("[data-toast]")?.getAttribute("aria-atomic")).toBe(
      "true",
    );
    expect(
      root.querySelector<HTMLButtonElement>("[data-previous-button]")?.disabled,
    ).toBe(true);
  });

  it("labels the vim command and search inputs when the panel opens", () => {
    const command = openVimPanel(root, ":");
    expect(command?.getAttribute("aria-label")).toBe("Vim command");

    Vim.handleKey(vimAdapter(root), "<Esc>", "user");

    const search = openVimPanel(root, "/");
    expect(search?.getAttribute("aria-label")).toBe("Vim search");
  });
});
