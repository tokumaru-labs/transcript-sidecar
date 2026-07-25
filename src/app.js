import { loadCaptionTrack } from './captions.js';
import { copyText, downloadTextFile, safeFilename } from './files.js';
import { translate } from './i18n.js';
import {
  buildMarkdownTranscript,
  buildPlainTranscript,
  buildReadableTranscript,
  buildTimestampTranscript
} from './text.js';
import {
  clearDiagnostics,
  clearTranscript,
  getUiElements,
  initializeUi,
  renderDiagnostics,
  renderTrackOptions,
  renderTranscript,
  renderVideoMetadata,
  setActionButtonsDisabled,
  setContentVisible,
  setStatus,
  setupLanguageToggle,
  showToast
} from './ui.js';
import { readVideoMetadata, seekVideo } from './youtube.js';

const state = {
  tabId: null,
  videoTitle: '',
  videoUrl: '',
  tracks: [],
  selectedTrackIndex: 0,
  cues: []
};

initializeUi();
const ui = getUiElements();

setupLanguageToggle();
bindEvents();
setActionButtonsDisabled(true);
loadCurrentVideo();

function bindEvents() {
  ui.refreshButton.addEventListener('click', loadCurrentVideo);

  ui.trackSelect.addEventListener('change', async () => {
    state.selectedTrackIndex = Number(ui.trackSelect.value);
    await loadSelectedTrack();
  });

  ui.copyPlainButton.addEventListener('click', async () => {
    await runUserAction(
      () => copyText(buildPlainTranscript(state.cues)),
      'toast.copiedPlain'
    );
  });

  ui.copyReadableButton.addEventListener('click', async () => {
    await runUserAction(
      () => copyText(buildReadableTranscript(state.cues)),
      'toast.copiedReadable'
    );
  });

  ui.copyTimestampButton.addEventListener('click', async () => {
    await runUserAction(
      () => copyText(buildTimestampTranscript(state.cues)),
      'toast.copiedTimestamp'
    );
  });

  ui.copyMarkdownButton.addEventListener('click', async () => {
    await runUserAction(
      () => copyText(buildCurrentMarkdown()),
      'toast.copiedMarkdown'
    );
  });

  ui.downloadTxtButton.addEventListener('click', () => {
    runUserAction(
      () => downloadTextFile(
        `${safeFilename(state.videoTitle)}.txt`,
        buildReadableTranscript(state.cues)
      ),
      'toast.savedTxt'
    );
  });

  ui.downloadMarkdownButton.addEventListener('click', () => {
    runUserAction(
      () => downloadTextFile(
        `${safeFilename(state.videoTitle)}.md`,
        buildCurrentMarkdown()
      ),
      'toast.savedMd'
    );
  });

  ui.copyDiagnosticsButton.addEventListener('click', async () => {
    await runUserAction(
      () => copyText(ui.diagnosticsList.textContent),
      'toast.copiedDiagnostics'
    );
  });
}

async function loadCurrentVideo() {
  try {
    resetTranscriptState();
    clearDiagnostics();
    setContentVisible(false);
    setStatus({ key: 'status.loadingVideo' }, 'normal', true);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw createUiError('error.noTab');

    state.tabId = tab.id;

    const metadata = await readVideoMetadata(tab.id);
    if (!metadata) {
      throw createUiError('error.noMetadata');
    }

    if (!metadata.isYouTubeVideo) {
      throw createUiError('error.notYouTube');
    }

    state.videoTitle = metadata.title || 'YouTube Transcript';
    state.videoUrl = metadata.url || '';
    state.tracks = Array.isArray(metadata.tracks) ? metadata.tracks : [];
    state.selectedTrackIndex = 0;

    if (!state.tracks.length) {
      throw createUiError('error.noTracks');
    }

    renderVideoMetadata(state.videoTitle, state.videoUrl);
    renderTrackOptions(state.tracks, state.selectedTrackIndex);
    setContentVisible(true);

    await loadSelectedTrack();
  } catch (error) {
    console.error(error);
    resetTranscriptState();
    setContentVisible(false);
    setStatus(normalizeErrorMessage(error), 'error', false);
  }
}

async function loadSelectedTrack() {
  const track = state.tracks[state.selectedTrackIndex];

  if (!track?.baseUrl || !state.tabId) {
    setStatus({ key: 'error.trackLoadFailed' }, 'error', false);
    return;
  }

  setActionButtonsDisabled(true);
  clearTranscript();
  clearDiagnostics();
  // track.label comes from YouTube and is passed through untranslated.
  setStatus(
    { key: 'status.loadingTrack', params: { label: track.label } },
    'normal',
    true
  );

  try {
    const result = await loadCaptionTrack({
      tabId: state.tabId,
      baseUrl: track.baseUrl
    });

    if (!result.cues.length) {
      console.warn('Transcript diagnostics:', result.diagnostics);
      renderDiagnostics(result.diagnostics);
      throw createUiError('error.bodyFetchFailed');
    }

    state.cues = result.cues;

    renderTranscript(state.cues, handleSeek);
    setStatus(
      { key: 'status.loaded', params: { count: state.cues.length } },
      'success',
      false
    );
  } catch (error) {
    console.error(error);
    state.cues = [];
    clearTranscript();
    setStatus(normalizeErrorMessage(error), 'error', false);
  } finally {
    setActionButtonsDisabled(state.cues.length === 0);
  }
}

async function handleSeek(startMs) {
  if (!state.tabId) return;

  try {
    await seekVideo(state.tabId, startMs);
  } catch (error) {
    console.error('Seek failed:', error);
    showToast({ key: 'toast.seekFailed' });
  }
}

function buildCurrentMarkdown() {
  const track = state.tracks[state.selectedTrackIndex] || {};

  return buildMarkdownTranscript({
    title: state.videoTitle,
    url: state.videoUrl,
    trackLabel: track.label,
    languageCode: track.languageCode,
    cues: state.cues
  });
}

function resetTranscriptState() {
  state.cues = [];
  clearTranscript();
  setActionButtonsDisabled(true);
}

/**
 * @param {() => unknown} action
 * @param {string} successKey translation key for the success toast
 */
async function runUserAction(action, successKey) {
  try {
    await action();
    showToast({ key: successKey });
  } catch (error) {
    console.error(error);
    showToast(normalizeErrorMessage(error));
  }
}

/**
 * Build an Error that carries its translation key, so the message can be
 * re-rendered if the user switches language while it is on screen.
 *
 * @param {string} key
 * @param {Record<string, unknown>} [params]
 * @returns {Error}
 */
function createUiError(key, params) {
  const error = new Error(translate(key, params));
  error.i18nKey = key;
  error.i18nParams = params;
  return error;
}

/**
 * Messages thrown by files.js, mapped here so that module stays untouched.
 */
const FILE_ERROR_KEYS = new Map([
  ['コピーする字幕がありません', 'error.nothingToCopy'],
  ['保存する字幕がありません', 'error.nothingToSave']
]);

/**
 * Reduce any thrown value to something the UI can display.
 *
 * Returns a {key, params} descriptor when the text is ours to translate, and a
 * plain string when it is a browser-supplied message we must not rewrite.
 *
 * @param {unknown} error
 * @returns {string|{key: string, params?: Record<string, unknown>}}
 */
function normalizeErrorMessage(error) {
  if (error?.i18nKey) {
    return { key: error.i18nKey, params: error.i18nParams };
  }

  const message = error instanceof Error
    ? error.message
    : String(error || '');

  const fileErrorKey = FILE_ERROR_KEYS.get(message);
  if (fileErrorKey) return { key: fileErrorKey };

  // Chrome has reworded this one: older builds said "Cannot access contents of
  // url ...", current builds say "Cannot access contents of the page ...".
  // Matching only up to "of" covers both, so the message stays translated
  // instead of falling through to the raw English text Chrome produced.
  if (/Cannot access contents of|Cannot access a chrome|Missing host permission/i.test(message)) {
    return { key: 'error.noHostPermission' };
  }

  return message || { key: 'error.unknown' };
}
