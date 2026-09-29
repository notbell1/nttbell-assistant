export const NTTBELL_BLUR_CLASS = "nttbell-privacy-blur";

export const NTTBELL_BLUR_ATTRIBUTE = "data-nttbell-blurred";

const BLUR_MIN = 0;
const BLUR_MAX = 20;

function clampIntensity(intensity: number): number {
  if (!Number.isFinite(intensity)) {
    return 6;
  }

  return Math.max(BLUR_MIN, Math.min(BLUR_MAX, intensity));
}

export function applyBlur(element: HTMLElement, intensity: number): void {
  if (element.closest('[data-nttbell="view"]')) {
    return;
  }

  if (
    element.classList.contains("nttbell-emoji-sensor") ||
    element.classList.contains("nttbell-reaction-sensor")
  ) {
    return;
  }

  const safeIntensity = clampIntensity(intensity);

  element.classList.add(NTTBELL_BLUR_CLASS);

  element.setAttribute(NTTBELL_BLUR_ATTRIBUTE, "true");

  element.style.setProperty("--nttbell-blur", `${safeIntensity}px`);
}

export function removeBlur(element: HTMLElement): void {
  element.classList.remove(NTTBELL_BLUR_CLASS);

  element.removeAttribute(NTTBELL_BLUR_ATTRIBUTE);

  element.style.removeProperty("--nttbell-blur");
}

export function updateBlurIntensity(
  element: HTMLElement,
  intensity: number,
): void {
  if (!element.classList.contains(NTTBELL_BLUR_CLASS)) {
    return;
  }

  if (
    element.classList.contains("nttbell-emoji-sensor") ||
    element.classList.contains("nttbell-reaction-sensor")
  ) {
    return;
  }

  element.style.setProperty("--nttbell-blur", `${clampIntensity(intensity)}px`);
}

export function isBlurred(element: HTMLElement): boolean {
  return element.classList.contains(NTTBELL_BLUR_CLASS);
}
