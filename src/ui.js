import { formatTimestamp } from './text.js';

const elements = {};
let toastTimer = null;

/**
 * Resolve and cache all required DOM elements once.
 *
 * @returns {typeof elements}
 */
export function initializeUi() {
  const ids = [
    'statusCard',
    'statusSpinner',
    'statusText',
    'content',
    'videoTitle',
    'videoUrl',
    'trackSelect',
    'copyPlainButton',
    'copyReadableButton',
    'copyTimestampButton',
    'copyMarkdownButton',
    'downloadTxtButton',
    'downloadMarkdownButton',
    'refreshButton',
    'transcript',
    'cueCount',
    'toast',
    'diagnostics',
    'diagnosticsList',
    'copyDiagnosticsButton'
  ];

  for (const id of ids) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing required UI element: #${id}`);
    elements[id] = element;
  }

  return elements;
}

export function getUiElements() {
  return elements;
}

/**
 * Show the capture diagnostics block below the status card.
 * Only called when transcript loading has failed.
 *
 * @param {string[]} lines
 */
export function renderDiagnostics(lines) {
  const list = (Array.isArray(lines) ? lines : []).filter(Boolean);

  if (!list.length) {
    clearDiagnostics();
    return;
  }

  elements.diagnosticsList.textContent = list.join('\n');
  elements.diagnostics.hidden = false;
}

/**
 * Hide and empty the diagnostics block (e.g. before loading a new video).
 */
export function clearDiagnostics() {
  elements.diagnostics.hidden = true;
  elements.diagnostics.open = false;
  elements.diagnosticsList.textContent = '';
}

export function setStatus(message, type = 'normal', loading = false) {
  elements.statusText.textContent = message;
  elements.statusSpinner.hidden = !loading;
  elements.statusCard.classList.remove('error', 'success');

  if (type === 'error') elements.statusCard.classList.add('error');
  if (type === 'success') elements.statusCard.classList.add('success');
}

export function setContentVisible(visible) {
  elements.content.hidden = !visible;
}

export function setActionButtonsDisabled(disabled) {
  elements.copyPlainButton.disabled = disabled;
  elements.copyReadableButton.disabled = disabled;
  elements.copyTimestampButton.disabled = disabled;
  elements.copyMarkdownButton.disabled = disabled;
  elements.downloadTxtButton.disabled = disabled;
  elements.downloadMarkdownButton.disabled = disabled;
}

export function renderVideoMetadata(title, url) {
  elements.videoTitle.textContent = title;
  elements.videoUrl.textContent = url;
  elements.videoUrl.href = url;
}

export function renderTrackOptions(tracks, selectedIndex) {
  elements.trackSelect.replaceChildren();

  tracks.forEach((track, index) => {
    const option = document.createElement('option');
    const generatedLabel = track.kind === 'asr' ? '（自動生成）' : '';
    const languageLabel = track.languageCode ? ` · ${track.languageCode}` : '';

    option.value = String(index);
    option.textContent = `${track.label}${generatedLabel}${languageLabel}`;
    elements.trackSelect.appendChild(option);
  });

  elements.trackSelect.value = String(selectedIndex);
}

export function renderTranscript(cues, onSeek) {
  const fragment = document.createDocumentFragment();

  cues.forEach((cue) => {
    const row = document.createElement('div');
    row.className = 'cue';

    const timeButton = document.createElement('button');
    timeButton.type = 'button';
    timeButton.className = 'cue-time';
    timeButton.textContent = formatTimestamp(cue.startMs);
    timeButton.title = 'この位置から再生';
    timeButton.addEventListener('click', () => onSeek(cue.startMs));

    const text = document.createElement('p');
    text.className = 'cue-text';
    text.textContent = cue.text;

    row.append(timeButton, text);
    fragment.appendChild(row);
  });

  elements.transcript.replaceChildren(fragment);
  elements.cueCount.textContent = `${cues.length} segments`;
}

export function clearTranscript() {
  elements.transcript.replaceChildren();
  elements.cueCount.textContent = '';
}

export function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('show');

  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 1800);
}
