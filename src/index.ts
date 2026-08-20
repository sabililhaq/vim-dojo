export { mountVimDojo, type MountVimDojoOptions } from './mount';
export {
  vimChallenges,
  type Category,
  type Challenge,
  type Position,
} from './challenges';
export {
  categoriesIn,
  createPlaylist,
  parseQuery,
  playlistUrl,
  type PlayMode,
  type Playlist,
  type PlaylistQuery,
} from './playlist';
export { classifyAttempt, methodLabel, type Method } from './classifier';
export {
  contentDiffSize,
  isChallengeComplete,
  normalizeChallengeContent,
} from './validator';
export {
  summarizeTelemetry,
  type InteractionEvent,
  type TelemetrySnapshot,
  type VimMode,
} from './telemetry';
