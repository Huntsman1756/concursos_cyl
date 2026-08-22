import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteLoadBoundary } from "./RouteLoadBoundary";

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
});
