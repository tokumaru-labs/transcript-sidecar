/**
 * Start a new logical Sidecar load. Every newer video refresh or track change
 * invalidates all older asynchronous results.
 *
 * @param {{loadGeneration?: number}} state
 * @returns {number}
 */
export function beginLoad(state) {
  const generation = Number(state.loadGeneration || 0) + 1;
  state.loadGeneration = generation;
  return generation;
}

/**
 * Check that an asynchronous result still belongs to the current request and,
 * for track loads, to the track that remains selected.
 *
 * @param {{loadGeneration?: number, selectedTrackIndex?: number}} state
 * @param {number} generation
 * @param {number|null} [selectedTrackIndex]
 * @returns {boolean}
 */
export function isLoadCurrent(state, generation, selectedTrackIndex = null) {
  if (state.loadGeneration !== generation) return false;
  return selectedTrackIndex === null
    || state.selectedTrackIndex === selectedTrackIndex;
}
