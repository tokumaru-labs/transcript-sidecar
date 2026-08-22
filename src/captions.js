import {
  parseCaptionBody,
  parseJson3CaptionBody,
  parseVttCaptionBody,
  parseXmlCaptionBody
} from './caption-parsers.js';
import {
  normalizeCueList,
  removeRepeatedTranscriptBlock
} from './text.js';
import {
  fetchAlternatePlayerCaptionFromPage,
  fetchSilentTranscriptPanelFromPage,
  fetchCaptionBodyFromPage,
  readRenderedTranscript,
  readRenderedTranscriptV2
} from './youtube.js';
import {
  canUseUnverifiedDomFallback,
  getCaptionTrackIdentity,
  parseTranscriptPanelResponse
} from './silent-transcript.js';

const FORMAT_ATTEMPTS = [
  ['json3', parseJson3CaptionBody],
  ['srv3', parseXmlCaptionBody],
  ['vtt', parseVttCaptionBody],
  ['', parseCaptionBody]
];

/**
 * Load one YouTube caption track using progressively broader fallbacks.
 *
 * 1. Fetch timed-text from the extension context.
 * 2. Fetch the same resources from the YouTube page context.
 * 3. Fetch YouTube transcript panel data silently from page-exposed metadata.
 * 4. Read an already user-opened legacy transcript panel (read-only).
 * 5. Read an already user-opened modern transcript panel (read-only).
 *
 * @param {{ tabId: number, track: unknown, availableTracks: unknown[], expectedVideoIdentity: string }} input
 * @returns {Promise<{cues: Array, diagnostics: string[], method: string}>}
 */
export async function loadCaptionTrack({
  tabId,
  track,
  availableTracks,
  expectedVideoIdentity
}) {
  const diagnostics = [];
  let method = '';
  let silentUnsafeSelection = false;
  const baseUrl = String(track?.baseUrl || '');
  const expectedTrackIdentity = getCaptionTrackIdentity(track);

  let cues = await fetchTimedTextFromExtension(baseUrl, diagnostics);
  if (cues.length) method = 'extension-timed-text';

  if (!cues.length) {
    cues = await fetchTimedTextFromPage(tabId, baseUrl, diagnostics);
    if (cues.length) method = 'page-timed-text';
  }

  if (!cues.length) {
    const silentResult = await fetchSilentTranscriptPanelFromPage(
      tabId,
      track,
      availableTracks,
      expectedVideoIdentity
    );
    cues = silentResult.ok
      ? parseTranscriptPanelResponse({
          body: silentResult.body || '',
          expectedTrackIdentity,
          responseTrackIdentity: silentResult.trackIdentity || ''
        })
      : [];
    diagnostics.push(
      `silent-panel:${silentResult.commandType || 'metadata-unavailable'} `
      + `HTTP ${silentResult.status} ${(silentResult.body || '').length}B `
      + `${cues.length} cues`
    );
    if (silentResult.error) {
      diagnostics.push(`silent-panel:error ${silentResult.error}`);
    }
    if (cues.length) method = 'silent-panel-data';

    if (silentResult.unsafeSelection) {
      diagnostics.push('track-selection:fail-closed');
      silentUnsafeSelection = true;

      if (silentResult.errorCode === 'video-context-changed') {
        return {
          cues: [],
          diagnostics,
          method: 'none'
        };
      }
    }
  }

  if (!cues.length) {
    const alternateResult = await fetchAlternatePlayerCaptionFromPage(
      tabId,
      track,
      availableTracks,
      expectedVideoIdentity
    );

    if (alternateResult.skipped) {
      diagnostics.push('alternate-player:skipped-not-xpe');
    } else {
      diagnostics.push(
        `alternate-player:ANDROID HTTP ${alternateResult.status} `
        + `${alternateResult.bodyBytes || 0}B `
        + `${alternateResult.trackCount || 0} tracks`
      );
      if (alternateResult.playabilityStatus) {
        diagnostics.push(
          `alternate-player:playability ${alternateResult.playabilityStatus}`
        );
      }
      if (alternateResult.errorCode) {
        diagnostics.push(`alternate-player:error-code ${alternateResult.errorCode}`);
      }
      if (alternateResult.error) {
        diagnostics.push(`alternate-player:error ${alternateResult.error}`);
      }
    }

    if (alternateResult.unsafeSelection) {
      diagnostics.push('track-selection:fail-closed');
      return {
        cues: [],
        diagnostics,
        method: 'none'
      };
    }

    if (alternateResult.ok && alternateResult.baseUrl) {
      cues = await fetchTimedTextFromPage(
        tabId,
        alternateResult.baseUrl,
        diagnostics,
        'alternate-player'
      );
      if (cues.length) method = 'alternate-player-timed-text';
    }
  }

  if (!cues.length && silentUnsafeSelection) {
    return {
      cues: [],
      diagnostics,
      method: 'none'
    };
  }

  const canUseDomFallback = canUseUnverifiedDomFallback(track, availableTracks);

  if (!cues.length && !canUseDomFallback) {
    diagnostics.push('dom-fallback:skipped-unverifiable-track');
  }

  if (!cues.length && canUseDomFallback) {
    const domResult = await readRenderedTranscript(tabId);
    diagnostics.push(...(domResult.diagnostics || []));
    cues = normalizeCueList(domResult.cues || []);
    diagnostics.push(`dom-legacy:${cues.length} segments`);
    if (cues.length) method = 'already-open-dom-legacy';
  }

  if (!cues.length && canUseDomFallback) {
    const domV2Result = await readRenderedTranscriptV2(tabId);
    diagnostics.push(...(domV2Result.diagnostics || []));
    cues = normalizeCueList(domV2Result.cues || []);
    diagnostics.push(`dom-v2: ${cues.length} segments`);
    if (cues.length) method = 'already-open-dom-v2';
  }

  return {
    cues: removeRepeatedTranscriptBlock(normalizeCueList(cues)),
    diagnostics,
    method: method || 'none'
  };
}

async function fetchTimedTextFromExtension(baseUrl, diagnostics) {
  for (const [format, parser] of FORMAT_ATTEMPTS) {
    try {
      const url = new URL(baseUrl);
      if (format) url.searchParams.set('fmt', format);

      const response = await fetch(url.toString(), {
        credentials: 'include',
        cache: 'no-store'
      });
      const body = await response.text();
      const cues = response.ok ? parser(body) : [];

      diagnostics.push(
        `extension:${format || 'original'} HTTP ${response.status} ${body.length}B ${cues.length} cues`
      );

      if (cues.length) return cues;
    } catch (error) {
      diagnostics.push(
        `extension:${format || 'original'} ${String(error?.message || error)}`
      );
    }
  }

  return [];
}

async function fetchTimedTextFromPage(
  tabId,
  baseUrl,
  diagnostics,
  diagnosticPrefix = 'page'
) {
  for (const [format, parser] of FORMAT_ATTEMPTS) {
    const result = await fetchCaptionBodyFromPage(tabId, baseUrl, format);
    const cues = result.ok ? parser(result.body || '') : [];

    diagnostics.push(
      `${diagnosticPrefix}:${format || 'original'} HTTP ${result.status} `
      + `${(result.body || '').length}B ${cues.length} cues`
    );

    if (cues.length) return cues;
  }

  return [];
}
