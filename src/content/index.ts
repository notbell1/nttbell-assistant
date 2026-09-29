import { startWhatsAppObserver } from "./whatsapp/observer";
import { startPrivacyEngine } from "./privacy/engine";
import { initNttbellGlobalShortcuts } from "./ui/nttbell-view"; // Wajib di-import!

function initialize(): void {
  console.log("[Nttbell] Content script loaded.");

  /**
   * WhatsApp navigation.
   */
  startWhatsAppObserver();

  /**
   * Privacy engine.
   */
  startPrivacyEngine();

  /**
   * Mengaktifkan Global Shortcut (Ctrl + Shift + U)
   * dan sistem Toast Notifikasi.
   */
  initNttbellGlobalShortcuts();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, {
    once: true,
  });
} else {
  initialize();
}
