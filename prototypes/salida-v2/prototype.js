(function () {
  "use strict";

  const routes = new Set(["home", "fp-detail", "offers", "centers", "method"]);
  const screens = Array.from(document.querySelectorAll("[data-screen]"));
  const navLinks = Array.from(document.querySelectorAll("[data-route]"));
  const taskRows = Array.from(document.querySelectorAll("[data-task]"));
  const taskCopy = {
    fp: {
      title: "Elige una titulación",
      copy: "Te mostraremos las ocupaciones que hemos relacionado con ella y la evidencia que las sostiene.",
      placeholder: "Ej. Aceites de Oliva y Vinos",
      step: 1,
    },
    occupation: {
      title: "Escribe una ocupación",
      copy: "Comprueba qué formación, ofertas y centros aparecen alrededor de una ocupación.",
      placeholder: "Ej. Trabajadores de la elaboración del vino",
      step: 2,
    },
    offer: {
      title: "Busca una oferta o un código",
      copy: "Usa el puesto, la localidad o el código CNO para encontrar la fuente oficial.",
      placeholder: "Ej. COCINEROS, EN GENERAL",
      step: 3,
    },
  };

  const titleNode = document.querySelector("[data-form-title]");
  const copyNode = document.querySelector("[data-form-copy]");
  const inputNode = document.querySelector("#start-input");
  const formMessage = document.querySelector("#start-message");
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
    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }
    window.scrollTo(0, 0);
    document.title = route === "home" ? "SALIDA CyL · Prototipo service-first" : `SALIDA CyL · ${route === "fp-detail" ? "Ficha de FP" : route === "offers" ? "Ofertas" : route === "centers" ? "Dónde estudiar" : "Datos y método"}`;
  }

  function setTask(task) {
    const selected = taskCopy[task] || taskCopy.fp;
    taskRows.forEach((row) => {
      const active = row.dataset.task === task;
      row.classList.toggle("is-active", active);
      row.setAttribute("aria-pressed", String(active));
    });
    if (titleNode) titleNode.textContent = selected.title;
    if (copyNode) copyNode.textContent = selected.copy;
    if (inputNode) inputNode.placeholder = selected.placeholder;
    const dot = document.querySelector(".step-dot");
    if (dot) dot.textContent = selected.step;
    if (formMessage) {
      formMessage.textContent = "";
      formMessage.className = "form-message";
    }
    window.sessionStorage.setItem("salida-prototype-task", task);
  }

  window.addEventListener("hashchange", setRoute);

  taskRows.forEach((row) => {
    row.addEventListener("click", () => setTask(row.dataset.task));
  });

  document.querySelector("#start-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = inputNode?.value.trim() || "";
    const selectedTask = taskRows.find((row) => row.classList.contains("is-active"))?.dataset.task || "fp";
    if (!query) {
      formMessage.textContent = "Escribe una titulación, ocupación o palabra clave para continuar.";
      formMessage.className = "form-message is-error";
      inputNode?.focus();
      return;
    }
    formMessage.textContent = "Consulta lista. Abriendo el siguiente paso…";
    formMessage.className = "form-message is-success";
    window.setTimeout(() => {
      window.location.hash = selectedTask === "fp" ? "fp-detail" : "offers";
    }, 180);
  });

  document.querySelector("#offer-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = document.querySelector("#offer-query")?.value.trim();
    const message = document.querySelector("#offer-message");
    if (message) {
      message.textContent = query ? `Filtro aplicado para “${query}”. La demo mantiene 12 resultados de muestra.` : "Escribe una ocupación o palabra clave para buscar.";
      message.className = query ? "form-message is-success" : "form-message is-error";
    }
  });

  document.querySelector("#center-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.querySelector("#center-message");
    if (message) {
      message.textContent = "Filtros aplicados. Mostrando una muestra de centros relacionados.";
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

  const storedTask = window.sessionStorage.getItem("salida-prototype-task") || "fp";
  setTask(storedTask);
  setRoute();
})();
