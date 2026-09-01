(function () {
  "use strict";

  const routes = new Set(["home", "fp-detail", "offers", "centers", "method"]);
  const screens = Array.from(document.querySelectorAll("[data-screen]"));
  const navLinks = Array.from(document.querySelectorAll("[data-route]"));
  const taskOptions = Array.from(document.querySelectorAll("[data-task-option]"));
  const menuButton = document.querySelector(".menu-button");

  function currentRoute() {
    const candidate = window.location.hash.slice(1);
    return routes.has(candidate) ? candidate : "home";
  }

  function updateHeader(route) {
    navLinks.forEach((link) => {
      link.classList.toggle("is-current", link.dataset.route === route || (route === "fp-detail" && link.dataset.route === "home"));
    });
  }

  function setRoute() {
    const route = currentRoute();
    screens.forEach((screen) => {
      screen.hidden = screen.dataset.screen !== route;
    });
    updateHeader(route);
    document.body.classList.remove("menu-open", "filters-open");
    menuButton?.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    const labels = { home: "Prototipo v3 · Ruta clara", "fp-detail": "Ficha de FP", offers: "Ofertas relacionadas", centers: "Dónde estudiar", method: "Datos y método" };
    document.title = `SALIDA CyL · ${labels[route]}`;
  }

  function setTask(task) {
    taskOptions.forEach((option) => {
      const active = option.dataset.taskOption === task;
      const button = option.querySelector("[data-task]");
      const form = option.querySelector(".inline-task-form");
      button?.classList.toggle("is-active", active);
      button?.setAttribute("aria-expanded", String(active));
      if (form) {
        form.hidden = !active;
        const message = form.querySelector(".form-message");
        if (message) {
          message.textContent = "";
          message.className = "form-message";
        }
      }
      option.classList.toggle("is-active", active);
    });
    window.sessionStorage.setItem("salida-v3-task", task);
  }

  function showFormMessage(form, text, state) {
    const message = form.querySelector(".form-message");
    if (!message) return;
    message.textContent = text;
    message.className = `form-message ${state ? `is-${state}` : ""}`.trim();
  }

  window.addEventListener("hashchange", setRoute);

  taskOptions.forEach((option) => {
    option.querySelector("[data-task]")?.addEventListener("click", () => {
      setTask(option.dataset.taskOption || "fp");
    });
    option.querySelector(".inline-task-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const query = form.querySelector("input")?.value.trim() || "";
      const task = form.dataset.formTask || "fp";
      if (!query) {
        showFormMessage(form, "Escribe algo para continuar.", "error");
        form.querySelector("input")?.focus();
        return;
      }
      showFormMessage(form, "Consulta lista. Abriendo el siguiente paso…", "success");
      window.setTimeout(() => {
        window.location.hash = task === "fp" ? "fp-detail" : "offers";
      }, 180);
    });
  });

  document.querySelector("#offer-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.querySelector("#offer-message");
    const query = document.querySelector("#offer-query")?.value.trim() || "";
    if (message) {
      message.textContent = query ? `Consulta aplicada para “${query}”. Mostrando las 4 ofertas relacionadas de esta copia.` : "Escribe una ocupación o palabra clave para buscar.";
      message.className = query ? "form-message is-success" : "form-message is-error";
    }
  });

  document.querySelector("#center-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.querySelector("#center-message");
    if (message) {
      message.textContent = "Filtros aplicados. Mostrando los 3 centros publicados para este ciclo.";
      message.className = "form-message is-success";
    }
  });

  document.querySelectorAll(".filter-heading button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter-panel input[type=checkbox]").forEach((checkbox) => {
        checkbox.checked = false;
      });
    });
  });

  document.querySelector(".filter-toggle")?.addEventListener("click", (event) => {
    const open = document.body.classList.toggle("filters-open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });

  menuButton?.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  const storedTask = window.sessionStorage.getItem("salida-v3-task") || "fp";
  setTask(storedTask);
  setRoute();
})();
