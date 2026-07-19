import { loadCaptionTrack } from './captions.js';
import { copyText, downloadTextFile, safeFilename } from './files.js';
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
      '全文をコピーしました'
    );
  });

  ui.copyReadableButton.addEventListener('click', async () => {
    await runUserAction(
      () => copyText(buildReadableTranscript(state.cues)),
      '読みやすい段落でコピーしました'
    );
  });

  ui.copyTimestampButton.addEventListener('click', async () => {
    await runUserAction(
      () => copyText(buildTimestampTranscript(state.cues)),
      'タイムスタンプ付きでコピーしました'
    );
  });

  ui.copyMarkdownButton.addEventListener('click', async () => {
    await runUserAction(
      () => copyText(buildCurrentMarkdown()),
      'Markdownをコピーしました'
    );
  });

  ui.downloadTxtButton.addEventListener('click', () => {
    runUserAction(
      () => downloadTextFile(
        `${safeFilename(state.videoTitle)}.txt`,
        buildReadableTranscript(state.cues)
      ),
      'TXTを保存しました'
    );
  });

  ui.downloadMarkdownButton.addEventListener('click', () => {
    runUserAction(
      () => downloadTextFile(
        `${safeFilename(state.videoTitle)}.md`,
        buildCurrentMarkdown()
      ),
      'Markdownを保存しました'
    );
  });

  ui.copyDiagnosticsButton.addEventListener('click', async () => {
    await runUserAction(
      () => copyText(ui.diagnosticsList.textContent),
      '診断情報をコピーしました'
    );
  });
}

async function loadCurrentVideo() {
  try {
    resetTranscriptState();
    clearDiagnostics();
    setContentVisible(false);
    setStatus('YouTube動画と字幕情報を読み込んでいます…', 'normal', true);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('現在のタブを取得できませんでした。');

    state.tabId = tab.id;

    const metadata = await readVideoMetadata(tab.id);
    if (!metadata) {
      throw new Error('動画情報を取得できませんでした。ページを再読み込みして、もう一度試してください。');
    }

    if (!metadata.isYouTubeVideo) {
      throw new Error('YouTubeの動画ページを開いてから、拡張機能アイコンを押してください。');
    }

    state.videoTitle = metadata.title || 'YouTube Transcript';
    state.videoUrl = metadata.url || '';
    state.tracks = Array.isArray(metadata.tracks) ? metadata.tracks : [];
    state.selectedTrackIndex = 0;

    if (!state.tracks.length) {
      throw new Error('この動画には取得できる字幕が見つかりませんでした。現在は字幕付き動画に対応しています。');
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
    setStatus('字幕トラックを読み込めませんでした。', 'error', false);
    return;
  }

  setActionButtonsDisabled(true);
  clearTranscript();
  clearDiagnostics();
  setStatus(`「${track.label}」の字幕を読み込んでいます…`, 'normal', true);

  try {
    const result = await loadCaptionTrack({
      tabId: state.tabId,
      baseUrl: track.baseUrl
    });

    if (!result.cues.length) {
      console.warn('Transcript diagnostics:', result.diagnostics);
      renderDiagnostics(result.diagnostics);
      throw new Error(
        '字幕トラックは見つかりましたが本文を取得できませんでした。右上の↻を一度押して再試行してください。'
      );
    }

    state.cues = result.cues;

    renderTranscript(state.cues, handleSeek);
    setStatus(`字幕を読み込みました：${state.cues.length} セグメント`, 'success', false);
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
    showToast('動画位置を変更できませんでした');
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

async function runUserAction(action, successMessage) {
  try {
    await action();
    showToast(successMessage);
  } catch (error) {
    console.error(error);
    showToast(normalizeErrorMessage(error));
  }
}

function normalizeErrorMessage(error) {
  const message = error instanceof Error
    ? error.message
    : String(error || '不明なエラー');

  if (/Cannot access contents of url|Cannot access a chrome|Missing host permission/i.test(message)) {
    return 'YouTubeページへのアクセス権がありません。拡張機能を再読み込みして、YouTubeページを更新してください。';
  }

  return message;
}
