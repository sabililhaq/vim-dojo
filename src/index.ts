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
export {
  classifyAttempt,
  countsAsPracticed,
  methodLabel,
  type Method,
} from './classifier';
export { parFor, practiceKeyCount, tokenizeKeys } from './keys';
export {
  changedSpan,
  contentDiffSize,
  isChallengeComplete,
  normalizeChallengeContent,
  type ContentSpan,
} from './validator';
export {
  summarizeTelemetry,
  type InteractionEvent,
  type TelemetrySnapshot,
  type VimMode,
} from './telemetry';
