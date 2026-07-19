'use strict';

/**
 * Use Chrome's native toolbar-action -> side-panel behavior.
 *
 * The extension only has host access to YouTube domains declared in
 * manifest.json. It never requests broad access such as <all_urls>.
 */
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => {
    console.error('Failed to configure side panel behavior:', error);
  });
