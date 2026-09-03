import { describe, expect, it } from "vitest";
import {
  challengeSets,
  vimChallenges,
  type Challenge,
} from "../src/challenges";
import {
  categoriesIn,
  createPlaylist,
  dailyChallenge,
  filterByCategory,
  hashString,
  parseQuery,
  playlistUrl,
  shuffleUnsolved,
  utcDateString,
} from "../src/playlist";

const sample: Challenge[] = [
  {
    id: "motion-01",
    title: "A",
    description: "A",
    category: "motion",
    difficulty: "easy",
    initialContent: "a",
    targetContent: "b",
  },
  {
    id: "motion-02",
    title: "B",
    description: "B",
    category: "motion",
    difficulty: "easy",
    initialContent: "a",
    targetContent: "c",
  },
  {
    id: "operator-01",
    title: "C",
    description: "C",
    category: "operator",
    difficulty: "easy",
    initialContent: "a",
    targetContent: "d",
  },
];

const categories = categoriesIn(sample);

describe("playlist query", () => {
  it("parses category, random, daily, and the ?daily alias", () => {
    expect(
      parseQuery("?category=motion&challenge=motion-02", categories),
    ).toEqual({
      challenge: "motion-02",
      category: "motion",
      mode: "sequence",
    });
    expect(parseQuery("?mode=random&category=operator", categories).mode).toBe(
      "random",
    );
    expect(parseQuery("?mode=daily", categories)).toEqual({
      challenge: null,
      category: null,
      mode: "daily",
    });
    expect(parseQuery("?daily", categories).mode).toBe("daily");
  });

  it("ignores unknown categories and modes", () => {
    expect(parseQuery("?category=macros&mode=skill-tree", categories)).toEqual({
      challenge: null,
      category: null,
      mode: "sequence",
    });
  });

  it("builds shareable URLs without a trailing empty query", () => {
    expect(
      playlistUrl("/vim", {
        mode: "sequence",
        category: null,
        challenge: "motion-01",
      }),
    ).toBe("/vim?challenge=motion-01");
    expect(
      playlistUrl("/vim/", {
        mode: "random",
        category: "motion",
        challenge: "motion-02",
      }),
    ).toBe("/vim?mode=random&category=motion&challenge=motion-02");
    expect(
      playlistUrl("/vim", {
        mode: "daily",
        category: "motion",
        challenge: "operator-01",
      }),
    ).toBe("/vim?mode=daily&challenge=operator-01");
    expect(
      playlistUrl("/", { mode: "sequence", category: null, challenge: null }),
    ).toBe("/");
  });
});

describe("category play", () => {
  it("keeps Next/Previous inside the filtered set", () => {
    const playlist = createPlaylist({
      challenges: sample,
      query: { mode: "sequence", category: "motion", challenge: "motion-01" },
    });

    expect(playlist.items.map((challenge) => challenge.id)).toEqual([
      "motion-01",
      "motion-02",
    ]);
    expect(playlist.index).toBe(0);
    expect(playlist.query.category).toBe("motion");
    expect(
      playlist.items.every((challenge) => challenge.category === "motion"),
    ).toBe(true);
  });

  it("falls back when the challenge is outside the category", () => {
    const playlist = createPlaylist({
      challenges: sample,
      query: { mode: "sequence", category: "motion", challenge: "operator-01" },
      lastChallengeId: "motion-02",
    });

    expect(playlist.query.challenge).toBe("motion-02");
    expect(playlist.index).toBe(1);
  });

  it("filters the real curriculum by category", () => {
    const playlist = createPlaylist({
      challenges: vimChallenges,
      query: { mode: "sequence", category: "search", challenge: null },
    });

    expect(playlist.items).toHaveLength(challengeSets.search.length);
    expect(
      playlist.items.every((challenge) => challenge.category === "search"),
    ).toBe(true);
  });
});

describe("random review", () => {
  it("prefers unsolved cases and does not reshuffle a restored list", () => {
    const first = createPlaylist({
      challenges: sample,
      query: { mode: "random", category: null, challenge: null },
      completedIds: ["motion-01"],
      rng: () => 0,
    });

    expect(first.items.map((challenge) => challenge.id)).toEqual([
      "operator-01",
      "motion-02",
    ]);
    expect(first.shuffleIds).toEqual(["operator-01", "motion-02"]);

    const restored = createPlaylist({
      challenges: sample,
      query: { mode: "random", category: null, challenge: "motion-02" },
      completedIds: ["motion-01", "motion-02"],
      shuffleIds: first.shuffleIds,
    });

    expect(restored.items.map((challenge) => challenge.id)).toEqual([
      "operator-01",
      "motion-02",
    ]);
    expect(restored.index).toBe(1);
  });

  it("reshuffles only when asked, and shuffles the full set once everything is done", () => {
    const shuffled = createPlaylist({
      challenges: sample,
      query: { mode: "random", category: "motion", challenge: null },
      completedIds: ["motion-01", "motion-02"],
      shuffleIds: ["motion-01"],
      reshuffle: true,
      rng: () => 0,
    });

    expect(shuffled.items.map((challenge) => challenge.id)).toEqual([
      "motion-02",
      "motion-01",
    ]);
  });

  it("ignores the previous challenge when reshuffling a random playlist", () => {
    const shuffled = createPlaylist({
      challenges: sample,
      query: { mode: "random", category: null, challenge: null },
      lastChallengeId: "motion-01",
      reshuffle: true,
      rng: () => 0,
    });

    expect(shuffled.items.map((challenge) => challenge.id)).toEqual([
      "motion-02",
      "operator-01",
      "motion-01",
    ]);
    expect(shuffled.index).toBe(0);
    expect(shuffled.query.challenge).toBe("motion-02");
  });

  it("can randomize inside a category", () => {
    const playlist = createPlaylist({
      challenges: sample,
      query: { mode: "random", category: "motion", challenge: null },
      rng: () => 0,
    });

    expect(
      playlist.items.every((challenge) => challenge.category === "motion"),
    ).toBe(true);
    expect(playlist.query.category).toBe("motion");
  });
});

describe("daily kata", () => {
  it("picks one deterministic case per UTC day", () => {
    const morning = dailyChallenge(
      vimChallenges,
      new Date("2026-08-20T00:00:00.000Z"),
    );
    const night = dailyChallenge(
      vimChallenges,
      new Date("2026-08-20T23:59:59.999Z"),
    );

    expect(morning?.id).toBe(night?.id);
    expect(morning?.id).toBeTruthy();
    expect(hashString("2026-08-20")).not.toBe(hashString("2026-08-21"));
    expect(utcDateString(new Date("2026-08-20T12:00:00.000Z"))).toBe(
      "2026-08-20",
    );

    const today = createPlaylist({
      challenges: vimChallenges,
      query: { mode: "daily", category: "motion", challenge: null },
      now: new Date("2026-08-20T12:00:00.000Z"),
    });

    expect(today.items).toHaveLength(1);
    expect(today.items[0]?.id).toBe(morning?.id);
    expect(today.query.category).toBeNull();
    expect(today.dailyDate).toBe("2026-08-20");
  });

  it("keeps a pinned daily challenge after midnight", () => {
    const today = dailyChallenge(sample, new Date("2026-08-21T00:00:00.000Z"));
    const yesterday = sample.find((challenge) => challenge.id !== today?.id);
    expect(yesterday).toBeTruthy();

    const pinned = createPlaylist({
      challenges: sample,
      query: { mode: "daily", category: null, challenge: yesterday!.id },
      now: new Date("2026-08-21T00:00:00.000Z"),
    });

    expect(pinned.items[0]?.id).toBe(yesterday!.id);
    expect(pinned.dailyDate).toBeNull();
  });
});

describe("playlist helpers", () => {
  it("lists categories in first-seen order", () => {
    expect(categoriesIn(vimChallenges)).toEqual([
      "motion",
      "operator",
      "text-object",
      "visual",
      "search",
      "replace",
      "register",
      "mark",
      "macro",
      "format",
      "multi-cursor",
    ]);
    expect(filterByCategory(vimChallenges, "replace")).toEqual(
      challengeSets.replace,
    );
  });

  it("shuffles unsolved cases and falls back to the full set", () => {
    const unsolved = shuffleUnsolved(
      sample,
      ["motion-01", "operator-01"],
      () => 0,
    );
    expect(unsolved.map((challenge) => challenge.id)).toEqual(["motion-02"]);

    const allDone = shuffleUnsolved(
      sample,
      ["motion-01", "motion-02", "operator-01"],
      () => 0,
    );
    expect(allDone.map((challenge) => challenge.id).sort()).toEqual([
      "motion-01",
      "motion-02",
      "operator-01",
    ]);
  });
});
