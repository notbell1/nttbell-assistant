import { startWhatsAppObserver } from "./whatsapp/observer";
import { startPrivacyEngine } from "./privacy/engine";
import { initNttbellGlobalShortcuts } from "./ui/nttbell-view"; // Wajib di-import!

function initialize(): void {
  console.log("[Nttbell] Content script loaded.");
  startWhatsAppObserver();
  startPrivacyEngine();
  initNttbellGlobalShortcuts();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, {
    once: true,
  });
} else {
  initialize();
}
