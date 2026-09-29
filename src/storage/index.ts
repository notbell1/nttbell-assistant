import type { NttbellPrivacySettings } from "./types";

const STORAGE_KEY = "nttbellPrivacySettings";

export const DEFAULT_PRIVACY_SETTINGS: NttbellPrivacySettings = {
  enabled: false,

  messages: false,
  contactNames: false,
  profilePictures: false,
  media: false,
  files: false,
  chatPreview: false,

  blurIntensity: 6,
};

export async function loadPrivacySettings(): Promise<NttbellPrivacySettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);

  const stored = result[STORAGE_KEY] as
    | Partial<NttbellPrivacySettings>
    | undefined;

  return {
    ...DEFAULT_PRIVACY_SETTINGS,
    ...(stored ?? {}),
  };
}

export async function savePrivacySettings(
  settings: NttbellPrivacySettings,
): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY]: settings,
  });
}

export async function resetPrivacySettings(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY]: DEFAULT_PRIVACY_SETTINGS,
  });
}
