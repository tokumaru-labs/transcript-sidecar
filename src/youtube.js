/**
 * Chrome scripting helpers for interacting with the active YouTube page.
 *
 * Functions passed to chrome.scripting.executeScript() are deliberately
 * self-contained because Chrome serializes them into the page's MAIN world.
 */

/**
 * Read video metadata and available caption tracks from YouTube's player.
 *
 * @param {number} tabId
 * @returns {Promise<{isYouTubeVideo: boolean, title: string, url: string, tracks: Array}>}
 */
export async function readVideoMetadata(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: () => {
      const hostname = location.hostname.replace(/^www\./, '');
      const isYouTubeHost = hostname === 'youtube.com' || hostname === 'm.youtube.com';
      const isVideoPath = location.pathname === '/watch'
        || location.pathname.startsWith('/shorts/')
        || location.pathname.startsWith('/live/');

      if (!isYouTubeHost || !isVideoPath) {
        return {
          isYouTubeVideo: false,
          title: document.title,
          url: location.href,
          tracks: []
        };
      }

      const player = document.getElementById('movie_player');
      const ytdPlayer = document.querySelector('ytd-player');

      let response = null;

      try {
        response = player?.getPlayerResponse?.() || null;
      } catch {
        response = null;
      }

      if (!response) {
        try {
          response = ytdPlayer?.getPlayerResponse?.() || null;
        } catch {
          response = null;
        }
      }

      if (!response && typeof window.ytInitialPlayerResponse !== 'undefined') {
        response = window.ytInitialPlayerResponse;
      }

      const captionTracks = response
        ?.captions
        ?.playerCaptionsTracklistRenderer
        ?.captionTracks || [];

      const getTrackLabel = (track) => {
        const name = track?.name;

        if (name?.simpleText) return name.simpleText;
        if (Array.isArray(name?.runs)) {
          return name.runs.map((run) => run.text || '').join('');
        }

        return track?.languageCode || 'Unknown';
      };

      return {
        isYouTubeVideo: true,
        title: response?.videoDetails?.title
          || document.title.replace(/\s*-\s*YouTube\s*$/, ''),
        url: location.href,
        tracks: captionTracks.map((track) => ({
          baseUrl: track.baseUrl,
          languageCode: track.languageCode || '',
          label: getTrackLabel(track),
          kind: track.kind || '',
          vssId: track.vssId || '',
          isTranslatable: Boolean(track.isTranslatable)
        }))
      };
    }
  });

  return results?.[0]?.result || null;
}

/**
 * Fetch one timed-text payload from the YouTube page context.
 *
 * @param {number} tabId
 * @param {string} baseUrl
 * @param {string} format
 * @returns {Promise<{ok: boolean, status: number, body: string}>}
 */
export async function fetchCaptionBodyFromPage(tabId, baseUrl, format) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    args: [baseUrl, format],
    func: async (urlString, requestedFormat) => {
      try {
        const url = new URL(urlString);
        if (requestedFormat) url.searchParams.set('fmt', requestedFormat);

        const response = await fetch(url.toString(), {
          credentials: 'include',
          cache: 'no-store'
        });

        return {
          ok: response.ok,
          status: response.status,
          body: await response.text()
        };
      } catch (error) {
        return {
          ok: false,
          status: 0,
          body: '',
          error: String(error?.message || error)
        };
      }
    }
  });

  return results?.[0]?.result || { ok: false, status: 0, body: '' };
}

/**
 * Open YouTube's own transcript panel and read rendered segments.
 * This is the final fallback when timed-text requests fail.
 *
 * @param {number} tabId
 * @returns {Promise<{cues: Array, diagnostics: string[]}>}
 */
export async function readRenderedTranscript(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const cleanText = (value) => String(value || '')
        .replace(/\u200b/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const parseTimestamp = (value) => {
        const parts = String(value || '').trim().split(':').map(Number);
        if (parts.some(Number.isNaN)) return 0;
        if (parts.length === 3) {
          return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000);
        }
        if (parts.length === 2) {
          return Math.round((parts[0] * 60 + parts[1]) * 1000);
        }
        return 0;
      };

      const readSegments = () => Array
        .from(document.querySelectorAll('ytd-transcript-segment-renderer'))
        .map((segment) => {
          const timestamp = segment.querySelector('.segment-timestamp')?.textContent
            || segment.querySelector('[class*="timestamp"]')?.textContent
            || '';
          const text = segment.querySelector('.segment-text')?.textContent
            || segment.querySelector('[class*="segment-text"]')?.textContent
            || '';

          return {
            startMs: parseTimestamp(timestamp),
            durationMs: 0,
            text: cleanText(text)
          };
        })
        .filter((cue) => cue.text);

      let cues = readSegments();
      if (cues.length) {
        return {
          cues,
          diagnostics: ['dom:transcript panel already rendered']
        };
      }

      const expandSelectors = [
        'ytd-watch-metadata #description #expand',
        '#description-inline-expander #expand',
        'ytd-text-inline-expander #expand'
      ];

      for (const selector of expandSelectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
          button.click();
          await sleep(350);
          break;
        }
      }

      let transcriptButton = document.querySelector(
        'ytd-video-description-transcript-section-renderer button'
      );

      if (!transcriptButton) {
        transcriptButton = Array
          .from(document.querySelectorAll('button'))
          .find((button) => {
            const label = cleanText(
              `${button.textContent || ''} ${button.getAttribute('aria-label') || ''}`
            ).toLowerCase();

            return label.includes('show transcript')
              || label.includes('transcript')
              || label.includes('文字起こし');
          }) || null;
      }

      transcriptButton?.click();

      for (let attempt = 0; attempt < 30; attempt += 1) {
        await sleep(200);
        cues = readSegments();

        if (cues.length) {
          return {
            cues,
            diagnostics: [`dom:rendered after ${(attempt + 1) * 200}ms`]
          };
        }
      }

      return {
        cues: [],
        diagnostics: [`dom:no segments; transcriptButton=${Boolean(transcriptButton)}`]
      };
    }
  });

  return results?.[0]?.result || { cues: [], diagnostics: [] };
}

/**
 * Fallback #4: read the user-opened transcript panel without relying on the
 * legacy ytd-transcript-* markup.
 *
 * Locates the visible transcript panel (an engagement panel whose target-id
 * contains "transcript", else a visible engagement panel holding several
 * timestamps, else the densest visible timestamp cluster outside the player),
 * then pairs each visible M:SS / H:MM:SS leaf element with the segment text
 * around it. Read-only: no clicks, no network requests, and only open shadow
 * roots are traversed.
 *
 * @param {number} tabId
 * @returns {Promise<{cues: Array, diagnostics: string[]}>}
 */
export async function readRenderedTranscriptV2(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: () => {
      const TS_RE = /^\d{1,2}:\d{2}(?::\d{2})?$/;

      const cleanText = (value) => String(value || '')
        .replace(/\u200b/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const parseTimestamp = (value) => {
        const parts = String(value || '').trim().split(':').map(Number);
        if (parts.some(Number.isNaN)) return 0;
        if (parts.length === 3) {
          return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000);
        }
        if (parts.length === 2) {
          return Math.round((parts[0] * 60 + parts[1]) * 1000);
        }
        return 0;
      };

      const isVisible = (el) => {
        if (!el.getBoundingClientRect) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      const parentOf = (node) => {
        if (node.parentElement) return node.parentElement;
        const root = node.getRootNode ? node.getRootNode() : null;
        return root && root.host ? root.host : null;
      };

      // A childless element counts as rendered only if it actually occupies
      // on-screen space. Screen-reader-only time labels ("0 秒", "1 分 5 秒")
      // are hidden structurally — collapsed to ~1px, display:none, or moved
      // off-screen left — so this identifies them without matching any text.
      // The check is restricted to leaf elements so that zero-size layout
      // wrappers can never hide visible spoken text they contain.
      const isRenderedLeaf = (el) => {
        if (typeof el.getBoundingClientRect !== 'function') return true;
        try {
          const rect = el.getBoundingClientRect();
          if (rect.width <= 1 || rect.height <= 1) return false;
          if (rect.right <= 0) return false;
          const style = typeof getComputedStyle === 'function'
            ? getComputedStyle(el)
            : null;
          if (style && (style.display === 'none' || style.visibility === 'hidden')) {
            return false;
          }
        } catch {
          return true;
        }
        return true;
      };

      // Same text coverage as textContent (light DOM only), but with one
      // subtree structurally excluded from the walk and non-rendered leaf
      // elements (accessibility-only labels) skipped.
      const collectTextWithout = (root, excluded) => {
        if (root === excluded) return '';
        if (root.nodeType === 3) return root.nodeValue || '';
        if (
          root.nodeType === 1
          && (!root.children || root.children.length === 0)
          && !isRenderedLeaf(root)
        ) {
          return '';
        }
        let out = '';
        for (const child of root.childNodes || []) {
          out += collectTextWithout(child, excluded);
        }
        return out;
      };

      const collectTimestampLeaves = (scope) => {
        const leaves = [];
        const walk = (root) => {
          let all;
          try {
            all = root.querySelectorAll('*');
          } catch {
            return;
          }
          for (const el of all) {
            if (el.shadowRoot) walk(el.shadowRoot);
            if (
              el.children.length === 0
              && TS_RE.test((el.textContent || '').trim())
              && isVisible(el)
            ) {
              leaves.push(el);
            }
          }
        };
        walk(scope);
        return leaves;
      };

      const isInsidePlayer = (leaf) => {
        let node = leaf;
        while (node) {
          if (
            node.id === 'movie_player'
            || (node.tagName && node.tagName.toLowerCase() === 'ytd-player')
          ) {
            return true;
          }
          node = parentOf(node);
        }
        return false;
      };

      let container = null;
      let containerReason = 'none';

      const panels = Array.from(
        document.querySelectorAll('ytd-engagement-panel-section-list-renderer')
      );

      for (const panel of panels) {
        const targetId = (panel.getAttribute('target-id') || '').toLowerCase();
        if (isVisible(panel) && targetId.includes('transcript')) {
          container = panel;
          containerReason = 'engagement-panel target-id';
          break;
        }
      }

      if (!container) {
        for (const panel of panels) {
          const targetId = (panel.getAttribute('target-id') || '').toLowerCase();
          if (!isVisible(panel)) continue;
          if (targetId.includes('macro-markers') || targetId.includes('chapters')) continue;
          if (collectTimestampLeaves(panel).length >= 3) {
            container = panel;
            containerReason = 'engagement-panel timestamp count';
            break;
          }
        }
      }

      if (!container) {
        const allLeaves = collectTimestampLeaves(document)
          .filter((leaf) => !isInsidePlayer(leaf));
        const buckets = new Map();

        for (const leaf of allLeaves) {
          let anchor = leaf;
          for (let up = 0; up < 5 && parentOf(anchor); up += 1) {
            anchor = parentOf(anchor);
          }
          const bucket = buckets.get(anchor) || [];
          bucket.push(leaf);
          buckets.set(anchor, bucket);
        }

        let best = null;
        for (const entry of buckets) {
          if (entry[1].length >= 5 && (!best || entry[1].length > best[1].length)) {
            best = entry;
          }
        }
        if (best) {
          container = best[0];
          containerReason = 'timestamp cluster';
        }
      }

      if (!container) {
        return { cues: [], diagnostics: ['dom-v2:no transcript container found'] };
      }

      const leaves = collectTimestampLeaves(container)
        .filter((leaf) => !isInsidePlayer(leaf));

      if (leaves.length < 2) {
        return {
          cues: [],
          diagnostics: [
            `dom-v2:container=${containerReason}`,
            `dom-v2:leaves=${leaves.length} (too few)`
          ]
        };
      }

      const chains = leaves.map((leaf) => {
        const set = new Set();
        let node = parentOf(leaf);
        while (node) {
          set.add(node);
          if (node === container) break;
          node = parentOf(node);
        }
        return set;
      });

      const cues = [];
      const seen = new Set();

      for (let i = 0; i < leaves.length; i += 1) {
        const leaf = leaves[i];
        const prevChain = i > 0 ? chains[i - 1] : null;
        const nextChain = i < leaves.length - 1 ? chains[i + 1] : null;

        let segmentRoot = null;
        let node = parentOf(leaf);
        while (node && node !== container) {
          if ((prevChain && prevChain.has(node)) || (nextChain && nextChain.has(node))) {
            break;
          }
          segmentRoot = node;
          node = parentOf(node);
        }
        if (!segmentRoot) continue;

        const tsText = (leaf.textContent || '').trim();

        // Exclude the timestamp control itself from the body walk instead of
        // deleting matching substrings from the finished text: climb from the
        // timestamp leaf to the highest ancestor below the segment root whose
        // exclusion still leaves spoken text. Localized duration labels
        // (e.g. "1 分 5 秒") living inside the same control are dropped with
        // it; the spoken body is never edited.
        let excluded = leaf;
        let candidate = parentOf(leaf);
        while (candidate && candidate !== segmentRoot) {
          const remainder = cleanText(collectTextWithout(segmentRoot, candidate));
          if (!remainder || TS_RE.test(remainder)) break;
          excluded = candidate;
          candidate = parentOf(candidate);
        }

        const body = cleanText(collectTextWithout(segmentRoot, excluded));

        if (!body || TS_RE.test(body)) continue;

        const startMs = parseTimestamp(tsText);
        const key = `${startMs} ${body}`;
        if (seen.has(key)) continue;
        seen.add(key);

        cues.push({ startMs, durationMs: 0, text: body });
      }

      return {
        cues,
        diagnostics: [
          `dom-v2:container=${containerReason}`,
          `dom-v2:leaves=${leaves.length}`
        ]
      };
    }
  });

  return results?.[0]?.result || { cues: [], diagnostics: [] };
}

/**
 * Seek the current YouTube video.
 *
 * @param {number} tabId
 * @param {number} startMs
 * @returns {Promise<void>}
 */
export async function seekVideo(tabId, startMs) {
  await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    args: [startMs / 1000],
    func: (seconds) => {
      const player = document.getElementById('movie_player');

      if (typeof player?.seekTo === 'function') {
        player.seekTo(seconds, true);
        player.playVideo?.();
        return true;
      }

      const video = document.querySelector('video');
      if (video) {
        video.currentTime = seconds;
        video.play().catch(() => {});
        return true;
      }

      return false;
    }
  });
}
