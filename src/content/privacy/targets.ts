import { PRIVACY_SELECTORS } from "./selectors";

export type PrivacyTargetType =
  | "messages"
  | "contactNames"
  | "profilePictures"
  | "media"
  | "files"
  | "chatPreview";

const TARGET_MAP: Record<PrivacyTargetType, readonly string[]> = {
  messages: PRIVACY_SELECTORS.messageText,

  contactNames: PRIVACY_SELECTORS.contactNames,

  profilePictures: PRIVACY_SELECTORS.profilePictures,

  media: PRIVACY_SELECTORS.media,

  files: PRIVACY_SELECTORS.files,

  chatPreview: PRIVACY_SELECTORS.chatPreviewText,
};

/*
 * ============================================================
 * WHATSAPP METADATA
 * ============================================================
 *
 * Metadata tidak boleh ikut privacy blur.
 *
 * Termasuk:
 *
 * - waktu pesan
 * - waktu preview
 * - centang satu
 * - centang dua
 * - sent
 * - delivered
 * - read
 * - unread counter
 *
 * WhatsApp menggunakan:
 *
 * wds-ic-delivered
 * wds-ic-read
 *
 * untuk status centang.
 */

/*
 * Status selector umum.
 */
const STATUS_SELECTOR_LIST = [
  '[data-testid*="status" i]',
  '[data-testid*="check" i]',

  '[aria-label*="sent" i]',
  '[aria-label*="delivered" i]',
  '[aria-label*="read" i]',
  '[aria-label*="played" i]',

  '[aria-label*="terkirim" i]',
  '[aria-label*="dibaca" i]',

  '[title*="sent" i]',
  '[title*="delivered" i]',
  '[title*="read" i]',
  '[title*="played" i]',

  '[title*="terkirim" i]',
  '[title*="dibaca" i]',
];

/*
 * Identitas status icon WhatsApp berdasarkan
 * <title> di dalam SVG.
 */
const STATUS_TITLE_KEYWORDS = [
  "wds-ic-delivered",
  "wds-ic-read",
  "wds-ic-sent",
  "wds-ic-check",
  "wds-ic-double-check",
  "wds-ic-played",
];

/*
 * Metadata pesan.
 *
 * Contoh DOM:
 *
 * <div data-testid="msg-meta">
 *   <span dir="auto">
 *     <span>00.00</span>
 *   </span>
 * </div>
 */
const MESSAGE_META_SELECTORS = [
  '[data-testid="msg-meta"]',
  '[data-testid*="msg-meta" i]',
];

/*
 * Metadata waktu.
 */
const TIMESTAMP_SELECTOR_LIST = [
  "time",

  '[data-testid*="timestamp" i]',
  '[data-testid*="time" i]',

  '[aria-label*=" AM"]',
  '[aria-label*=" PM"]',

  '[title*=" AM"]',
  '[title*=" PM"]',

  '[aria-label*="pukul" i]',
  '[aria-label*="jam" i]',

  '[title*="pukul" i]',
  '[title*="jam" i]',
];

/*
 * Unread counter.
 */
const UNREAD_SELECTOR_LIST = [
  '[data-testid*="unread" i]',
  '[aria-label*="unread" i]',
  '[aria-label*="belum dibaca" i]',
  '[aria-label*="pesan baru" i]',
];

/*
 * Hint class metadata.
 *
 * Ini hanya fallback.
 */
const METADATA_CLASS_HINTS = [
  "timestamp",
  "msg-meta",
  "message-meta",
  "time",
  "status",
  "check",
  "dblcheck",
  "unread",
];

/*
 * System message.
 */
const SYSTEM_MESSAGE_KEYWORDS = [
  "Anda menambahkan",
  "Anda dikeluarkan",
  "Anda keluar",
  "Anda mengeluarkan",
  "Anda menghapus",
  "Anda mengubah",
  "Anda membuat",
  "Anda bergabung",
  "Anda diundang",

  "menambahkan",
  "dikeluarkan",
  "keluar dari grup",
  "keluar",
  "mengeluarkan",
  "menghapus",
  "mengubah",
  "membuat grup",
  "bergabung",
  "diundang",

  "You added",
  "You were removed",
  "You left",
  "You removed",
  "You deleted",
  "You changed",
  "You created",
  "You joined",
  "You were invited",

  "added",
  "removed",
  "left",
  "deleted",
  "changed",
  "created",
  "joined",
  "invited",
];

/*
 * ============================================================
 * QUERY
 * ============================================================
 */

function queryAll(
  root: ParentNode,
  selectors: readonly string[],
): HTMLElement[] {
  const result: HTMLElement[] = [];

  for (const selector of selectors) {
    let elements: NodeListOf<HTMLElement>;

    try {
      elements = root.querySelectorAll<HTMLElement>(selector);
    } catch {
      continue;
    }

    Array.from(elements).forEach((element) => {
      if (!result.includes(element)) {
        result.push(element);
      }
    });
  }

  return result;
}

function hasVisibleText(element: HTMLElement): boolean {
  const text = element.textContent?.trim() ?? "";

  if (!text) {
    return false;
  }

  const style = window.getComputedStyle(element);

  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  return true;
}

function isInsideNttbell(element: HTMLElement): boolean {
  return Boolean(element.closest("[data-nttbell]"));
}

/*
 * ============================================================
 * STATUS ICON
 * ============================================================
 */

/*
 * Mengecek title di dalam SVG.
 *
 * Contoh:
 *
 * <svg>
 *   <title>wds-ic-read</title>
 * </svg>
 */
function hasWhatsAppStatusTitle(element: HTMLElement): boolean {
  const titles = element.querySelectorAll("title");

  const titleList = Array.from(titles);

  for (const title of titleList) {
    const value = title.textContent?.trim().toLowerCase() ?? "";

    if (!value) {
      continue;
    }

    if (
      STATUS_TITLE_KEYWORDS.some((keyword) =>
        value.includes(keyword.toLowerCase()),
      )
    ) {
      return true;
    }
  }

  return false;
}

/*
 * Mengecek apakah element sendiri adalah
 * bagian dari status icon.
 */
function isStatusElement(element: HTMLElement): boolean {
  if (hasWhatsAppStatusTitle(element)) {
    return true;
  }

  try {
    if (element.matches(STATUS_SELECTOR_LIST.join(","))) {
      return true;
    }
  } catch {}

  return false;
}

/*
 * Mengecek ancestor status.
 *
 * Ini penting karena DOM WhatsApp:
 *
 * div
 * └── span
 *     └── svg
 *         └── title>wds-ic-read
 *
 * Kita tidak hanya mengecek SVG.
 * Wrapper-nya juga harus dianggap metadata.
 */
function hasStatusAncestor(element: HTMLElement): boolean {
  let current: HTMLElement | null = element.parentElement;

  let depth = 0;

  /*
   * Batasi traversal agar tidak naik
   * terlalu jauh sampai chat row.
   */
  while (current && depth < 8) {
    if (isStatusElement(current)) {
      return true;
    }

    current = current.parentElement;

    depth++;
  }

  return false;
}

/*
 * Mengecek apakah element mengandung
 * status icon.
 */
function containsStatusIcon(element: HTMLElement): boolean {
  return hasWhatsAppStatusTitle(element);
}

/*
 * ============================================================
 * MESSAGE META
 * ============================================================
 */

function isMessageMetaElement(element: HTMLElement): boolean {
  try {
    return element.matches(MESSAGE_META_SELECTORS.join(","));
  } catch {
    return false;
  }
}

function isInsideMessageMeta(element: HTMLElement): boolean {
  for (const selector of MESSAGE_META_SELECTORS) {
    try {
      if (element.closest(selector)) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

/*
 * ============================================================
 * TIMESTAMP
 * ============================================================
 */

function hasTimestampAncestor(element: HTMLElement): boolean {
  for (const selector of TIMESTAMP_SELECTOR_LIST) {
    try {
      if (element.closest(selector)) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

function isLikelyTimestamp(element: HTMLElement): boolean {
  /*
   * msg-meta selalu dianggap timestamp metadata.
   */
  if (isMessageMetaElement(element) || isInsideMessageMeta(element)) {
    return true;
  }

  if (hasTimestampAncestor(element)) {
    return true;
  }

  try {
    if (element.matches(TIMESTAMP_SELECTOR_LIST.join(","))) {
      return true;
    }
  } catch {}

  const text = element.textContent?.trim() ?? "";

  /*
   * Mendukung:
   *
   * 00:00
   * 00.00
   * 09:30
   * 23:59
   * 9:30 AM
   * 9:30 PM
   */
  const timePattern = /^(?:[01]?\d|2[0-3])[:.][0-5]\d(?:\s?[AP]M)?$/i;

  return timePattern.test(text);
}

/*
 * ============================================================
 * UNREAD
 * ============================================================
 */

function hasUnreadAncestor(element: HTMLElement): boolean {
  for (const selector of UNREAD_SELECTOR_LIST) {
    try {
      if (element.closest(selector)) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

function isLikelyUnreadCount(element: HTMLElement): boolean {
  if (hasUnreadAncestor(element)) {
    return true;
  }

  try {
    if (element.matches(UNREAD_SELECTOR_LIST.join(","))) {
      return true;
    }
  } catch {}

  const text = element.textContent?.trim() ?? "";

  if (/^\d{1,3}\+?$/.test(text) && element.children.length === 0) {
    const rect = element.getBoundingClientRect();

    if (
      rect.width > 0 &&
      rect.width <= 60 &&
      rect.height > 0 &&
      rect.height <= 40
    ) {
      return true;
    }
  }

  return false;
}

/*
 * ============================================================
 * METADATA
 * ============================================================
 */

function hasMetadataClassHint(element: HTMLElement): boolean {
  const className =
    typeof element.className === "string"
      ? element.className.toLowerCase()
      : "";

  return METADATA_CLASS_HINTS.some((hint) => className.includes(hint));
}

function isLikelyStatusElement(element: HTMLElement): boolean {
  if (isStatusElement(element)) {
    return true;
  }

  if (hasStatusAncestor(element)) {
    return true;
  }

  return false;
}

function isMetadataElement(element: HTMLElement): boolean {
  /*
   * Paling penting:
   *
   * data-testid="msg-meta"
   *
   * dan semua turunannya tidak boleh
   * pernah menjadi target blur.
   */
  if (isMessageMetaElement(element) || isInsideMessageMeta(element)) {
    return true;
  }

  /*
   * Status / checkmark.
   */
  if (isLikelyStatusElement(element)) {
    return true;
  }

  /*
   * Timestamp.
   */
  if (isLikelyTimestamp(element)) {
    return true;
  }

  /*
   * Unread count.
   */
  if (isLikelyUnreadCount(element)) {
    return true;
  }

  return false;
}

/*
 * ============================================================
 * GENERAL
 * ============================================================
 */

function isLargeContainer(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  return rect.width > 700 || rect.height > 300;
}

function isAvatarElement(element: HTMLElement): boolean {
  if (element instanceof HTMLImageElement) {
    const width = element.width || element.naturalWidth;

    const height = element.height || element.naturalHeight;

    if (width > 0 && height > 0 && Math.abs(width - height) <= 8) {
      return true;
    }
  }

  try {
    if (element.matches('img[data-testid*="avatar" i]')) {
      return true;
    }

    if (element.matches('img[data-testid*="user" i]')) {
      return true;
    }

    if (element.matches('img[data-testid*="group" i]')) {
      return true;
    }
  } catch {}

  return false;
}

function isLikelySystemMessage(element: HTMLElement): boolean {
  const text = element.textContent?.trim() ?? "";

  if (!text) {
    return false;
  }

  const normalized = text.toLowerCase();

  return SYSTEM_MESSAGE_KEYWORDS.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );
}

/*
 * ============================================================
 * PREVIEW TEXT
 * ============================================================
 */

function getPreviewTextTarget(candidate: HTMLElement): HTMLElement | null {
  if (isInsideNttbell(candidate)) {
    return null;
  }

  /*
   * Jangan blur metadata.
   */
  if (isMetadataElement(candidate)) {
    return null;
  }

  /*
   * Jika wrapper mengandung status icon,
   * wrapper tidak boleh diblur.
   *
   * Cari hanya child yang bukan metadata.
   */
  if (containsStatusIcon(candidate)) {
    const children = Array.from(candidate.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        hasVisibleText(child) &&
        !isMetadataElement(child) &&
        !containsStatusIcon(child),
    );

    for (const child of children) {
      const target = getDeepestTextElement(child);

      if (target) {
        return target;
      }
    }

    return null;
  }

  if (isLargeContainer(candidate)) {
    return null;
  }

  if (isLikelySystemMessage(candidate)) {
    return null;
  }

  const children = Array.from(candidate.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      hasVisibleText(child) &&
      !isMetadataElement(child) &&
      !containsStatusIcon(child),
  );

  const meaningfulChild = children.find((child) => {
    const childText = child.textContent?.trim() ?? "";

    const parentText = candidate.textContent?.trim() ?? "";

    return childText.length > 0 && childText.length < parentText.length;
  });

  if (meaningfulChild && !isLargeContainer(meaningfulChild)) {
    return getDeepestTextElement(meaningfulChild);
  }

  return getDeepestTextElement(candidate);
}

/*
 * ============================================================
 * DEEPEST TEXT
 * ============================================================
 */

function getDeepestTextElement(element: HTMLElement): HTMLElement | null {
  if (isInsideNttbell(element)) {
    return null;
  }

  /*
   * Jangan masuk msg-meta.
   */
  if (isInsideMessageMeta(element)) {
    return null;
  }

  /*
   * Jangan masuk status icon.
   */
  if (isLikelyStatusElement(element)) {
    return null;
  }

  /*
   * Jangan masuk timestamp.
   */
  if (isLikelyTimestamp(element)) {
    return null;
  }

  /*
   * Jangan masuk unread badge.
   */
  if (isLikelyUnreadCount(element)) {
    return null;
  }

  /*
   * Jika element mengandung status icon,
   * cari hanya child non-metadata.
   */
  const children = Array.from(element.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      hasVisibleText(child) &&
      !isInsideMessageMeta(child) &&
      !isLikelyStatusElement(child) &&
      !isLikelyTimestamp(child) &&
      !isLikelyUnreadCount(child) &&
      !containsStatusIcon(child),
  );

  for (const child of children) {
    const deeper = getDeepestTextElement(child);

    if (deeper) {
      return deeper;
    }
  }

  if (hasVisibleText(element)) {
    return element;
  }

  return null;
}

/*
 * ============================================================
 * FILTER
 * ============================================================
 */

function filterTargets(
  elements: HTMLElement[],
  type: PrivacyTargetType,
): HTMLElement[] {
  const unique = new Set<HTMLElement>();

  for (const element of elements) {
    if (isInsideNttbell(element)) {
      continue;
    }

    /*
     * --------------------------------------------------------
     * CHAT PREVIEW
     * --------------------------------------------------------
     */
    if (type === "chatPreview") {
      const previewTarget = getPreviewTextTarget(element);

      if (previewTarget && !isMetadataElement(previewTarget)) {
        unique.add(previewTarget);
      }

      continue;
    }

    /*
     * --------------------------------------------------------
     * MESSAGES
     * --------------------------------------------------------
     */
    if (type === "messages") {
      /*
       * msg-meta dan semua turunannya
       * selalu dikecualikan.
       */
      if (isInsideMessageMeta(element)) {
        continue;
      }

      /*
       * Checkmark/status selalu dikecualikan.
       */
      if (isLikelyStatusElement(element)) {
        continue;
      }

      /*
       * Timestamp selalu dikecualikan.
       */
      if (isLikelyTimestamp(element)) {
        continue;
      }

      /*
       * Unread counter dikecualikan.
       */
      if (isLikelyUnreadCount(element)) {
        continue;
      }

      /*
       * Wrapper yang mengandung status icon
       * tidak boleh diblur.
       */
      if (containsStatusIcon(element)) {
        continue;
      }

      /*
       * Container besar tidak dijadikan
       * target blur.
       */
      if (isLargeContainer(element)) {
        continue;
      }

      unique.add(element);

      continue;
    }

    /*
     * --------------------------------------------------------
     * PROFILE PICTURES
     * --------------------------------------------------------
     */
    if (type === "profilePictures") {
      if (isAvatarElement(element)) {
        unique.add(element);
      }

      continue;
    }

    /*
     * --------------------------------------------------------
     * MEDIA
     * --------------------------------------------------------
     */
    if (type === "media") {
      if (
        element instanceof HTMLImageElement ||
        element instanceof HTMLVideoElement ||
        element instanceof HTMLCanvasElement
      ) {
        unique.add(element);
      } else if (!isLargeContainer(element)) {
        unique.add(element);
      }

      continue;
    }

    /*
     * --------------------------------------------------------
     * FILES
     * --------------------------------------------------------
     */
    if (type === "files") {
      if (!isLargeContainer(element)) {
        unique.add(element);
      }

      continue;
    }

    /*
     * --------------------------------------------------------
     * CONTACT NAMES
     * --------------------------------------------------------
     */
    if (type === "contactNames") {
      if (!isMetadataElement(element) && hasVisibleText(element)) {
        unique.add(element);
      }

      continue;
    }

    unique.add(element);
  }

  /*
   * Hilangkan parent-child duplicate.
   *
   * Target yang lebih spesifik dipertahankan.
   */
  const result = Array.from(unique);

  return result.filter((element) => {
    return !result.some((other) => {
      if (other === element) {
        return false;
      }

      return other.contains(element) && !element.contains(other);
    });
  });
}

/*
 * ============================================================
 * PUBLIC API
 * ============================================================
 */

export function findPrivacyTargets(
  type: PrivacyTargetType,
  root: ParentNode = document,
): HTMLElement[] {
  const selectors = TARGET_MAP[type];

  const elements = queryAll(root, selectors);

  return filterTargets(elements, type);
}

export function findSidebarTargets(root: ParentNode = document): HTMLElement[] {
  const elements = queryAll(root, PRIVACY_SELECTORS.chatPreviewText);

  return filterTargets(elements, "chatPreview");
}

export function findProfilePictureTargets(
  root: ParentNode = document,
): HTMLElement[] {
  const elements = queryAll(root, PRIVACY_SELECTORS.profilePictures);

  return filterTargets(elements, "profilePictures");
}

export function findMediaTargets(root: ParentNode = document): HTMLElement[] {
  const elements = queryAll(root, PRIVACY_SELECTORS.media);

  return filterTargets(elements, "media");
}

export function findFileTargets(root: ParentNode = document): HTMLElement[] {
  const elements = queryAll(root, PRIVACY_SELECTORS.files);

  return filterTargets(elements, "files");
}

export function findSystemMessageTargets(
  root: ParentNode = document,
): HTMLElement[] {
  const allElements = queryAll(root, [
    '[data-testid*="system" i]',
    '[data-testid*="notification" i]',
    '[role="status"]',
    '[role="alert"]',
    '[data-testid="msg-meta"]',
    '[data-testid="conversation-panel-body"] span',
  ]);

  const result = new Set<HTMLElement>();

  for (const element of allElements) {
    if (isInsideNttbell(element)) {
      continue;
    }

    /*
     * Jangan menjadikan metadata sebagai
     * system message target.
     */
    if (isMetadataElement(element)) {
      continue;
    }

    if (isLikelySystemMessage(element)) {
      result.add(element);
    }
  }

  return Array.from(result);
}
