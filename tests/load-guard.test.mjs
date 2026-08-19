import assert from 'node:assert/strict';
import test from 'node:test';

import { beginLoad, isLoadCurrent } from '../src/load-guard.js';

test('a newer asynchronous load invalidates every older result', () => {
  const state = { loadGeneration: 0, selectedTrackIndex: 0 };
  const older = beginLoad(state);
  const newer = beginLoad(state);

  assert.equal(isLoadCurrent(state, older, 0), false);
  assert.equal(isLoadCurrent(state, newer, 0), true);
});

test('a result cannot apply after the selected track changes', () => {
  const state = { loadGeneration: 0, selectedTrackIndex: 0 };
  const generation = beginLoad(state);

  state.selectedTrackIndex = 1;

  assert.equal(isLoadCurrent(state, generation, 0), false);
  assert.equal(isLoadCurrent(state, generation, 1), true);
});

test('video-level loads remain current without a track-index constraint', () => {
  const state = { loadGeneration: 0, selectedTrackIndex: 0 };
  const generation = beginLoad(state);

  state.selectedTrackIndex = 3;

  assert.equal(isLoadCurrent(state, generation), true);
});
