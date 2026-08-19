import { normalizeCaptionText, normalizeCueList } from './text.js';

/**
 * Preserve YouTube's own opaque caption-track identity. Runtime inspection
 * confirms that vssId distinguishes manual and ASR tracks even when their
 * languageCode is identical.
 *
 * @param {unknown} track
 * @returns {string}
 */
export function getCaptionTrackIdentity(track) {
  const vssId = String(track?.vssId || '').trim();
  const representedIdentity = String(track?.trackIdentity || '').trim();

  if (!vssId) return '';
  if (representedIdentity && representedIdentity !== vssId) return '';
  return vssId;
}

/**
 * Resolve a Sidecar selection by exact opaque identity. A duplicate or stale
 * identity is unsafe and therefore resolves to null.
 *
 * @param {unknown[]} tracks
 * @param {string} requestedIdentity
 * @returns {unknown|null}
 */
export function selectCaptionTrackByIdentity(tracks, requestedIdentity) {
  const identity = String(requestedIdentity || '').trim();
  if (!identity) return null;

  const matches = (Array.isArray(tracks) ? tracks : [])
    .filter((track) => getCaptionTrackIdentity(track) === identity);

  return matches.length === 1 ? matches[0] : null;
}

/**
 * Determine whether get_panel can safely represent the selected track.
 *
 * The current runtime's get_panel metadata accepts a language preference but
 * carries no selected vssId in either request params or response data. It is
 * therefore safe only when exactly one discovered track has that language.
 *
 * @param {unknown} selectedTrack
 * @param {unknown[]} availableTracks
 * @returns {{ok: true, trackIdentity: string, languageCode: string}|{ok: false, errorCode: string, error: string}}
 */
export function resolveSilentPanelTrackSelection(selectedTrack, availableTracks) {
  const trackIdentity = getCaptionTrackIdentity(selectedTrack);
  if (!trackIdentity) {
    return {
      ok: false,
      errorCode: 'track-identity-unavailable',
      error: 'selected caption track identity unavailable'
    };
  }

  const resolvedTrack = selectCaptionTrackByIdentity(
    availableTracks,
    trackIdentity
  );
  if (!resolvedTrack) {
    return {
      ok: false,
      errorCode: 'track-identity-not-unique',
      error: 'selected caption track identity is stale or not unique'
    };
  }

  const languageCode = String(resolvedTrack?.languageCode || '').trim();
  if (!languageCode) {
    return {
      ok: false,
      errorCode: 'track-language-unavailable',
      error: 'selected caption track language unavailable'
    };
  }

  const sameLanguageTracks = (Array.isArray(availableTracks) ? availableTracks : [])
    .filter((track) => String(track?.languageCode || '').trim() === languageCode);
  if (sameLanguageTracks.length !== 1) {
    return {
      ok: false,
      errorCode: 'same-language-track-ambiguous',
      error: 'silent transcript metadata cannot distinguish same-language tracks'
    };
  }

  return { ok: true, trackIdentity, languageCode };
}

/**
 * Rendered transcript DOM does not expose a stable caption-track identity.
 * It is therefore safe only when the video has exactly one discovered track
 * and that track is the selected opaque identity.
 *
 * @param {unknown} selectedTrack
 * @param {unknown[]} availableTracks
 * @returns {boolean}
 */
export function canUseUnverifiedDomFallback(selectedTrack, availableTracks) {
  const tracks = Array.isArray(availableTracks) ? availableTracks : [];
  if (tracks.length !== 1) return false;

  const selectedIdentity = getCaptionTrackIdentity(selectedTrack);
  return Boolean(
    selectedIdentity
    && getCaptionTrackIdentity(tracks[0]) === selectedIdentity
  );
}

/**
 * Find YouTube's read-only get_panel request metadata in transcript-button
 * command data already attached to the page.
 *
 * YouTube currently exposes two layouts:
 * - updateEngagementPanelContentCommand (modern timeline panel)
 * - showEngagementPanelEndpoint (legacy engagement panel)
 *
 * @param {unknown} commandGroups
 * @returns {{panelId: string, params: string, commandType: string}|null}
 */
export function findTranscriptPanelRequest(commandGroups) {
  for (const commands of Array.isArray(commandGroups) ? commandGroups : []) {
    for (const command of Array.isArray(commands) ? commands : []) {
      const update = command?.updateEngagementPanelContentCommand;
      const updatePanelId = update?.contentSourcePanelIdentifier?.tag;
      const updateParams = update?.globalConfiguration?.params;

      if (updatePanelId && updateParams) {
        return {
          panelId: String(updatePanelId),
          params: String(updateParams),
          commandType: 'updateEngagementPanelContentCommand'
        };
      }

      const show = command?.showEngagementPanelEndpoint;
      const showPanelId = show?.panelIdentifier || show?.identifier?.tag;
      const showParams = show?.globalConfiguration?.params;

      if (showPanelId && showParams) {
        return {
          panelId: String(showPanelId),
          params: String(showParams),
          commandType: 'showEngagementPanelEndpoint'
        };
      }
    }
  }

  return null;
}

/**
 * Parse transcript cues returned by YouTube's get_panel endpoint.
 * Supports both the current transcriptSegmentViewModel representation and the
 * older transcriptSegmentRenderer representation.
 *
 * @param {unknown} body
 * @returns {import('./text.js').CaptionCue[]}
 */
export function parseTranscriptPanelBody(body) {
  let data = body;

  if (typeof body === 'string') {
    try {
      data = JSON.parse(body);
    } catch {
      return [];
    }
  }

  if (!data || typeof data !== 'object') return [];

  const cues = [];
  const visited = new Set();

  const visit = (value, depth = 0) => {
    if (!value || typeof value !== 'object' || visited.has(value) || depth > 40) {
      return;
    }

    visited.add(value);

    if (value.transcriptSegmentViewModel) {
      const cue = parseViewModelCue(value.transcriptSegmentViewModel);
      if (cue) cues.push(cue);
    }

    if (value.transcriptSegmentRenderer) {
      const cue = parseRendererCue(value.transcriptSegmentRenderer);
      if (cue) cues.push(cue);
    }

    for (const child of Object.values(value)) {
      visit(child, depth + 1);
    }
  };

  visit(data);

  const normalized = normalizeCueList(cues);

  return normalized.map((cue, index) => {
    if (cue.durationMs > 0) return cue;

    const nextStartMs = normalized[index + 1]?.startMs;
    return {
      ...cue,
      durationMs: Number.isFinite(nextStartMs) && nextStartMs > cue.startMs
        ? nextStartMs - cue.startMs
        : 0
    };
  });
}

/**
 * Correlate a silent-panel response with the exact Sidecar selection before
 * parsing it. The response is rejected if request identity was lost.
 *
 * @param {{body: unknown, expectedTrackIdentity: string, responseTrackIdentity: string}} input
 * @returns {import('./text.js').CaptionCue[]}
 */
export function parseTranscriptPanelResponse({
  body,
  expectedTrackIdentity,
  responseTrackIdentity
}) {
  const expected = String(expectedTrackIdentity || '').trim();
  const actual = String(responseTrackIdentity || '').trim();

  if (!expected || actual !== expected) return [];
  return parseTranscriptPanelBody(body);
}

function parseViewModelCue(viewModel) {
  const text = normalizeCaptionText(
    viewModel?.simpleText
    || readTextRuns(viewModel?.snippet)
    || readTextRuns(viewModel?.text)
  );

  if (!text) return null;

  return {
    startMs: parseTimestampText(
      viewModel?.timestamp
      || viewModel?.startTimeText?.simpleText
      || ''
    ),
    durationMs: 0,
    text
  };
}

function parseRendererCue(renderer) {
  const text = normalizeCaptionText(
    readTextRuns(renderer?.snippet)
    || readTextRuns(renderer?.text)
  );

  if (!text) return null;

  const startMs = numberOrTimestamp(
    renderer?.startMs ?? renderer?.startTimeMs,
    renderer?.startTimeText?.simpleText
  );
  const endMs = numberOrTimestamp(
    renderer?.endMs ?? renderer?.endTimeMs,
    renderer?.endTimeText?.simpleText
  );

  return {
    startMs,
    durationMs: endMs > startMs ? endMs - startMs : 0,
    text
  };
}

function readTextRuns(value) {
  if (value?.simpleText) return value.simpleText;
  if (!Array.isArray(value?.runs)) return '';
  return value.runs.map((run) => run?.text || '').join('');
}

function numberOrTimestamp(numberValue, timestampValue) {
  const parsed = Number(numberValue);
  return Number.isFinite(parsed) ? parsed : parseTimestampText(timestampValue);
}

/**
 * @param {unknown} value
 * @returns {number}
 */
export function parseTimestampText(value) {
  const parts = String(value || '').trim().split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 3) {
    return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000);
  }

  if (parts.length === 2) {
    return Math.round((parts[0] * 60 + parts[1]) * 1000);
  }

  return 0;
}
