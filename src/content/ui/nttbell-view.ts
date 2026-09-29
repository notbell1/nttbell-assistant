import {
  getPrivacySettings,
  startPrivacyEngine,
  updatePrivacySettings,
  type PrivacyEngineSettings,
} from "../privacy/engine";
import { savePrivacySettings } from "../../storage";
import { setNttbellButtonActive } from "./nttbell-button";

type PrivacySettingId =
  | "master"
  | "messages"
  | "contactNames"
  | "profilePictures"
  | "media"
  | "files"
  | "chatPreview";

interface PrivacySetting {
  id: Exclude<PrivacySettingId, "master">;
  title: string;
  description: string;
  iconSvg: string;
}

const PRIVACY_SETTINGS: PrivacySetting[] = [
  {
    id: "messages",
    title: "Messages",
    description: "Blur message content inside chats",
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  },
  {
    id: "contactNames",
    title: "Contact Names",
    description: "Hide contact and group names",
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  },
  {
    id: "profilePictures",
    title: "Profile Pictures",
    description: "Blur contact and group profile photos",
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>`,
  },
  {
    id: "media",
    title: "Media",
    description: "Blur images, videos and shared media",
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
  },
  {
    id: "files",
    title: "Files",
    description: "Blur documents and shared files",
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  },
  {
    id: "chatPreview",
    title: "Chat Preview",
    description: "Blur message previews in your chat list",
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
  },
];

let nttbellView: HTMLDivElement | null = null;
let privacySettings: PrivacyEngineSettings = {
  enabled: false,
  messages: false,
  contactNames: false,
  profilePictures: false,
  media: false,
  files: false,
  chatPreview: false,
  blurIntensity: 6,
};

let masterEnabled = false;
let blurIntensity = 6;
const settingStates: Record<PrivacySettingId, boolean> = {
  master: false,
  messages: false,
  contactNames: false,
  profilePictures: false,
  media: false,
  files: false,
  chatPreview: false,
};

function initializePrivacyState(): void {
  const current = getPrivacySettings();
  privacySettings = { ...privacySettings, ...current };
  masterEnabled = privacySettings.enabled;
  blurIntensity = privacySettings.blurIntensity;

  settingStates.master = masterEnabled;
  settingStates.messages = privacySettings.messages;
  settingStates.contactNames = privacySettings.contactNames;
  settingStates.profilePictures = privacySettings.profilePictures;
  settingStates.media = privacySettings.media;
  settingStates.files = privacySettings.files;
  settingStates.chatPreview = privacySettings.chatPreview;
}

function buildPrivacySettings(): PrivacyEngineSettings {
  return {
    enabled: masterEnabled,
    messages: settingStates.messages,
    contactNames: settingStates.contactNames,
    profilePictures: settingStates.profilePictures,
    media: settingStates.media,
    files: settingStates.files,
    chatPreview: settingStates.chatPreview,
    blurIntensity,
  };
}

function applyPrivacySettings(): void {
  privacySettings = buildPrivacySettings();

  // Terapkan variabel CSS Blur secara Global
  document.documentElement.style.setProperty(
    "--nttbell-blur",
    `${privacySettings.blurIntensity}px`,
  );

  updatePrivacySettings(privacySettings);
  void savePrivacySettings(privacySettings);

  // Paksa engine merender ulang
  startPrivacyEngine(privacySettings);
}

export function openNttbellView(): void {
  if (nttbellView && nttbellView.isConnected) return;

  initializePrivacyState();
  startPrivacyEngine(privacySettings);

  const mainArea = findWhatsAppMainArea();
  if (!mainArea) return;

  if (getComputedStyle(mainArea).position === "static") {
    mainArea.style.position = "relative";
  }

  nttbellView = createNttbellView();
  mainArea.appendChild(nttbellView);
  setNttbellButtonActive(true);
  updateSettingsAvailability();
}

export function closeNttbellView(): void {
  if (!nttbellView) return;
  if (nttbellView.isConnected) nttbellView.remove();
  nttbellView = null;
  setNttbellButtonActive(false);
}

function findWhatsAppMainArea(): HTMLElement | null {
  const roleMain = document.querySelector<HTMLElement>('[role="main"]');
  if (roleMain) return roleMain;

  const paneSide = document.querySelector<HTMLElement>("#pane-side");
  if (!paneSide) return null;

  let parent: HTMLElement | null = paneSide.parentElement;
  for (let index = 0; index < 7 && parent; index++) {
    const rect = parent.getBoundingClientRect();
    if (rect.width > 400 && rect.height > 400) return parent;
    parent = parent.parentElement;
  }
  return null;
}

function createNttbellView(): HTMLDivElement {
  const view = document.createElement("div");
  view.setAttribute("data-nttbell", "view");
  view.appendChild(createHeader());

  const content = document.createElement("main");
  content.setAttribute("data-nttbell", "view-content");

  const masterGroup = document.createElement("div");
  masterGroup.setAttribute("data-nttbell", "card-group");
  masterGroup.appendChild(createMasterCard());
  content.appendChild(masterGroup);

  const settingsGroup = document.createElement("div");
  settingsGroup.setAttribute("data-nttbell", "card-group");
  settingsGroup.setAttribute("data-group", "settings");

  const sectionHeader = document.createElement("div");
  sectionHeader.setAttribute("data-nttbell", "section-header");
  sectionHeader.innerHTML = `
    <h2 data-nttbell="section-title">Privacy Controls</h2>
    <p data-nttbell="section-description">Choose what information stays private.</p>
  `;
  settingsGroup.appendChild(sectionHeader);

  const settingsList = document.createElement("div");
  settingsList.setAttribute("data-nttbell", "settings-list");

  for (const setting of PRIVACY_SETTINGS) {
    settingsList.appendChild(createSettingRow(setting));
  }
  settingsGroup.appendChild(settingsList);
  content.appendChild(settingsGroup);

  const intensityGroup = document.createElement("div");
  intensityGroup.setAttribute("data-nttbell", "card-group");
  intensityGroup.setAttribute("data-group", "intensity");
  intensityGroup.appendChild(createIntensitySection());
  content.appendChild(intensityGroup);

  content.appendChild(createFooter());
  view.appendChild(content);

  return view;
}

function createHeader(): HTMLElement {
  const header = document.createElement("header");
  header.setAttribute("data-nttbell", "view-header");

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.setAttribute("aria-label", "Back");
  backButton.setAttribute("data-nttbell", "back-button");
  backButton.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;
  backButton.addEventListener("click", () => closeNttbellView());

  const heading = document.createElement("div");
  heading.setAttribute("data-nttbell", "header-heading");
  heading.innerHTML = `
    <h1 data-nttbell="view-title">Nttbell Assistant</h1>
    <span data-nttbell="view-subtitle">WhatsApp Web Privacy</span>
  `;

  header.appendChild(backButton);
  header.appendChild(heading);
  return header;
}

function createMasterCard(): HTMLElement {
  const card = document.createElement("section");
  card.setAttribute("data-nttbell", "master-card");
  card.setAttribute("data-enabled", String(masterEnabled));

  const left = document.createElement("div");
  left.setAttribute("data-nttbell", "master-info");

  const icon = document.createElement("div");
  icon.setAttribute("data-nttbell", "master-icon");
  icon.innerHTML = masterEnabled
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>`;

  const text = document.createElement("div");
  text.setAttribute("data-nttbell", "master-text");
  text.innerHTML = `
    <strong>Global Protection</strong>
    <span data-nttbell="master-status">${masterEnabled ? "Active & securing chats" : "Protection paused (Ctrl+Shift+U)"}</span>
  `;

  left.appendChild(icon);
  left.appendChild(text);

  const toggle = createSwitch("master", masterEnabled);
  toggle.addEventListener("click", () => {
    masterEnabled = !masterEnabled;
    settingStates.master = masterEnabled;
    applyPrivacySettings();
    updateMasterCard(card);
    updateSettingsAvailability();
  });

  card.appendChild(left);
  card.appendChild(toggle);
  return card;
}

function updateMasterCard(card: HTMLElement): void {
  const status = card.querySelector<HTMLElement>(
    '[data-nttbell="master-status"]',
  );
  const icon = card.querySelector<HTMLElement>('[data-nttbell="master-icon"]');
  const toggle = card.querySelector<HTMLButtonElement>(
    '[data-switch-id="master"]',
  );

  if (status) {
    status.textContent = masterEnabled
      ? "Active & securing chats"
      : "Protection paused (Ctrl+Shift+U)";
  }
  if (icon) {
    icon.innerHTML = masterEnabled
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>`;
  }
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(masterEnabled));
  }
  card.setAttribute("data-enabled", String(masterEnabled));
}

function createSettingRow(setting: PrivacySetting): HTMLDivElement {
  const row = document.createElement("div");
  row.setAttribute("data-nttbell", "setting-row");
  row.setAttribute("data-setting-id", setting.id);

  const icon = document.createElement("div");
  icon.setAttribute("data-nttbell", "setting-icon");
  icon.innerHTML = setting.iconSvg;

  const text = document.createElement("div");
  text.setAttribute("data-nttbell", "setting-text");
  text.innerHTML = `
    <strong>${setting.title}</strong>
    <span>${setting.description}</span>
  `;

  const toggle = createSwitch(setting.id, settingStates[setting.id]);
  toggle.addEventListener("click", () => {
    settingStates[setting.id] = !settingStates[setting.id];

    if (settingStates[setting.id]) {
      masterEnabled = true;
      settingStates.master = true;
    } else {
      const anyCategoryEnabled = PRIVACY_SETTINGS.some(
        (item) => settingStates[item.id],
      );
      if (!anyCategoryEnabled) {
        masterEnabled = false;
        settingStates.master = false;
      }
    }

    toggle.setAttribute("aria-pressed", String(settingStates[setting.id]));
    applyPrivacySettings();

    const masterCard = document.querySelector<HTMLElement>(
      '[data-nttbell="master-card"]',
    );
    if (masterCard) updateMasterCard(masterCard);
    updateSettingsAvailability();
  });

  row.appendChild(icon);
  row.appendChild(text);
  row.appendChild(toggle);
  return row;
}

function createSwitch(
  id: PrivacySettingId,
  enabled: boolean,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("data-nttbell", "switch");
  button.setAttribute("data-switch-id", id);
  button.setAttribute("aria-pressed", String(enabled));

  const track = document.createElement("span");
  track.setAttribute("data-nttbell", "switch-track");
  const thumb = document.createElement("span");
  thumb.setAttribute("data-nttbell", "switch-thumb");

  track.appendChild(thumb);
  button.appendChild(track);
  return button;
}

function createIntensitySection(): HTMLElement {
  const section = document.createElement("div");
  section.setAttribute("data-nttbell", "intensity");

  const header = document.createElement("div");
  header.setAttribute("data-nttbell", "intensity-header");
  header.innerHTML = `
    <div data-nttbell="intensity-text">
      <strong>Blur Intensity</strong>
    </div>
    <span data-nttbell="blur-value">${blurIntensity}px</span>
  `;

  const sliderWrapper = document.createElement("div");
  sliderWrapper.setAttribute("data-nttbell", "slider-wrapper");

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "12";
  slider.step = "1";
  slider.value = String(blurIntensity);
  slider.setAttribute("data-nttbell", "blur-slider");

  const valueDisplay = header.querySelector<HTMLElement>(
    '[data-nttbell="blur-value"]',
  )!;

  slider.addEventListener("input", () => {
    blurIntensity = Number(slider.value);
    valueDisplay.textContent = `${blurIntensity}px`;
    applyPrivacySettings();
  });

  sliderWrapper.appendChild(slider);
  section.appendChild(header);
  section.appendChild(sliderWrapper);

  return section;
}

function createFooter(): HTMLDivElement {
  const footer = document.createElement("div");
  footer.setAttribute("data-nttbell", "footer");
  footer.innerHTML = `
    <span>Coded with <svg width="11" height="11" viewBox="0 0 24 24" fill="#FF004D" stroke="#FF004D" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> - Nttbell Assistant</span>
  `;
  return footer;
}

function updateSettingsAvailability(): void {
  const isMasterActive = masterEnabled;

  const settingsGroup = document.querySelector<HTMLElement>(
    '[data-group="settings"]',
  );
  const intensityGroup = document.querySelector<HTMLElement>(
    '[data-group="intensity"]',
  );

  if (settingsGroup) {
    settingsGroup.setAttribute("data-master-active", String(isMasterActive));
    const toggles = settingsGroup.querySelectorAll<HTMLButtonElement>(
      'button[data-nttbell="switch"]',
    );
    toggles.forEach((btn) => {
      btn.disabled = !isMasterActive;
    });
  }

  if (intensityGroup) {
    intensityGroup.setAttribute("data-master-active", String(isMasterActive));
    const slider = intensityGroup.querySelector<HTMLInputElement>(
      'input[data-nttbell="blur-slider"]',
    );
    if (slider) {
      slider.disabled = !isMasterActive;
    }
  }
}

// ==========================================
// TOAST NOTIFICATION LOGIC
// ==========================================
function showNttbellToast(message: string, isActive: boolean): void {
  const existingToast = document.getElementById("nttbell-toast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.id = "nttbell-toast";
  toast.setAttribute("data-nttbell", "toast");
  toast.setAttribute("data-active", String(isActive));

  const icon = isActive
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>`;

  toast.innerHTML = `
    <div data-nttbell="toast-icon">${icon}</div>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  void toast.offsetWidth;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ==========================================
// GLOBAL SHORTCUT LOGIC
// ==========================================
export function initNttbellGlobalShortcuts(): void {
  initializePrivacyState();

  document.documentElement.style.setProperty(
    "--nttbell-blur",
    `${blurIntensity}px`,
  );

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    // Pengamanan Ekstra: Mendeteksi code "KeyU" ATAU tombol "u" / "U"
    if (
      event.ctrlKey &&
      event.shiftKey &&
      (event.code === "KeyU" || event.key.toLowerCase() === "u")
    ) {
      event.preventDefault();

      masterEnabled = !masterEnabled;
      settingStates.master = masterEnabled;

      applyPrivacySettings();

      showNttbellToast(
        masterEnabled ? "Global Protection: ON" : "Global Protection: OFF",
        masterEnabled,
      );

      const masterCard = document.querySelector<HTMLElement>(
        '[data-nttbell="master-card"]',
      );
      if (masterCard) {
        updateMasterCard(masterCard);
        updateSettingsAvailability();
      }
    }
  });
}
