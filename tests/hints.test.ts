/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vimChallenges } from "../src/challenges";
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

describe("Vim Dojo interactive hints", () => {
  let root: HTMLElement;
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    installJsdomLayout();
    mockMatchMedia();
    root = document.createElement("div");
    document.body.append(root);
    const first = vimChallenges.find((challenge) => challenge.id === "motion-01");
    unmount = mountVimDojo(root, {
      basePath: "/",
      challenges: first ? [first] : vimChallenges.slice(0, 1),
    });
  });

  afterEach(() => {
    unmount?.();
    root.remove();
  });

  it("highlights the changed span on the first hint and ghosts the next key after", () => {
    const hintButton = root.querySelector<HTMLButtonElement>(
      "[data-hint-button]",
    );
    const hintText = root.querySelector("[data-hint-text]");
    const hintGhost = root.querySelector("[data-hint-ghost]");

    hintButton?.click();

    expect(root.querySelector(".cm-target-span")?.textContent).toBe("debug");
    expect(hintText?.textContent).toContain("end of the line");
    expect(hintGhost?.hasAttribute("hidden")).toBe(true);

    hintButton?.click();

    expect(hintGhost?.textContent).toBe("Next key: 0");
    expect(hintGhost?.hasAttribute("hidden")).toBe(false);
  });
});
