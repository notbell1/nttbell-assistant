import { WHATSAPP_SELECTORS } from "./selectors";
import { createNttbellItem, getNttbellButton } from "../ui/nttbell-button";

let isInjecting = false;

export function injectNttbellButton(): void {
  if (isInjecting) {
    return;
  }

  isInjecting = true;

  try {
    const existingButton = getNttbellButton();

    if (existingButton && existingButton.isConnected) {
      return;
    }

    const nttbellItem = createNttbellItem();
    const metaAIButton = document.querySelector<HTMLButtonElement>(
      WHATSAPP_SELECTORS.metaAI,
    );

    // SKENARIO 1: Meta AI ditemukan
    if (metaAIButton) {
      // Traverse ke atas 3 tingkat untuk keluar dari container Meta AI
      const metaAIDivInner = metaAIButton.parentElement;
      if (!metaAIDivInner) return;

      const metaAISpan = metaAIDivInner.parentElement;
      if (!metaAISpan) return;

      const metaAIDivOuter = metaAISpan.parentElement;
      if (!metaAIDivOuter) return;

      const navbarContainer = metaAIDivOuter.parentElement;
      if (!navbarContainer) return;

      /**
       * Jangan membuat duplicate.
       */
      if (navbarContainer.querySelector('button[data-nttbell="navbar-item"]')) {
        return;
      }

      /**
       * Nttbell menjadi sibling langsung setelah blok keseluruhan Meta AI.
       */
      navbarContainer.insertBefore(nttbellItem, metaAIDivOuter.nextSibling);
    }
    // SKENARIO 2 (FALLBACK): Meta AI tidak ada
    else {
      const primaryNavbarContainer = document.querySelector<HTMLDivElement>(
        '[data-testid="navbar-primary-section"] > div > div',
      );

      if (primaryNavbarContainer) {
        if (
          primaryNavbarContainer.querySelector(
            'button[data-nttbell="navbar-item"]',
          )
        ) {
          return;
        }
        primaryNavbarContainer.appendChild(nttbellItem);
      }
    }
  } finally {
    isInjecting = false;
  }
}
