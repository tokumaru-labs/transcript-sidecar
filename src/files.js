/**
 * Copy text to the clipboard with a legacy fallback.
 *
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyText(text) {
  if (!text) throw new Error('コピーする字幕がありません');

  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch (clipboardError) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand('copy');
    textarea.remove();

    if (!copied) throw clipboardError;
  }
}

/**
 * Download UTF-8 text using the browser's native download behavior.
 *
 * @param {string} filename
 * @param {string} text
 */
export function downloadTextFile(filename, text) {
  if (!text) throw new Error('保存する字幕がありません');

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Make a cross-platform filename safe for transcript exports.
 *
 * @param {string} value
 * @returns {string}
 */
export function safeFilename(value) {
  const cleaned = String(value || 'youtube-transcript')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.slice(0, 120) || 'youtube-transcript';
}
