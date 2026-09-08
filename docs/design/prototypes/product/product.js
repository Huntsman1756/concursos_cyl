// SALIDA CyL product prototype — shared behaviors (prototype-only).
// Mobile menu, info popovers (16px glyph / 44px target / Esc + focus return)
// and the centers mobile filter sheet.

function wireMenus() {
  const button = document.getElementById("menu-button");
  const menu = document.getElementById("mobile-menu");
  if (!button || !menu) return;
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    menu.hidden = open;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      button.focus();
    }
  });
}

function wireInfoButtons() {
  document.querySelectorAll("[data-info-button]").forEach((button) => {
    const popover = document.getElementById(
      button.getAttribute("aria-controls"),
    );
    if (!popover) return;
    const close = () => {
      popover.hidden = true;
      button.setAttribute("aria-expanded", "false");
    };
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      popover.hidden = open;
      button.setAttribute("aria-expanded", String(!open));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !popover.hidden) {
        close();
        button.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (
        !popover.hidden &&
        !popover.contains(e.target) &&
        e.target !== button
      ) {
        close();
      }
    });
  });
}

function wireFilterSheet() {
  const button = document.querySelector("[data-sheet-button]");
  const sheet = document.querySelector("[data-sheet]");
  if (!button || !sheet) return;
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    sheet.classList.toggle("is-open", !open);
  });
}

wireMenus();
wireInfoButtons();
wireFilterSheet();
