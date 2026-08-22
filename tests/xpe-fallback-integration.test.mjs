import assert from 'node:assert/strict';
import test from 'node:test';

import { loadCaptionTrack } from '../src/captions.js';

const VIDEO_ID = 'xpe-video-test';
const WEB_TIMED_TEXT_URL =
  `https://www.youtube.com/api/timedtext?v=${VIDEO_ID}`
  + '&lang=en&kind=asr&exp=xpe&source=web';
const ALTERNATE_TIMED_TEXT_URL =
  `https://www.youtube.com/api/timedtext?v=${VIDEO_ID}`
  + '&lang=en&kind=asr&exp=xpo&source=alternate';

const selectedTrack = {
  baseUrl: WEB_TIMED_TEXT_URL,
  languageCode: 'en',
  label: 'English (auto-generated)',
  kind: 'asr',
  vssId: 'a.en',
  trackIdentity: 'a.en'
};

const otherTrack = {
  baseUrl: `https://www.youtube.com/api/timedtext?v=${VIDEO_ID}&lang=ja`,
  languageCode: 'ja',
  label: 'Japanese',
  kind: '',
  vssId: '.ja',
  trackIdentity: '.ja'
};

const initialAcquisitionEvents = [
  'fetch:extension:web:json3',
  'fetch:extension:web:srv3',
  'fetch:extension:web:vtt',
  'fetch:extension:web:original',
  'execute:page-timed-text:web:json3',
  'fetch:page:web:json3',
  'execute:page-timed-text:web:srv3',
  'fetch:page:web:srv3',
  'execute:page-timed-text:web:vtt',
  'fetch:page:web:vtt',
  'execute:page-timed-text:web:original',
  'fetch:page:web:original',
  'execute:silent-panel-metadata',
  'execute:alternate-player',
  'fetch:page:alternate-player'
];

const successfulAcquisitionEvents = [
  ...initialAcquisitionEvents,
  'execute:page-timed-text:alternate:json3',
  'fetch:page:alternate:json3'
];

function makeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body
  };
}

function captionBody() {
  return JSON.stringify({
    events: [
      {
        tStartMs: 1000,
        dDurationMs: 2000,
        segs: [{ utf8: 'First alternate cue' }]
      },
      {
        tStartMs: 4000,
        dDurationMs: 2500,
        segs: [{ utf8: 'Second alternate cue' }]
      }
    ]
  });
}

async function runLoadScenario(mode) {
  const events = [];
  const playerRequests = [];
  let pageExecutionDepth = 0;
  let currentVideoIdentity = VIDEO_ID;

  const player = {
    getPlayerResponse: () => ({
      videoDetails: { videoId: currentVideoIdentity }
    })
  };

  const locationMock = {
    get href() {
      return `https://www.youtube.com/watch?v=${currentVideoIdentity}`;
    },
    origin: 'https://www.youtube.com',
    hostname: 'www.youtube.com',
    pathname: '/watch'
  };

  const documentMock = {
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: (id) => (id === 'movie_player' ? player : null),
    querySelector: () => null,
    querySelectorAll: () => []
  };

  const pageContext = {
    client: {
      hl: 'en',
      gl: 'US',
      visitorData: 'test-visitor-data'
    }
  };
  const windowMock = {
    ytcfg: {
      get: (key) => ({
        INNERTUBE_CONTEXT: pageContext,
        INNERTUBE_API_KEY: 'test-page-api-key',
        VISITOR_DATA: pageContext.client.visitorData
      })[key]
    }
  };

  const fetchMock = async (urlString, options = {}) => {
    const url = new URL(urlString);

    if (url.pathname === '/youtubei/v1/player') {
      events.push('fetch:page:alternate-player');
      const request = JSON.parse(String(options.body || '{}'));
      const client = request?.context?.client || {};
      playerRequests.push({
        clientName: client.clientName,
        clientVersion: client.clientVersion,
        videoId: request.videoId,
        apiKey: url.searchParams.get('key')
      });

      if (
        client.clientName !== 'ANDROID'
        || client.clientVersion !== '21.26.364'
        || mode === 'profile-failure'
      ) {
        return makeResponse(404, JSON.stringify({ error: { code: 404 } }));
      }

      let alternateTracks;
      if (mode === 'wrong-identity') {
        alternateTracks = [{
          baseUrl: ALTERNATE_TIMED_TEXT_URL,
          languageCode: 'ja',
          kind: '',
          vssId: otherTrack.vssId
        }];
      } else if (mode === 'duplicate-identity') {
        const duplicate = {
          baseUrl: ALTERNATE_TIMED_TEXT_URL,
          languageCode: 'en',
          kind: 'asr',
          vssId: selectedTrack.vssId
        };
        alternateTracks = [duplicate, { ...duplicate }];
      } else {
        alternateTracks = [{
          baseUrl: ALTERNATE_TIMED_TEXT_URL,
          languageCode: 'en',
          kind: 'asr',
          vssId: selectedTrack.vssId
        }];
      }

      const body = JSON.stringify({
        playabilityStatus: { status: 'OK' },
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: alternateTracks
          }
        }
      });

      if (mode === 'context-changed') {
        currentVideoIdentity = 'different-video';
      }

      return makeResponse(200, body);
    }

    if (url.pathname === '/api/timedtext') {
      const source = url.searchParams.get('source') || 'unknown';
      const format = url.searchParams.get('fmt') || 'original';
      const context = pageExecutionDepth ? 'page' : 'extension';
      events.push(`fetch:${context}:${source}:${format}`);

      if (source === 'alternate' && format === 'json3') {
        return makeResponse(200, captionBody());
      }

      return makeResponse(200, '');
    }

    throw new Error(`Unexpected test fetch: ${url.pathname}`);
  };

  const chromeMock = {
    scripting: {
      executeScript: async ({ func, args }) => {
        if (!Array.isArray(args)) {
          events.push('execute:unexpected-dom-fallback');
          return [{ result: { cues: [], diagnostics: [] } }];
        }

        if (args.length === 1) {
          events.push('execute:silent-panel-metadata');
        } else if (typeof args[1] === 'object') {
          events.push('execute:alternate-player');
        } else {
          const url = new URL(args[0]);
          const source = url.searchParams.get('source') || 'unknown';
          events.push(
            `execute:page-timed-text:${source}:${args[1] || 'original'}`
          );
        }

        pageExecutionDepth += 1;
        try {
          return [{ result: await func(...args) }];
        } finally {
          pageExecutionDepth -= 1;
        }
      }
    }
  };

  const replacements = {
    chrome: chromeMock,
    document: documentMock,
    fetch: fetchMock,
    location: locationMock,
    window: windowMock
  };
  const previousDescriptors = new Map();

  for (const [name, value] of Object.entries(replacements)) {
    previousDescriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value
    });
  }

  try {
    const result = await loadCaptionTrack({
      tabId: 17,
      track: selectedTrack,
      availableTracks: [selectedTrack, otherTrack],
      expectedVideoIdentity: VIDEO_ID
    });

    return { events, playerRequests, result };
  } finally {
    for (const [name, descriptor] of previousDescriptors) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        delete globalThis[name];
      }
    }
  }
}

test('xpe fallback executes the real loadCaptionTrack alternate-player path', async (t) => {
  await t.test('loads exact alternate captions with the compatibility profile', async () => {
    const { events, playerRequests, result } = await runLoadScenario('success');

    assert.equal(result.method, 'alternate-player-timed-text');
    assert.equal(result.cues.length, 2);
    assert.deepEqual(result.diagnostics.slice(0, 10), [
      'extension:json3 HTTP 200 0B 0 cues',
      'extension:srv3 HTTP 200 0B 0 cues',
      'extension:vtt HTTP 200 0B 0 cues',
      'extension:original HTTP 200 0B 0 cues',
      'page:json3 HTTP 200 0B 0 cues',
      'page:srv3 HTTP 200 0B 0 cues',
      'page:vtt HTTP 200 0B 0 cues',
      'page:original HTTP 200 0B 0 cues',
      'silent-panel:metadata-unavailable HTTP 0 0B 0 cues',
      'silent-panel:error transcript panel request metadata unavailable'
    ]);
    assert.equal(
      result.diagnostics.some((line) => (
        line.startsWith('alternate-player:ANDROID HTTP 200 ')
        && line.endsWith('1 tracks')
      )),
      true
    );
    assert.equal(
      result.diagnostics.some((line) => (
        line.startsWith('alternate-player:json3 HTTP 200 ')
        && line.endsWith('2 cues')
      )),
      true
    );
    assert.deepEqual(playerRequests, [{
      clientName: 'ANDROID',
      clientVersion: '21.26.364',
      videoId: VIDEO_ID,
      apiKey: 'test-page-api-key'
    }]);
    assert.deepEqual(events, successfulAcquisitionEvents);
    assert.equal(
      events.filter((event) => event === 'fetch:page:alternate-player').length,
      1
    );
    assert.equal(
      events.filter((event) => event === 'fetch:page:alternate:json3').length,
      1
    );
  });

  for (const scenario of [
    ['profile-failure', 'alternate player response unavailable'],
    ['wrong-identity', 'alternate-track-identity-missing'],
    ['duplicate-identity', 'alternate-track-identity-ambiguous'],
    ['context-changed', 'video-context-changed']
  ]) {
    await t.test(`${scenario[0]} fails closed without a wrong-track DOM fallback`, async () => {
      const { events, result } = await runLoadScenario(scenario[0]);

      assert.equal(result.method, 'none');
      assert.deepEqual(result.cues, []);
      assert.deepEqual(events, initialAcquisitionEvents);
      assert.equal(events.includes('execute:unexpected-dom-fallback'), false);
      assert.equal(events.some((event) => event.includes(':alternate:')), false);
      assert.equal(
        result.diagnostics.some((line) => line.includes(scenario[1])),
        true
      );
    });
  }
});
