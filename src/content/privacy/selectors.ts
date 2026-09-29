export const PRIVACY_SELECTORS = {
  messageText: [
    '[data-testid="selectable-text"]',
    '[data-testid="message-text"]',
    '[data-testid="conversation-panel-body"] span.selectable-text',
    '[data-testid="conversation-panel-body"] span[dir="auto"]',
    '[data-testid="conversation-panel-body"] span[dir="ltr"]',
    "span.selectable-text",
    "span.copyable-text",
  ],

  chatPreviewText: [
    '[data-testid="cell-frame-secondary-title"]',
    '[data-testid="cell-frame-secondary"]',
    '[data-testid="last-msg-status"] + span',
    '[data-testid="status-dblcheck"] + span',
    '[data-testid="status-check"] + span',
    "#pane-side span[title]:not([data-testid])",
  ],

  contactNames: [
    '[data-testid="conversation-info-header-chat-title"]',
    '[data-testid="author"]',
    '[data-testid="conversation-info-header"] [dir="auto"]',
    '[data-testid="conversation-header"] [dir="auto"]',
    '[data-testid="chatlist-header"] [dir="auto"]',
    '[data-testid="contact-info-drawer"] [dir="auto"]',
    '[data-testid="drawer-right"] [dir="auto"]',
  ],

  profilePictures: [
    'img[data-testid="avatar"]',
    'img[data-testid="default-user"]',
    'img[data-testid="default-group"]',
    'img[data-testid="avatar-image"]',
    '[data-testid="conversation-header"] img',
    '[data-testid="conversation-info-header"] img',
    '[data-testid="contact-info-drawer"] img',
    '[data-testid="drawer-right"] img',
  ],

  media: [
    '[data-testid="image-thumb"]',
    '[data-testid="video-thumb"]',
    '[data-testid="media-viewer"] img',
    '[data-testid="media-viewer"] video',
    '[data-testid="image"]',
    '[data-testid="video"]',
    '[data-testid="sticker"]',
    'img[src^="blob:"]',
    "video",
    "canvas",
  ],

  files: [
    '[data-testid="document"]',
    '[data-testid="document-thumb"]',
    '[data-testid="document-container"]',
    '[data-testid="file"]',
    '[data-testid="file-container"]',
    '[data-testid="media-message"]',
  ],

  archived: [
    '[aria-label*="Archived" i]',
    '[aria-label*="Diarsipkan" i]',
    '[title*="Archived" i]',
    '[title*="Diarsipkan" i]',
  ],
} as const;
