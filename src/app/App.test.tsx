import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { App } from "./App";
import { AppShell } from "./AppShell";

const desktopNavigationLabels = [
  "Explorar",
  "Ofertas",
  "Dónde estudiar",
  "Datos y método",
];

const primaryNavigationLabels = [
  ...desktopNavigationLabels,
  "Explorar FP",
  "Buscar profesión",
  "Comparar ingresos",
  "Formación complementaria",
  "Datos abiertos",
  "Método y límites",
  "Para organizaciones",
  "Accesibilidad",
];

function getMobileNavigation() {
  const navigation = document.getElementById("mobile-primary-navigation");
  if (!(navigation instanceof HTMLElement)) {
    throw new Error("Expected the mobile primary navigation to be rendered.");
  }
  return navigation;
}

function NavigationProbe() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div>
      <output data-testid="location-pathname">{location.pathname}</output>
      <output data-testid="location-search">{location.search}</output>
      <output data-testid="location-hash">{location.hash}</output>
      <button type="button" onClick={() => navigate("/metodologia")}>
        Cambiar pathname
      </button>
      <button type="button" onClick={() => navigate("/?tab=coverage")}>
        Cambiar query
      </button>
      <button type="button" onClick={() => navigate("/#freshness")}>
        Cambiar hash
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        Atrás
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Adelante
      </button>
    </div>
  );
}

describe("App", () => {
  it("presents the three starting-point journeys", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Explora formación, profesiones y oportunidades en Castilla y León.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /Tengo una FP y quiero saber mis salidas/u,
      }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /Quiero dedicarme a una profesión/u }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: /He visto una oferta/u }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("uses the compact product shell and identifies the project independently", () => {
    cleanup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <p>Contenido</p>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "SALIDA CyL" })).toBeVisible();
    expect(screen.getByText("FP y empleo con datos públicos")).toBeVisible();
    const principalNavigation = screen.getByRole("navigation", {
      name: "Principal",
    });
    expect(
      [...principalNavigation.querySelectorAll(":scope > ul > li > a")].map(
        (link) => link.textContent,
      ),
    ).toEqual(desktopNavigationLabels);
    expect(
      within(principalNavigation).getByRole("link", { name: "Explorar" }),
    ).toHaveAttribute("aria-current", "page");
    expect(within(principalNavigation).getByText("Más")).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Datos verificables" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("main", { name: "Contenido principal" }),
    ).toBeVisible();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      /Proyecto independiente basado en datos públicos/i,
    );
  });

  it.each([
    ["/", "Inicio · SALIDA CyL"],
    ["/desde-fp", "Explorar FP · SALIDA CyL"],
    ["/desde-fp/IFC03S", "Ficha de FP · SALIDA CyL"],
    ["/formacion/IFC03S", "Dónde estudiar · SALIDA CyL"],
    ["/desde-oferta", "Ofertas de empleo · SALIDA CyL"],
    ["/desde-ocupacion", "Buscar ocupación · SALIDA CyL"],
    [
      "/desde-ocupacion/occupation%3Acno11%3A2713",
      "Ficha de profesión · SALIDA CyL",
    ],
    ["/comparar", "Comparar ingresos · SALIDA CyL"],
    ["/recursos", "Formación complementaria · SALIDA CyL"],
    ["/datos-abiertos", "Datos abiertos · SALIDA CyL"],
    ["/accesibilidad", "Accesibilidad · SALIDA CyL"],
    ["/para-organizaciones", "Para organizaciones · SALIDA CyL"],
    ["/metodologia", "Método y límites · SALIDA CyL"],
    ["/no-existe", "Página no encontrada · SALIDA CyL"],
  ])("sets a route-specific document title for %s", (pathname, title) => {
    cleanup();
    render(
      <MemoryRouter initialEntries={[pathname]}>
        <AppShell>
          <p>Contenido</p>
        </AppShell>
      </MemoryRouter>,
    );

    expect(document.title).toBe(title);
  });

  it("updates the document title when navigation changes pathname", async () => {
    cleanup();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <Link to="/metodologia">Metodología</Link>
        </AppShell>
      </MemoryRouter>,
    );

    await user.click(
      within(screen.getByRole("main")).getByRole("link", {
        name: "Metodología",
      }),
    );

    expect(document.title).toBe("Método y límites · SALIDA CyL");
  });

  it("announces static routes and repeats the announcement after returning", async () => {
    cleanup();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/accesibilidad"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Accesibilidad" }),
    ).toBeVisible();
    expect(
      await screen.findByRole("status", { name: "Contenido listo" }),
    ).toBeVisible();

    const footer = screen.getByRole("contentinfo");
    await user.click(
      within(footer).getByRole("link", { name: "Para organizaciones" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Para centros y administraciones",
      }),
    ).toBeVisible();
    expect(
      await screen.findByRole("status", { name: "Contenido listo" }),
    ).toBeVisible();

    await user.click(
      within(screen.getByRole("contentinfo")).getByRole("link", {
        name: "Accesibilidad",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Accesibilidad" }),
    ).toBeVisible();
    expect(
      await screen.findByRole("status", { name: "Contenido listo" }),
    ).toBeVisible();
  });

  it("routes the comparison navigation to the income-only page", async () => {
    cleanup();
    render(
      <MemoryRouter initialEntries={["/comparar"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Ingresos observados",
      }),
    ).toBeVisible();
    expect(screen.queryByText(/Empleo e ingresos/u)).not.toBeInTheDocument();
  });

  it("renders the closed mobile disclosure with the exact primary destinations", () => {
    cleanup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <p>Contenido</p>
        </AppShell>
      </MemoryRouter>,
    );

    const button = screen.getByRole("button", {
      name: "Abrir menú principal",
    });
    const mobileNavigation = getMobileNavigation();
    const desktopNavigation = screen.getByRole("navigation", {
      name: "Principal",
    });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute(
      "aria-controls",
      "mobile-primary-navigation",
    );
    expect(mobileNavigation).toHaveAttribute("hidden");
    expect(within(mobileNavigation).queryAllByRole("link")).toHaveLength(0);
    expect(
      within(desktopNavigation)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(primaryNavigationLabels);
  });

  it("opens the mobile navigation and restores focus after Escape", async () => {
    cleanup();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <p>Contenido</p>
        </AppShell>
      </MemoryRouter>,
    );

    const button = screen.getByRole("button", {
      name: "Abrir menú principal",
    });
    await user.click(button);
    const focusSpy = vi.spyOn(button, "focus");

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Principal móvil",
    });
    expect(button).toHaveAccessibleName("Cerrar menú principal");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(mobileNavigation).not.toHaveAttribute("hidden");
    expect(
      within(mobileNavigation)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(primaryNavigationLabels);
    expect(
      within(mobileNavigation).getByRole("link", { name: "Explorar" }),
    ).toHaveAttribute("aria-current", "page");

    await user.keyboard("{Escape}");

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(button).toHaveAccessibleName("Abrir menú principal");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(mobileNavigation).toHaveAttribute("hidden");
    expect(button).toHaveFocus();
  });

  it("closes after link activation without explicitly stealing focus", async () => {
    cleanup();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <p>Contenido</p>
        </AppShell>
      </MemoryRouter>,
    );

    const button = screen.getByRole("button", {
      name: "Abrir menú principal",
    });
    await user.click(button);
    const focusSpy = vi.spyOn(button, "focus");

    await user.click(
      within(
        screen.getByRole("navigation", { name: "Principal móvil" }),
      ).getByRole("link", { name: "Método y límites" }),
    );

    expect(focusSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Abrir menú principal" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(getMobileNavigation()).toHaveAttribute("hidden");
    expect(document.activeElement).not.toBe(button);
  });

  it("closes for pathname, query, hash, Back, and Forward changes", async () => {
    cleanup();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <NavigationProbe />
        </AppShell>
      </MemoryRouter>,
    );

    const expectLocation = (pathname: string, search: string, hash: string) => {
      expect(screen.getByTestId("location-pathname").textContent).toBe(
        pathname,
      );
      expect(screen.getByTestId("location-search").textContent).toBe(search);
      expect(screen.getByTestId("location-hash").textContent).toBe(hash);
    };
    const expectMenuClosedWithFocusOn = (trigger: HTMLElement) => {
      const disclosure = screen.getByRole("button", {
        name: "Abrir menú principal",
      });
      expect(disclosure).toHaveAttribute("aria-expanded", "false");
      expect(getMobileNavigation()).toHaveAttribute("hidden");
      expect(document.activeElement).toBe(trigger);
      expect(document.activeElement).not.toBe(disclosure);
    };
    const openMenu = async () => {
      await user.click(
        screen.getByRole("button", { name: "Abrir menú principal" }),
      );
      expect(
        screen.getByRole("button", { name: "Cerrar menú principal" }),
      ).toHaveAttribute("aria-expanded", "true");
    };
    const pathnameButton = screen.getByRole("button", {
      name: "Cambiar pathname",
    });
    const queryButton = screen.getByRole("button", { name: "Cambiar query" });
    const hashButton = screen.getByRole("button", { name: "Cambiar hash" });
    const backButton = screen.getByRole("button", { name: "Atrás" });
    const forwardButton = screen.getByRole("button", { name: "Adelante" });

    expectLocation("/", "", "");

    await openMenu();
    await user.click(pathnameButton);
    await waitFor(() => expectMenuClosedWithFocusOn(pathnameButton));
    expectLocation("/metodologia", "", "");

    await openMenu();
    await user.click(queryButton);
    await waitFor(() => expectMenuClosedWithFocusOn(queryButton));
    expectLocation("/", "?tab=coverage", "");

    await openMenu();
    await user.click(hashButton);
    await waitFor(() => expectMenuClosedWithFocusOn(hashButton));
    expectLocation("/", "", "#freshness");

    await openMenu();
    await user.click(backButton);
    await waitFor(() => expectMenuClosedWithFocusOn(backButton));
    expectLocation("/", "?tab=coverage", "");

    await openMenu();
    await user.click(forwardButton);
    await waitFor(() => expectMenuClosedWithFocusOn(forwardButton));
    expectLocation("/", "", "#freshness");
  });

  it("cleans the document Escape listener across StrictMode and rapid reopen", async () => {
    cleanup();
    const user = userEvent.setup();
    const addEventListenerSpy = vi.spyOn(document, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/"]}>
          <AppShell>
            <p>Contenido</p>
          </AppShell>
        </MemoryRouter>
      </StrictMode>,
    );

    const button = screen.getByRole("button", {
      name: "Abrir menú principal",
    });
    expect(
      addEventListenerSpy.mock.calls.filter(([type]) => type === "keydown"),
    ).toHaveLength(0);

    await user.click(button);
    const focusSpy = vi.spyOn(button, "focus");
    expect(
      addEventListenerSpy.mock.calls.filter(([type]) => type === "keydown"),
    ).toHaveLength(1);
    await user.keyboard("{Escape}");
    expect(
      removeEventListenerSpy.mock.calls.filter(([type]) => type === "keydown"),
    ).toHaveLength(1);
    expect(focusSpy).toHaveBeenCalledTimes(1);

    await user.click(button);
    focusSpy.mockClear();
    expect(
      addEventListenerSpy.mock.calls.filter(([type]) => type === "keydown"),
    ).toHaveLength(2);
    await user.keyboard("{Escape}");
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-expanded", "false");

    cleanup();
    expect(
      removeEventListenerSpy.mock.calls.filter(([type]) => type === "keydown"),
    ).toHaveLength(2);
    vi.restoreAllMocks();
  });

  it("resets an open menu when a desktop resize hides and then restores mobile", async () => {
    cleanup();
    const user = userEvent.setup();
    let desktop = false;
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: desktop }) as MediaQueryList),
    });

    try {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <AppShell>
            <p>Contenido</p>
          </AppShell>
        </MemoryRouter>,
      );

      const button = screen.getByRole("button", {
        name: "Abrir menú principal",
      });
      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      desktop = true;
      window.dispatchEvent(new Event("resize"));
      await waitFor(() =>
        expect(button).toHaveAttribute("aria-expanded", "false"),
      );

      desktop = false;
      window.dispatchEvent(new Event("resize"));
      expect(button).toHaveAttribute("aria-expanded", "false");
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
      cleanup();
    }
  });
});
