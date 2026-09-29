import {
  applyBlur,
  removeBlur,
  updateBlurIntensity as updateElementBlurIntensity,
  NTTBELL_BLUR_CLASS,
} from "./blur";

import { PRIVACY_SELECTORS } from "./selectors";

import { loadPrivacySettings, savePrivacySettings } from "../../storage";

import type { NttbellPrivacySettings } from "../../storage/types";

export type PrivacyEngineSettings = NttbellPrivacySettings;

const MESSAGE_META_SELECTORS = [
  '[data-testid="msg-meta"]',
  '[data-testid*="msg-meta" i]',
];

const STATUS_TITLE_KEYWORDS = [
  "wds-ic-delivered",
  "wds-ic-read",
  "wds-ic-sent",
  "wds-ic-check",
  "wds-ic-double-check",
  "wds-ic-played",
];

const IGNORE_SELECTORS = [
  '[data-nttbell="view"]',
  '[data-nttbell="item"]',
  '[data-nttbell="container"]',
  '[data-nttbell="navbar-item"]',
  '[data-nttbell="icon"]',
];

const CONTACT_NAME_SELECTORS = [
  '[data-testid="conversation-info-header-chat-title"]',
  '[data-testid="author"]',
  '[data-testid="cell-frame-title"] span[dir="auto"][title]',
];

const CHAT_PREVIEW_SELECTORS = ['[data-testid="cell-frame-secondary"]'];

const SIDEBAR_AVATAR_SELECTORS = [
  '[data-testid="cell-frame-container"] img[width="48"][height="48"]',
  '[data-testid="cell-frame-container"] svg[width="48"][height="48"]',
];

const MESSAGE_TEXT_SELECTORS = [
  '[data-testid^="conv-msg-"] [data-testid="selectable-text"]',
  '[data-testid^="conv-msg-"] [data-testid="message-text"]',
  '[data-testid^="conv-msg-"] span.selectable-text',
  '[data-testid="selectable-text"]',
  '[data-testid="message-text"]',
  "span.selectable-text",
];
const PROFILE_PICTURE_SELECTORS = [...PRIVACY_SELECTORS.profilePictures];
const MEDIA_SELECTORS = [...PRIVACY_SELECTORS.media];
const FILE_SELECTORS = [...PRIVACY_SELECTORS.files];

/* =========================================================
 * ENGINE STATE
 * ========================================================= */

let privacySettings: NttbellPrivacySettings | null = null;

let observer: MutationObserver | null = null;

let scanTimer: number | null = null;

let scanFrame: number | null = null;

let isScanning = false;

let engineStarted = false;

/* =========================================================
 * PUBLIC API
 * ========================================================= */
export async function startPrivacyEngine(
  initialSettings?: PrivacyEngineSettings,
): Promise<void> {
  if (engineStarted) {
    if (initialSettings) {
      await updatePrivacySettings(initialSettings);
    }

    return;
  }

  engineStarted = true;

  if (initialSettings) {
    privacySettings = {
      ...initialSettings,
    };
  } else {
    privacySettings = await loadPrivacySettings();
  }

  startObserver();
  startPeriodicScan();

  scheduleScan();
}
export async function updatePrivacySettings(
  settings: PrivacyEngineSettings,
): Promise<void> {
  privacySettings = {
    ...settings,
  };

  await savePrivacySettings(privacySettings);

  scheduleScan();
}
export function getPrivacySettings(): PrivacyEngineSettings | null {
  if (!privacySettings) {
    return null;
  }

  return {
    ...privacySettings,
  };
}
export function stopPrivacyEngine(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (scanTimer !== null) {
    window.clearInterval(scanTimer);

    scanTimer = null;
  }

  if (scanFrame !== null) {
    window.cancelAnimationFrame(scanFrame);

    scanFrame = null;
  }

  cleanupAllBlur();

  privacySettings = null;
  engineStarted = false;
}
export function scanPrivacyTargets(): void {
  scheduleScan();
}
export function updateBlurIntensity(intensity: number): void {
  if (!privacySettings) {
    return;
  }

  privacySettings = {
    ...privacySettings,
    blurIntensity: intensity,
  };

  updateExistingBlurIntensity(intensity);

  scheduleScan();
}

/* =========================================================
 * OBSERVER
 * ========================================================= */

function startObserver(): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver(() => {
    scheduleScan();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });
}

function startPeriodicScan(): void {
  if (scanTimer !== null) {
    return;
  }

  scanTimer = window.setInterval(() => {
    scheduleScan();
  }, 1200);
}

/* =========================================================
 * SCAN SCHEDULER
 * ========================================================= */

function scheduleScan(): void {
  if (scanFrame !== null) {
    return;
  }

  scanFrame = window.requestAnimationFrame(() => {
    scanFrame = null;

    processPrivacy();
  });
}

/* =========================================================
 * MAIN PROCESSOR
 * ========================================================= */

function processPrivacy(): void {
  if (isScanning) {
    return;
  }

  if (!privacySettings) {
    return;
  }

  isScanning = true;

  try {
    if (!privacySettings.enabled) {
      cleanupAllBlur();
      return;
    }

    /*
     * =====================================================
     * MESSAGES
     * =====================================================
     */
    if (privacySettings.messages) {
      processMessages();
    } else {
      cleanupCategory(getMessageElements());
    }

    /*
     * =====================================================
     * CONTACT / GROUP NAMES
     * =====================================================
     */
    if (privacySettings.contactNames) {
      processContactNames();
    } else {
      cleanupCategory(getContactNameElements());
    }

    /*
     * =====================================================
     * PROFILE PICTURES
     * =====================================================
     */
    if (privacySettings.profilePictures) {
      processProfilePictures();
    } else {
      cleanupCategory(getProfilePictureElements());

      cleanupSidebarAvatars();
    }

    /*
     * =====================================================
     * MEDIA
     * =====================================================
     */
    if (privacySettings.media) {
      processMedia();
    } else {
      cleanupCategory(getMediaElements());
    }

    /*
     * =====================================================
     * FILES
     * =====================================================
     */
    if (privacySettings.files) {
      processFiles();
    } else {
      cleanupCategory(getFileElements());
    }

    /*
     * =====================================================
     * CHAT PREVIEW
     * =====================================================
     */
    if (privacySettings.chatPreview) {
      processChatPreviews();
    } else {
      cleanupCategory(getChatPreviewElements());
    }

    cleanupProtectedMetadata();
  } finally {
    isScanning = false;
  }
}

/* =========================================================
 * CONTACT / GROUP NAMES
 * ========================================================= */

function processContactNames(): void {
  const elements = getContactNameElements();

  elements.forEach((element) => {
    if (shouldIgnoreElement(element)) {
      return;
    }

    if (hasContactNameAncestor(element)) {
      return;
    }

    if (!hasVisibleTextOrContent(element)) {
      return;
    }

    applyBlur(element, getBlurIntensity());
  });
}

function getContactNameElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];

  CONTACT_NAME_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      elements.push(element);
    });
  });

  return uniqueElements(elements);
}

function hasContactNameAncestor(element: HTMLElement): boolean {
  let parent = element.parentElement;

  while (parent) {
    if (isContactNameElement(parent)) {
      return true;
    }

    parent = parent.parentElement;
  }

  return false;
}

function isContactNameElement(element: HTMLElement): boolean {
  return (
    element.matches('[data-testid="conversation-info-header-chat-title"]') ||
    element.matches('[data-testid="author"]') ||
    element.matches('[data-testid="cell-frame-title"] span[dir="auto"][title]')
  );
}

/* =========================================================
 * MESSAGES
 * ========================================================= */

function processMessages(): void {
  const elements = getMessageElements();

  elements.forEach((element) => {
    if (shouldIgnoreElement(element)) {
      return;
    }

    if (isInsideMessageMeta(element)) {
      return;
    }

    if (isMessageStatusElement(element)) {
      return;
    }

    if (isLikelyMessageTime(element)) {
      return;
    }

    if (!isActualMessageText(element)) {
      return;
    }

    applyBlur(element, getBlurIntensity());
  });
}
function getMessageElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];

  MESSAGE_TEXT_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      elements.push(element);
    });
  });

  return uniqueElements(elements);
}

function isActualMessageText(element: HTMLElement): boolean {
  if (element.matches('[data-testid="selectable-text"]')) {
    return true;
  }

  if (element.matches('[data-testid="message-text"]')) {
    return true;
  }

  if (element.matches("span.selectable-text")) {
    return true;
  }

  return false;
}

function isLikelyMessageTime(element: HTMLElement): boolean {
  if (isInsideMessageMeta(element)) {
    return true;
  }

  if (element.matches('[data-testid="selectable-text"]')) {
    return false;
  }

  if (element.matches('[data-testid="message-text"]')) {
    return false;
  }

  const text = element.textContent?.trim() ?? "";

  if (/^\d{1,2}[.:]\d{2}$/.test(text)) {
    return true;
  }

  return false;
}

/* =========================================================
 * CHAT PREVIEWS
 * ========================================================= */

function processChatPreviews(): void {
  const containers = getChatPreviewElements();

  containers.forEach((container) => {
    if (shouldIgnoreElement(container)) {
      return;
    }

    processPreviewContainer(container);
  });
}

function processPreviewContainer(container: HTMLElement): void {
  const statusRoots = Array.from(
    container.querySelectorAll<HTMLElement>('[data-testid="last-msg-status"]'),
  );

  if (statusRoots.length === 0) {
    processFallbackPreviewText(container);

    return;
  }

  statusRoots.forEach((statusRoot) => {
    processPreviewStatusRoot(statusRoot);
  });
}

function processPreviewStatusRoot(statusRoot: HTMLElement): void {
  protectStatusInside(statusRoot);

  const candidates: HTMLElement[] = [];

  statusRoot
    .querySelectorAll<HTMLElement>('span[dir="ltr"], span[dir="auto"]')
    .forEach((element) => {
      candidates.push(element);
    });

  statusRoot
    .querySelectorAll<HTMLElement>(":scope > span")
    .forEach((element) => {
      candidates.push(element);
    });

  uniqueElements(candidates).forEach((element) => {
    if (shouldIgnoreElement(element)) {
      return;
    }

    /*
     * Never blur the last-msg-status root itself.
     */
    if (isPreviewStatusElement(element)) {
      return;
    }

    /*
     * Never blur an aria-hidden status wrapper.
     */
    if (element.closest('[aria-hidden="true"]')) {
      return;
    }

    /*
     * Never blur status-bearing elements.
     */
    if (containsWhatsAppStatus(element)) {
      return;
    }

    /*
     * Never blur time.
     */
    if (isLikelyTimeElement(element)) {
      return;
    }

    if (!hasVisibleTextOrContent(element)) {
      return;
    }

    applyBlur(element, getBlurIntensity());
  });

  /*
   * Final status protection.
   */
  protectStatusInside(statusRoot);
}

function processFallbackPreviewText(container: HTMLElement): void {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(
      'span[dir="ltr"], span[dir="auto"]',
    ),
  );

  candidates.forEach((element) => {
    if (shouldIgnoreElement(element)) {
      return;
    }

    if (element.closest('[aria-hidden="true"]')) {
      return;
    }

    if (containsWhatsAppStatus(element)) {
      return;
    }

    if (isLikelyTimeElement(element)) {
      return;
    }

    applyBlur(element, getBlurIntensity());
  });
}

function getChatPreviewElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];

  CHAT_PREVIEW_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      elements.push(element);
    });
  });

  return uniqueElements(elements);
}
function isPreviewStatusElement(element: HTMLElement): boolean {
  return element.matches('[data-testid="last-msg-status"]');
}

/* =========================================================
 * PROFILE PICTURES
 * ========================================================= */

function processProfilePictures(): void {
  processSidebarAvatars();

  const elements = getProfilePictureElements();

  elements.forEach((element) => {
    if (shouldIgnoreElement(element)) {
      return;
    }

    /*
     * Emoji in contact names is not a profile
     * picture.
     */
    if (isInsideContactNameContainer(element)) {
      return;
    }

    /*
     * Don't duplicate a blur already applied
     * to a parent.
     */
    if (hasBlurredAncestor(element)) {
      return;
    }

    applyBlur(element, getBlurIntensity());
  });
}

function processSidebarAvatars(): void {
  const visualElements: HTMLElement[] = [];

  SIDEBAR_AVATAR_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      /*
       * Only process sidebar rows.
       */
      if (!element.closest("#pane-side")) {
        return;
      }

      const wrapper = findSidebarAvatarWrapper(element);

      if (wrapper) {
        visualElements.push(wrapper);
      }
    });
  });

  uniqueElements(visualElements).forEach((element) => {
    if (shouldIgnoreElement(element)) {
      return;
    }

    if (isInsideContactNameContainer(element)) {
      return;
    }

    applyBlur(element, getBlurIntensity());
  });
}

function findSidebarAvatarWrapper(visual: HTMLElement): HTMLElement | null {
  const cell = visual.closest<HTMLElement>(
    '[data-testid="cell-frame-container"]',
  );

  if (!cell) {
    return null;
  }

  let current: HTMLElement | null = visual.parentElement;

  let fallback: HTMLElement | null = null;

  while (current && current !== cell) {
    fallback = current;

    const rect = current.getBoundingClientRect();

    /*
     * Avatar visual wrapper is normally around
     * 48x48 pixels.
     */
    if (
      rect.width >= 40 &&
      rect.width <= 60 &&
      rect.height >= 40 &&
      rect.height <= 60
    ) {
      return current;
    }

    current = current.parentElement;
  }

  return fallback;
}

function getProfilePictureElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];

  PROFILE_PICTURE_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      elements.push(element);
    });
  });

  return uniqueElements(elements);
}

function cleanupSidebarAvatars(): void {
  SIDEBAR_AVATAR_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      const wrapper = findSidebarAvatarWrapper(element);

      if (wrapper) {
        removeBlurDeep(wrapper);
      }
    });
  });
}

/* =========================================================
 * MEDIA
 * ========================================================= */

function processMedia(): void {
  const elements = getMediaElements();

  elements.forEach((element) => {
    if (shouldIgnoreElement(element)) {
      return;
    }

    if (isInsideMessageMeta(element)) {
      return;
    }

    if (isMessageStatusElement(element)) {
      return;
    }

    if (isInsideContactNameContainer(element)) {
      return;
    }

    applyBlur(element, getBlurIntensity());
  });
}

function getMediaElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];

  MEDIA_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      elements.push(element);
    });
  });

  return uniqueElements(elements);
}

/* =========================================================
 * FILES
 * ========================================================= */

function processFiles(): void {
  const elements = getFileElements();

  elements.forEach((element) => {
    if (shouldIgnoreElement(element)) {
      return;
    }

    if (isInsideMessageMeta(element)) {
      return;
    }

    if (isMessageStatusElement(element)) {
      return;
    }

    applyBlur(element, getBlurIntensity());
  });
}

function getFileElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];

  FILE_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      elements.push(element);
    });
  });

  return uniqueElements(elements);
}

/* =========================================================
 * PROTECTED METADATA
 * ========================================================= */
function cleanupProtectedMetadata(): void {
  /*
   * =======================================================
   * MESSAGE META
   * =======================================================
   */
  MESSAGE_META_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      removeBlurDeep(element);
    });
  });

  /*
   * =======================================================
   * MESSAGE / PREVIEW STATUS ICONS
   * =======================================================
   *
   * Detect via SVG <title>.
   *
   * IMPORTANT:
   *
   * We only remove blur from the status icon's
   * own local wrapper.
   *
   * We do NOT walk 10 levels upward anymore.
   *
   * This prevents accidentally unblurring an entire
   * message bubble.
   */
  document.querySelectorAll<SVGElement>("svg title").forEach((svg) => {
    const title = svg.querySelector("title");

    if (!title) {
      return;
    }

    if (!isWhatsAppStatusTitle(title.textContent ?? "")) {
      return;
    }

    protectStatusSvg(svg);
  });

  /*
   * =======================================================
   * EXPLICIT STATUS ATTRIBUTES
   * =======================================================
   */
  const explicitStatusSelectors = [
    '[aria-label*="Dibaca" i]',
    '[aria-label*="Read" i]',
    '[aria-label*="Terkirim" i]',
    '[aria-label*="Delivered" i]',
    '[aria-label*="Sent" i]',
    '[data-icon*="check" i]',
    '[data-icon*="status" i]',
  ];

  explicitStatusSelectors.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      removeBlurDeep(element);
    });
  });

  /*
   * =======================================================
   * SIDEBAR TIME
   * =======================================================
   */
  document
    .querySelectorAll<HTMLElement>('[data-testid="cell-frame-primary-detail"]')
    .forEach((element) => {
      removeBlurDeep(element);
    });
}
function protectStatusSvg(svg: SVGElement): void {
  /*
   * Find nearest known status root.
   */
  const statusRoot = svg.closest<HTMLElement>(
    ['[data-testid="msg-meta"]', '[data-testid="last-msg-status"]'].join(","),
  );

  if (!statusRoot) {
    /*
     * If no known root exists, only remove blur
     * from the SVG itself and its immediate parent.
     */
    if (svg instanceof HTMLElement) {
      removeBlur(svg);
    }

    if (svg.parentElement?.classList.contains(NTTBELL_BLUR_CLASS)) {
      removeBlur(svg.parentElement);
    }

    return;
  }

  let current: HTMLElement | null = svg.parentElement;

  let depth = 0;

  while (current && depth < 4) {
    /*
     * Never remove blur from actual message text.
     */
    if (current.matches('[data-testid="selectable-text"]')) {
      break;
    }

    if (current.matches('[data-testid="message-text"]')) {
      break;
    }

    /*
     * Stop at the status root.
     */
    if (current === statusRoot) {
      /*
       * The status root itself should remain sharp
       * only if it was blurred accidentally.
       *
       * Normally it is NOT a blur target.
       */
      removeBlur(current);

      break;
    }

    /*
     * Remove only blur from status icon wrappers.
     */
    removeBlur(current);

    current = current.parentElement;

    depth += 1;
  }
}

function isInsideMessageMeta(element: Element): boolean {
  return Boolean(element.closest(MESSAGE_META_SELECTORS.join(",")));
}

function isMessageStatusElement(element: Element): boolean {
  /*
   * Status by SVG title.
   */
  if (containsWhatsAppStatus(element)) {
    return true;
  }

  /*
   * Status by aria-label.
   */
  const ariaLabel = element.getAttribute("aria-label") ?? "";

  if (/dibaca|read|terkirim|delivered|sent/i.test(ariaLabel)) {
    return true;
  }

  return false;
}

function containsProtectedMessageMetadata(element: Element): boolean {
  if (element.querySelector(MESSAGE_META_SELECTORS.join(","))) {
    return true;
  }

  if (containsWhatsAppStatus(element)) {
    return true;
  }

  return false;
}

function containsWhatsAppStatus(element: Element): boolean {
  const titles = element.querySelectorAll("svg title");

  for (const title of Array.from(titles)) {
    if (isWhatsAppStatusTitle(title.textContent ?? "")) {
      return true;
    }
  }

  return false;
}

function isWhatsAppStatusTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase();

  return STATUS_TITLE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
function protectStatusInside(container: HTMLElement): void {
  container.querySelectorAll<SVGElement>("svg title").forEach((svg) => {
    const title = svg.querySelector("title");

    if (!title) {
      return;
    }

    if (!isWhatsAppStatusTitle(title.textContent ?? "")) {
      return;
    }

    /*
     * Protect locally instead of walking through
     * the whole chat bubble.
     */
    protectStatusSvg(svg);
  });
}

/* =========================================================
 * CATEGORY CLEANUP
 * ========================================================= */

function cleanupCategory(elements: HTMLElement[]): void {
  elements.forEach((element) => {
    removeBlurDeep(element);
  });
}

function removeBlurDeep(element: HTMLElement): void {
  /*
   * Remove from root.
   */
  removeBlur(element);

  /*
   * Remove from all Nttbell descendants.
   */
  element
    .querySelectorAll<HTMLElement>(`.${NTTBELL_BLUR_CLASS}`)
    .forEach((child) => {
      removeBlur(child);
    });
}

function cleanupAllBlur(): void {
  document
    .querySelectorAll<HTMLElement>(`.${NTTBELL_BLUR_CLASS}`)
    .forEach((element) => {
      removeBlur(element);
    });
}

function updateExistingBlurIntensity(intensity: number): void {
  document
    .querySelectorAll<HTMLElement>(`.${NTTBELL_BLUR_CLASS}`)
    .forEach((element) => {
      if (shouldIgnoreElement(element)) {
        return;
      }

      updateElementBlurIntensity(element, intensity);
    });
}

/* =========================================================
 * GENERAL HELPERS
 * ========================================================= */

function shouldIgnoreElement(element: Element): boolean {
  /*
   * Element itself.
   */
  if (element.matches(IGNORE_SELECTORS.join(","))) {
    return true;
  }

  /*
   * Parent Nttbell UI.
   */
  if (element.closest(IGNORE_SELECTORS.join(","))) {
    return true;
  }

  return false;
}
function hasVisibleTextOrContent(element: HTMLElement): boolean {
  if (element.textContent?.trim()) {
    return true;
  }

  if (element.querySelector("img, svg, picture, video, canvas")) {
    return true;
  }

  return false;
}
function isInsideContactNameContainer(element: Element): boolean {
  return Boolean(
    element.closest(
      [
        '[data-testid="conversation-info-header-chat-title"]',
        '[data-testid="author"]',
        '[data-testid="cell-frame-title"] span[dir="auto"][title]',
      ].join(","),
    ),
  );
}
function hasBlurredAncestor(element: Element): boolean {
  let parent = element.parentElement;

  while (parent) {
    if (parent.classList.contains(NTTBELL_BLUR_CLASS)) {
      return true;
    }

    parent = parent.parentElement;
  }

  return false;
}
function isLikelyTimeElement(element: HTMLElement): boolean {
  /*
   * Exact sidebar timestamp container.
   */
  if (element.matches('[data-testid="cell-frame-primary-detail"]')) {
    return true;
  }

  /*
   * Message metadata.
   */
  if (isInsideMessageMeta(element)) {
    return true;
  }

  /*
   * Generic timestamp text.
   */
  const text = element.textContent?.trim() ?? "";

  if (/^\d{1,2}[.:]\d{2}$/.test(text)) {
    return true;
  }

  return false;
}

function getBlurIntensity(): number {
  return privacySettings?.blurIntensity ?? 6;
}

/* =========================================================
 * UNIQUE ELEMENTS
 * ========================================================= */

function uniqueElements(elements: HTMLElement[]): HTMLElement[] {
  return Array.from(new Set(elements));
}
