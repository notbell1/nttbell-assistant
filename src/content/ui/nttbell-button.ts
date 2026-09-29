import { openNttbellView } from "./nttbell-view"; // Sesuaikan path import jika berbeda

const NTTBELL_ITEM_ATTRIBUTE = "data-nttbell";
const NTTBELL_WRAPPER_VALUE = "wrapper";
const NTTBELL_CONTAINER_VALUE = "container";
const NTTBELL_BUTTON_VALUE = "navbar-item";
const NTTBELL_ICON_VALUE = "icon";

export function createNttbellItem(): HTMLDivElement {
  const wrapperDiv = document.createElement("div");
  wrapperDiv.setAttribute(NTTBELL_ITEM_ATTRIBUTE, "wrapper");

  const buttonContainer = document.createElement("div");
  buttonContainer.setAttribute(NTTBELL_ITEM_ATTRIBUTE, NTTBELL_CONTAINER_VALUE);

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Nttbell Privacy");
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("data-navbar-item", "true");
  button.setAttribute(NTTBELL_ITEM_ATTRIBUTE, NTTBELL_BUTTON_VALUE);
  button.setAttribute("tabindex", "-1");
  button.setAttribute("title", "Nttbell Privacy Controls");

  const icon = document.createElement("span");
  icon.setAttribute(NTTBELL_ITEM_ATTRIBUTE, NTTBELL_ICON_VALUE);
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <defs>
        <linearGradient id="nttbellPrivacyGrad" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stop-color="#FF7A00" />
          <stop offset="100%" stop-color="#FF004D" />
        </linearGradient>
      </defs>
      <path d="M12 2L20 5.5V11C20 16.5 16.5 20.5 12 22C7.5 20.5 4 16.5 4 11V5.5L12 2Z" fill="url(#nttbellPrivacyGrad)" fill-opacity="0.12" stroke="url(#nttbellPrivacyGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="10.5" r="2.5" fill="url(#nttbellPrivacyGrad)"/>
      <path d="M10.5 13L10 16.5H14L13.5 13H10.5Z" fill="url(#nttbellPrivacyGrad)" stroke="url(#nttbellPrivacyGrad)" stroke-width="0.5" stroke-linejoin="round"/>
    </svg>
  `;

  button.appendChild(icon);
  buttonContainer.appendChild(button);
  wrapperDiv.appendChild(buttonContainer);

  button.addEventListener("click", handleNttbellClick);

  return wrapperDiv;
}

function handleNttbellClick(): void {
  openNttbellView();
}

export function getNttbellButton(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    'button[data-navbar-item="true"][data-nttbell="navbar-item"]',
  );
}

export function isNttbellButtonConnected(): boolean {
  const button = getNttbellButton();
  return Boolean(button && button.isConnected);
}

export function setNttbellButtonActive(active: boolean): void {
  const button = getNttbellButton();
  if (!button) {
    return;
  }
  button.setAttribute("aria-pressed", String(active));
}
