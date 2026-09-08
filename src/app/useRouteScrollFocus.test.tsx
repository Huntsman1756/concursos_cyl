import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRouteScrollFocus } from "./useRouteScrollFocus";

afterEach(cleanup);

function NavButtons() {
  const nav = useNavigate();
  return (
    <>
      <button type="button" onClick={() => void nav("/desde-ocupacion")}>
        ir-profesion
      </button>
      <button
        type="button"
        onClick={() => void nav("/desde-ocupacion?filtro=leon")}
      >
        ir-query
      </button>
      <button type="button" onClick={() => void nav("/para-organizaciones")}>
        ir-organizaciones
      </button>
      <button type="button" onClick={() => void nav(-1)}>
        atras
      </button>
      <button type="button" onClick={() => void nav("/inicio#datos")}>
        ir-hash
      </button>
    </>
  );
}

function ShortDestination() {
  useEffect(() => {
    // Model the scroll clamp emitted after a shorter route has painted.
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 322,
    });
    window.dispatchEvent(new Event("scroll"));
  }, []);
  return <h1>Organizaciones</h1>;
}

function setup(initialPath = "/inicio", simulateScrollClamp = false) {
  const mainRef: React.RefObject<HTMLElement | null> = {
    current: document.createElement("main"),
  };
  const focusSpy = vi.spyOn(mainRef.current!, "focus");

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ScrollFocusProbe mainRef={mainRef} />
      <NavButtons />
      <Routes>
        <Route path="/inicio" element={<h1>Inicio</h1>} />
        <Route path="/desde-ocupacion" element={<h1>Desde una profesión</h1>} />
        <Route
          path="/para-organizaciones"
          element={
            simulateScrollClamp ? <ShortDestination /> : <h1>Organizaciones</h1>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  return { mainRef, focusSpy };
}

function ScrollFocusProbe({
  mainRef,
}: {
  mainRef: React.RefObject<HTMLElement | null>;
}) {
  useRouteScrollFocus(mainRef);
  return null;
}

describe("useRouteScrollFocus", () => {
  const user = userEvent.setup();

  it("does not scroll or steal focus on first mount", () => {
    const scrollToSpy = vi.fn();
    vi.stubGlobal("scrollTo", scrollToSpy);
    try {
      setup();
      expect(scrollToSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("scrolls to top and moves focus to main on a PUSH navigation to a new pathname", async () => {
    const scrollToSpy = vi.fn();
    vi.stubGlobal("scrollTo", scrollToSpy);
    try {
      const { focusSpy } = setup();
      await user.click(screen.getByRole("button", { name: "ir-profesion" }));
      await waitFor(() => {
        expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
      });
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("does not scroll on same-pathname search-param updates", async () => {
    const scrollToSpy = vi.fn();
    vi.stubGlobal("scrollTo", scrollToSpy);
    try {
      setup("/desde-ocupacion");
      await user.click(screen.getByRole("button", { name: "ir-query" }));
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Desde una profesión" }),
        ).toBeVisible();
      });
      expect(scrollToSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("restores the previous offset even when the shorter destination emits a scroll clamp", async () => {
    const scrollToSpy = vi.fn();
    vi.stubGlobal("scrollTo", scrollToSpy);
    const scrollYDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "scrollY",
    );
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 500,
    });
    try {
      setup("/inicio", true);
      // The user scrolls home; the scroll event records the offset for the
      // current history entry.
      window.dispatchEvent(new Event("scroll"));
      await user.click(
        screen.getByRole("button", { name: "ir-organizaciones" }),
      );
      await waitFor(() => {
        expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
      });
      scrollToSpy.mockClear();
      await user.click(screen.getByRole("button", { name: "atras" }));
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Inicio" })).toBeVisible();
      });
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      expect(scrollToSpy).toHaveBeenCalledWith(0, 500);
    } finally {
      if (scrollYDescriptor !== undefined) {
        Object.defineProperty(window, "scrollY", scrollYDescriptor);
      }
      vi.unstubAllGlobals();
    }
  });

  it("scrolls to the anchor target for hash navigation", async () => {
    const scrollToSpy = vi.fn();
    vi.stubGlobal("scrollTo", scrollToSpy);
    const scrollIntoViewSpy = vi.fn();
    try {
      setup("/inicio");
      const anchor = document.createElement("section");
      anchor.id = "datos";
      document.body.appendChild(anchor);
      anchor.scrollIntoView = scrollIntoViewSpy;
      await user.click(screen.getByRole("button", { name: "ir-hash" }));
      await waitFor(() => {
        expect(scrollIntoViewSpy).toHaveBeenCalled();
      });
      expect(scrollToSpy).not.toHaveBeenCalled();
      anchor.remove();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("jumps to a hash target that only appears after the route data resolves", async () => {
    const scrollIntoViewSpy = vi.fn();
    // Direct load of a hashed URL: the fragment target does not exist yet.
    setup("/inicio#datos");
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    const anchor = document.createElement("section");
    anchor.id = "datos";
    document.body.appendChild(anchor);
    anchor.scrollIntoView = scrollIntoViewSpy;
    await waitFor(
      () => {
        expect(scrollIntoViewSpy).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
    anchor.remove();
  });
});
