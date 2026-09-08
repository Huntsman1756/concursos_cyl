import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteLoadBoundary, RouteLoadingFallback } from "./RouteLoadBoundary";
import { MemoryRouter } from "react-router-dom";

describe("RouteLoadBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <RouteLoadBoundary>
        <div data-testid="child">Content</div>
      </RouteLoadBoundary>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows error message and retry button on error", async () => {
    const onRetryMock = vi.fn();

    const Thrower = () => {
      throw new Error("Test error");
    };

    const { unmount } = render(
      <RouteLoadBoundary onRetry={onRetryMock}>
        <Thrower />
      </RouteLoadBoundary>,
    );

    const errorMsg = await screen.findByText(/Error al cargar el contenido/i);
    expect(errorMsg).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "No hemos podido cargar esta página",
      }),
    ).toBeVisible();

    const retryButton = screen.getByRole("button", { name: /Reintentar/i });
    fireEvent.click(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("uses correct aria role for fallback (default alert)", async () => {
    const Thrower = () => {
      throw new Error("Test error");
    };

    const { unmount } = render(
      <RouteLoadBoundary>
        <Thrower />
      </RouteLoadBoundary>,
    );

    const errorContainer = await screen.findByRole("alert");
    expect(errorContainer).toBeInTheDocument();
    unmount();
  });

  it("uses custom aria role for fallback", async () => {
    const Thrower = () => {
      throw new Error("Test error");
    };

    const { unmount } = render(
      <RouteLoadBoundary fallbackRole="status">
        <Thrower />
      </RouteLoadBoundary>,
    );

    const errorContainer = await screen.findByRole("status");
    expect(errorContainer).toBeInTheDocument();
    unmount();
  });

  it("renders a structured loading scaffold instead of a bare page", () => {
    render(
      <MemoryRouter>
        <RouteLoadingFallback />
      </MemoryRouter>,
    );

    // Accessible status semantics live on the visible status line.
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Cargando la página…");
    expect(status).toHaveAttribute("aria-live", "polite");
    // The scaffold region is marked busy and represents the final layout.
    const scaffold = document.querySelector('[data-loading="true"]');
    expect(scaffold).not.toBeNull();
    expect(scaffold).toHaveAttribute("aria-busy", "true");
    // Decorative surface, hidden from assistive tech; stable minimum height.
    const surface = scaffold!.querySelector(".loading-skeleton__surface");
    expect(surface).not.toBeNull();
    expect(surface).toHaveAttribute("aria-hidden", "true");
  });
});
