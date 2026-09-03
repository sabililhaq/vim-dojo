import type { Category, Challenge } from "./challenges";

export const PLAY_MODES = ["sequence", "random", "daily"] as const;
export type PlayMode = (typeof PLAY_MODES)[number];

export type PlaylistQuery = {
  challenge: string | null;
  category: Category | null;
  mode: PlayMode;
};

export type Playlist = {
  items: Challenge[];
  index: number;
  query: PlaylistQuery;
  shuffleIds: string[] | null;
  dailyDate: string | null;
};

export function categoriesIn(challenges: readonly Challenge[]): Category[] {
  const seen = new Set<Category>();
  const order: Category[] = [];
  for (const challenge of challenges) {
    if (seen.has(challenge.category)) continue;
    seen.add(challenge.category);
    order.push(challenge.category);
  }
  return order;
}

export function parseQuery(
  search: string | URLSearchParams,
  categories: readonly Category[],
): PlaylistQuery {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const categoryParam = params.get("category");
  const category =
    categoryParam && categories.includes(categoryParam as Category)
      ? (categoryParam as Category)
      : null;

  const modeParam = params.get("mode");
  const mode: PlayMode =
    params.has("daily") || modeParam === "daily"
      ? "daily"
      : modeParam === "random"
        ? "random"
        : "sequence";

  return {
    challenge: params.get("challenge") || null,
    category,
    mode,
  };
}

export function toSearchParams(query: PlaylistQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.mode === "daily") params.set("mode", "daily");
  if (query.category && query.mode !== "daily")
    params.set("category", query.category);
  if (query.challenge) params.set("challenge", query.challenge);
  return params;
}

export function playlistUrl(basePath: string, query: PlaylistQuery): string {
  const path =
    basePath.endsWith("/") && basePath.length > 1
      ? basePath.slice(0, -1)
      : basePath;
  const qs = toSearchParams(query).toString();
  return `${path || "/"}${qs ? `?${qs}` : ""}`;
}

export function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function dailyChallenge(
  challenges: readonly Challenge[],
  date: Date,
): Challenge | undefined {
  if (challenges.length === 0) return undefined;
  return challenges[hashString(utcDateString(date)) % challenges.length];
}

export function filterByCategory(
  challenges: readonly Challenge[],
  category: Category | null,
): Challenge[] {
  if (!category) return [...challenges];
  return challenges.filter((challenge) => challenge.category === category);
}

export function shuffleUnsolved(
  challenges: readonly Challenge[],
  completedIds: readonly string[],
  rng: () => number = Math.random,
): Challenge[] {
  const completed = new Set(completedIds);
  const unsolved = challenges.filter(
    (challenge) => !completed.has(challenge.id),
  );
  const pool = unsolved.length > 0 ? unsolved : [...challenges];
  return fisherYates(pool, rng);
}

export function createPlaylist(args: {
  challenges: readonly Challenge[];
  query: PlaylistQuery;
  completedIds?: readonly string[];
  lastChallengeId?: string | null;
  shuffleIds?: readonly string[] | null;
  now?: Date;
  rng?: () => number;
  reshuffle?: boolean;
}): Playlist {
  const {
    challenges,
    query,
    completedIds = [],
    lastChallengeId = null,
    shuffleIds = null,
    now = new Date(),
    rng = Math.random,
    reshuffle = false,
  } = args;

  if (query.mode === "daily") {
    const today = dailyChallenge(challenges, now);
    // A daily URL with ?challenge= keeps that case after midnight; ?mode=daily alone is today.
    const pinned = challenges.find(
      (challenge) => challenge.id === query.challenge,
    );
    const current = pinned ?? today;
    const items = current ? [current] : [];
    const isToday = Boolean(current && today && current.id === today.id);
    return {
      items,
      index: 0,
      query: { mode: "daily", category: null, challenge: current?.id ?? null },
      shuffleIds: null,
      dailyDate: isToday ? utcDateString(now) : null,
    };
  }

  const scoped = filterByCategory(challenges, query.category);
  const category = scoped.length > 0 ? query.category : null;
  const pool = scoped.length > 0 ? scoped : [...challenges];

  if (query.mode === "random") {
    const known = new Set(pool.map((challenge) => challenge.id));
    const restored =
      !reshuffle && shuffleIds
        ? shuffleIds.flatMap((id) => {
            if (!known.has(id)) return [];
            const match = pool.find((challenge) => challenge.id === id);
            return match ? [match] : [];
          })
        : [];
    const items = restored.length > 0 ? restored : fisherYates(pool, rng);
    const index = reshuffle
      ? 0
      : pickIndex(items, query.challenge, lastChallengeId);
    return {
      items,
      index,
      query: { mode: "random", category, challenge: items[index]?.id ?? null },
      shuffleIds: items.map((challenge) => challenge.id),
      dailyDate: null,
    };
  }

  const index = pickIndex(pool, query.challenge, lastChallengeId);
  return {
    items: pool,
    index,
    query: { mode: "sequence", category, challenge: pool[index]?.id ?? null },
    shuffleIds: null,
    dailyDate: null,
  };
}

function pickIndex(
  items: readonly Challenge[],
  challengeId: string | null,
  lastChallengeId: string | null,
): number {
  const fromQuery = indexOfId(items, challengeId);
  if (fromQuery >= 0) return fromQuery;
  const fromLast = indexOfId(items, lastChallengeId);
  if (fromLast >= 0) return fromLast;
  return 0;
}

function indexOfId(items: readonly Challenge[], id: string | null): number {
  if (!id) return -1;
  return items.findIndex((challenge) => challenge.id === id);
}

function fisherYates<T>(items: readonly T[], rng: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const current = next[i];
    const swap = next[j];
    if (current === undefined || swap === undefined) continue;
    next[i] = swap;
    next[j] = current;
  }
  return next;
}
