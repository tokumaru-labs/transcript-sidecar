import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canUseUnverifiedDomFallback,
  findTranscriptPanelRequest,
  getCaptionTrackIdentity,
  parseTimestampText,
  parseTranscriptPanelBody,
  parseTranscriptPanelResponse,
  resolveSilentPanelTrackSelection,
  selectCaptionTrackByIdentity
} from '../src/silent-transcript.js';

const manualTrack = {
  baseUrl: 'https://www.youtube.com/api/timedtext?track=manual',
  languageCode: 'en',
  kind: '',
  vssId: '.opaque-manual-en',
  trackIdentity: '.opaque-manual-en'
};

const asrTrack = {
  baseUrl: 'https://www.youtube.com/api/timedtext?track=asr',
  languageCode: 'en',
  kind: 'asr',
  vssId: 'a.opaque-asr-en',
  trackIdentity: 'a.opaque-asr-en'
};

test('finds modern get_panel metadata without executing page commands', () => {
  const request = findTranscriptPanelRequest([[{
    updateEngagementPanelContentCommand: {
      contentSourcePanelIdentifier: { tag: 'PAmodern_transcript_view' },
      globalConfiguration: { params: 'modern-params' }
    }
  }]]);

  assert.deepEqual(request, {
    panelId: 'PAmodern_transcript_view',
    params: 'modern-params',
    commandType: 'updateEngagementPanelContentCommand'
  });
});

test('finds legacy show-panel metadata without executing page commands', () => {
  const request = findTranscriptPanelRequest([[{
    showEngagementPanelEndpoint: {
      identifier: { tag: 'engagement-panel-transcript' },
      globalConfiguration: { params: 'legacy-params' }
    }
  }]]);

  assert.deepEqual(request, {
    panelId: 'engagement-panel-transcript',
    params: 'legacy-params',
    commandType: 'showEngagementPanelEndpoint'
  });
});

test('fails closed when transcript request metadata is incomplete', () => {
  assert.equal(findTranscriptPanelRequest([]), null);
  assert.equal(findTranscriptPanelRequest([[{
    showEngagementPanelEndpoint: {
      identifier: { tag: 'engagement-panel-transcript' }
    }
  }]]), null);
});

test('same-language manual and ASR tracks retain distinct opaque identities', () => {
  assert.notEqual(
    getCaptionTrackIdentity(manualTrack),
    getCaptionTrackIdentity(asrTrack)
  );
  assert.equal(
    selectCaptionTrackByIdentity(
      [manualTrack, asrTrack],
      manualTrack.trackIdentity
    ),
    manualTrack
  );
  assert.equal(
    selectCaptionTrackByIdentity(
      [manualTrack, asrTrack],
      asrTrack.trackIdentity
    ),
    asrTrack
  );
});

test('silent route fails closed instead of resolving either same-language track', () => {
  for (const selectedTrack of [manualTrack, asrTrack]) {
    assert.deepEqual(
      resolveSilentPanelTrackSelection(
        selectedTrack,
        [manualTrack, asrTrack]
      ),
      {
        ok: false,
        errorCode: 'same-language-track-ambiguous',
        error: 'silent transcript metadata cannot distinguish same-language tracks'
      }
    );
  }
});

test('ordinary one-track language selection keeps its exact identity', () => {
  assert.deepEqual(
    resolveSilentPanelTrackSelection(manualTrack, [manualTrack]),
    {
      ok: true,
      trackIdentity: manualTrack.trackIdentity,
      languageCode: 'en'
    }
  );
});

test('rendered DOM fallback requires one exact selected track', () => {
  assert.equal(canUseUnverifiedDomFallback(manualTrack, [manualTrack]), true);
  assert.equal(
    canUseUnverifiedDomFallback(manualTrack, [manualTrack, asrTrack]),
    false
  );
  assert.equal(canUseUnverifiedDomFallback(manualTrack, [asrTrack]), false);
  assert.equal(canUseUnverifiedDomFallback({}, [{}]), false);
});

test('insufficient or inconsistent identity metadata fails closed', () => {
  const noOpaqueIdentity = {
    baseUrl: manualTrack.baseUrl,
    languageCode: 'en',
    kind: ''
  };
  const inconsistent = {
    ...manualTrack,
    trackIdentity: asrTrack.trackIdentity
  };

  assert.equal(getCaptionTrackIdentity(noOpaqueIdentity), '');
  assert.equal(getCaptionTrackIdentity(inconsistent), '');
  assert.equal(
    resolveSilentPanelTrackSelection(noOpaqueIdentity, [noOpaqueIdentity]).ok,
    false
  );
  assert.equal(
    resolveSilentPanelTrackSelection(inconsistent, [inconsistent]).ok,
    false
  );
});

test('parses current transcriptSegmentViewModel data and infers duration', () => {
  const body = {
    content: {
      contents: [
        {
          transcriptSegmentViewModel: {
            timestamp: '0:03',
            simpleText: 'First cue'
          }
        },
        {
          transcriptSegmentViewModel: {
            timestamp: '0:08',
            simpleText: 'Second cue'
          }
        }
      ]
    }
  };

  assert.deepEqual(parseTranscriptPanelBody(body), [
    { startMs: 3000, durationMs: 5000, text: 'First cue' },
    { startMs: 8000, durationMs: 0, text: 'Second cue' }
  ]);
});

test('parses legacy transcriptSegmentRenderer data', () => {
  const body = JSON.stringify({
    actions: [{
      transcriptSegmentRenderer: {
        startMs: '65000',
        endMs: '69000',
        snippet: {
          runs: [{ text: 'Legacy ' }, { text: 'cue' }]
        }
      }
    }]
  });

  assert.deepEqual(parseTranscriptPanelBody(body), [
    { startMs: 65000, durationMs: 4000, text: 'Legacy cue' }
  ]);
});

test('silent panel parser fails closed for invalid payloads', () => {
  assert.deepEqual(parseTranscriptPanelBody('not-json'), []);
  assert.deepEqual(parseTranscriptPanelBody(null), []);
  assert.deepEqual(parseTranscriptPanelBody({ content: {} }), []);
});

test('silent response parsing rejects lost or mismatched track identity', () => {
  const body = {
    content: {
      transcriptSegmentViewModel: {
        timestamp: '0:03',
        simpleText: 'Identity-bound cue'
      }
    }
  };

  assert.equal(parseTranscriptPanelResponse({
    body,
    expectedTrackIdentity: manualTrack.trackIdentity,
    responseTrackIdentity: asrTrack.trackIdentity
  }).length, 0);
  assert.equal(parseTranscriptPanelResponse({
    body,
    expectedTrackIdentity: manualTrack.trackIdentity,
    responseTrackIdentity: manualTrack.trackIdentity
  }).length, 1);
});

test('parses M:SS and H:MM:SS timestamps', () => {
  assert.equal(parseTimestampText('1:05'), 65000);
  assert.equal(parseTimestampText('1:02:03'), 3723000);
  assert.equal(parseTimestampText('invalid'), 0);
});
