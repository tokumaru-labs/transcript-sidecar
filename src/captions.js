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
  fetchCaptionBodyFromPage,
  readRenderedTranscript,
  readRenderedTranscriptV2
} from './youtube.js';

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
 * 3. Open YouTube's own transcript panel and read rendered segments.
 * 4. Read the user-opened transcript panel without legacy markup assumptions
 *    (runs only when steps 1-3 produced nothing; read-only, no network).
 *
 * @param {{ tabId: number, baseUrl: string }} input
 * @returns {Promise<{cues: Array, diagnostics: string[]}>}
 */
export async function loadCaptionTrack({ tabId, baseUrl }) {
  const diagnostics = [];

  let cues = await fetchTimedTextFromExtension(baseUrl, diagnostics);

  if (!cues.length) {
    cues = await fetchTimedTextFromPage(tabId, baseUrl, diagnostics);
  }

  if (!cues.length) {
    const domResult = await readRenderedTranscript(tabId);
    diagnostics.push(...(domResult.diagnostics || []));
    cues = normalizeCueList(domResult.cues || []);
    diagnostics.push(`dom:${cues.length} segments`);
  }

  if (!cues.length) {
    const domV2Result = await readRenderedTranscriptV2(tabId);
    diagnostics.push(...(domV2Result.diagnostics || []));
    cues = normalizeCueList(domV2Result.cues || []);
    diagnostics.push(`dom-v2: ${cues.length} segments`);
  }

  return {
    cues: removeRepeatedTranscriptBlock(normalizeCueList(cues)),
    diagnostics
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

async function fetchTimedTextFromPage(tabId, baseUrl, diagnostics) {
  for (const [format, parser] of FORMAT_ATTEMPTS) {
    const result = await fetchCaptionBodyFromPage(tabId, baseUrl, format);
    const cues = result.ok ? parser(result.body || '') : [];

    diagnostics.push(
      `page:${format || 'original'} HTTP ${result.status} ${(result.body || '').length}B ${cues.length} cues`
    );

    if (cues.length) return cues;
  }

  return [];
}
