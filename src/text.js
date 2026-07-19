/**
 * Transcript normalization and export formatting.
 *
 * The formatter intentionally changes whitespace only. It does not summarize,
 * translate, or otherwise rewrite caption content.
 */

/** @typedef {{ startMs: number, durationMs: number, text: string }} CaptionCue */

const STRONG_BREAK_GAP_MS = 1400;
const MIN_TRANSITION_PARAGRAPH_CHARS = 220;
const MAX_PARAGRAPH_CHARS = 2400;
const TARGET_SPLIT_CHARS = 1800;
const DISCOURSE_MARKER_RE = /\b(?:okay\s+so|now\s+let(?:'|’)s|let(?:'|’)s\s+move\s+on|moving\s+on(?:\s+now)?|lastly|the\s+(?:first|second|next|final)\s+thing|option\s+(?:number\s+)?(?:one|two|three|four|five)|scenario\s+[a-z]|let(?:'|’)s\s+talk\s+about)\b/giu;


/**
 * Normalize whitespace inside one caption segment.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeCaptionText(value) {
  return String(value ?? '')
    .replace(/\u200b/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize cue objects and remove duplicate timestamp/text pairs globally.
 * YouTube can internally render the same transcript panel more than once.
 *
 * @param {unknown} cues
 * @returns {CaptionCue[]}
 */
export function normalizeCueList(cues) {
  const normalized = [];
  const seen = new Set();

  for (const cue of Array.isArray(cues) ? cues : []) {
    const text = normalizeCaptionText(cue?.text);
    if (!text) continue;

    const item = {
      startMs: Number(cue?.startMs || 0),
      durationMs: Number(cue?.durationMs || 0),
      text
    };

    const key = `${item.startMs}\u0000${item.text}`;
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(item);
  }

  return normalized;
}

/**
 * Remove an accidental exact A+A transcript repetition.
 *
 * @param {CaptionCue[]} cues
 * @returns {CaptionCue[]}
 */
export function removeRepeatedTranscriptBlock(cues) {
  const items = Array.isArray(cues) ? cues : [];
  const length = items.length;

  if (length < 2 || length % 2 !== 0) return items;

  const half = length / 2;
  for (let index = 0; index < half; index += 1) {
    const first = items[index];
    const second = items[index + half];

    if (
      !first
      || !second
      || first.startMs !== second.startMs
      || first.text !== second.text
    ) {
      return items;
    }
  }

  return items.slice(0, half);
}

/**
 * Convert milliseconds to M:SS or H:MM:SS.
 *
 * @param {number} startMs
 * @returns {string}
 */
export function formatTimestamp(startMs) {
  const totalSeconds = Math.max(0, Math.floor(Number(startMs || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value, index) => (
        index === 0 ? String(value) : String(value).padStart(2, '0')
      ))
      .join(':');
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Build a faithful plain-text transcript with artificial caption line breaks
 * removed. The spoken text is not rewritten or summarized.
 *
 * @param {CaptionCue[]} cues
 * @returns {string}
 */
export function buildPlainTranscript(cues) {
  return joinCaptionTexts(cues);
}

/**
 * Build a paragraph-formatted transcript for easier reading.
 *
 * Paragraph boundaries are inferred locally from timing gaps, discourse markers,
 * punctuation when available, and a conservative maximum paragraph length.
 * Caption wording remains unchanged apart from whitespace normalization.
 *
 * @param {CaptionCue[]} cues
 * @returns {string}
 */
export function buildReadableTranscript(cues) {
  const items = (Array.isArray(cues) ? cues : [])
    .map((cue) => ({
      startMs: Number(cue?.startMs || 0),
      durationMs: Number(cue?.durationMs || 0),
      text: normalizeCaptionText(cue?.text)
    }))
    .filter((cue) => cue.text);

  if (!items.length) return '';

  const pauseGroups = [];
  let currentTexts = [];

  for (let index = 0; index < items.length; index += 1) {
    const cue = items[index];
    const previousCue = items[index - 1];

    if (previousCue && currentTexts.length > 0) {
      const previousEndMs = previousCue.startMs + Math.max(0, previousCue.durationMs || 0);
      const gapMs = Math.max(0, cue.startMs - previousEndMs);
      const currentText = joinTextParts(currentTexts);

      if (gapMs >= STRONG_BREAK_GAP_MS && currentText.length >= 120) {
        pauseGroups.push(currentText);
        currentTexts = [];
      }
    }

    currentTexts.push(cue.text);
  }

  const finalGroup = joinTextParts(currentTexts);
  if (finalGroup) pauseGroups.push(finalGroup);

  const paragraphs = pauseGroups
    .flatMap(splitByDiscourseMarkers)
    .flatMap(splitOversizedParagraph)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.join('\n\n').trim();
}

/**
 * Build one timestamped line per caption cue.
 *
 * @param {CaptionCue[]} cues
 * @returns {string}
 */
export function buildTimestampTranscript(cues) {
  return (Array.isArray(cues) ? cues : [])
    .map((cue) => `[${formatTimestamp(cue.startMs)}] ${cue.text}`)
    .join('\n')
    .trim();
}

/**
 * Build Markdown containing video metadata and a paragraph-formatted transcript.
 *
 * @param {{ title: string, url: string, trackLabel?: string, languageCode?: string, cues: CaptionCue[] }} input
 * @returns {string}
 */
export function buildMarkdownTranscript(input) {
  const captions = input.trackLabel
    ? `Captions: ${input.trackLabel}${input.languageCode ? ` (${input.languageCode})` : ''}`
    : '';

  return [
    `# ${input.title}`,
    '',
    `Source: ${input.url}`,
    ...(captions ? [captions] : []),
    '',
    '## Transcript',
    '',
    buildReadableTranscript(input.cues)
  ].join('\n').trim() + '\n';
}

function joinCaptionTexts(cues) {
  return joinTextParts(
    (Array.isArray(cues) ? cues : [])
      .map((cue) => normalizeCaptionText(cue?.text))
      .filter(Boolean)
  );
}

function joinTextParts(parts) {
  let output = '';

  for (const text of parts) {
    if (!output) {
      output = text;
      continue;
    }

    output += shouldInsertSpace(output, text) ? ` ${text}` : text;
  }

  return cleanupJoinedText(output);
}

function cleanupJoinedText(value) {
  return value
    .replace(/\s+([,.;:!?%)}\]])/g, '$1')
    .replace(/([({\[])\s+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitByDiscourseMarkers(text) {
  if (!text) return [];

  const matches = [...text.matchAll(DISCOURSE_MARKER_RE)];
  if (!matches.length) return [text];

  const parts = [];
  let start = 0;

  for (const match of matches) {
    const index = Number(match.index || 0);
    if (index - start < MIN_TRANSITION_PARAGRAPH_CHARS) continue;

    const before = text.slice(start, index).trim();
    if (before) parts.push(before);
    start = index;
  }

  const tail = text.slice(start).trim();
  if (tail) parts.push(tail);

  return parts.length ? parts : [text];
}

function splitOversizedParagraph(text) {
  const parts = [];
  let remaining = text.trim();

  while (remaining.length > MAX_PARAGRAPH_CHARS) {
    const preferredStart = Math.max(0, TARGET_SPLIT_CHARS - 350);
    const preferredEnd = Math.min(remaining.length, TARGET_SPLIT_CHARS + 350);
    const window = remaining.slice(preferredStart, preferredEnd);

    const punctuationMatches = [...window.matchAll(/[.!?。！？]["'”’」』）】]?\s+/gu)];
    let splitAt = -1;

    if (punctuationMatches.length) {
      const last = punctuationMatches.at(-1);
      splitAt = preferredStart + Number(last.index || 0) + last[0].length;
    }

    if (splitAt < 0) {
      const spaceBefore = remaining.lastIndexOf(' ', TARGET_SPLIT_CHARS);
      const spaceAfter = remaining.indexOf(' ', TARGET_SPLIT_CHARS);
      splitAt = spaceBefore >= preferredStart
        ? spaceBefore
        : (spaceAfter >= 0 && spaceAfter <= preferredEnd ? spaceAfter : TARGET_SPLIT_CHARS);
    }

    const head = remaining.slice(0, splitAt).trim();
    if (!head) break;

    parts.push(head);
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) parts.push(remaining);
  return parts;
}

function shouldInsertSpace(existingText, nextText) {
  const previous = existingText.at(-1) || '';
  const next = nextText.at(0) || '';

  if (!previous || !next) return false;
  if (/\s/.test(previous) || /\s/.test(next)) return false;
  if (/^[,.;:!?%)}\]、。！？：；]/.test(next)) return false;
  if (/[({\[「『（【]$/.test(previous)) return false;

  const previousIsCjk = isCjk(previous);
  const nextIsCjk = isCjk(next);

  return !(previousIsCjk && nextIsCjk);
}

function isCjk(character) {
  return /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/u.test(character);
}
