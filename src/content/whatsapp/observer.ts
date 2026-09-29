import { injectNttbellButton } from "./navigation";

let observer: MutationObserver | null = null;

export function startWhatsAppObserver(): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver(() => {
    injectNttbellButton();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  injectNttbellButton();
}
