import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorialImage } from "./EditorialImage";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("EditorialImage", () => {
  it("keeps every image variant inside the Pages base", () => {
    vi.stubEnv("BASE_URL", "/concursos_cyl/");
    const { container } = render(
      <EditorialImage
        asset="path-training"
        variants={[640, 960]}
        alt="Formación"
        width={640}
        height={480}
        sizes="100vw"
      />,
    );
    expect(container.querySelector("img")?.src).toContain(
      "/concursos_cyl/images/editorial/",
    );
    for (const source of container.querySelectorAll("source"))
      expect(source.srcset).not.toMatch(/(?:^|, )\/images\//u);
  });
  it("renders AVIF first, WebP fallback, and a sized img inside <picture>", () => {
    const { container } = render(
      <EditorialImage
        asset="path-training"
        variants={[640, 960]}
        alt="Estudiante de FP consultando su plan de formación."
        width={640}
        height={480}
        sizes="(min-width: 768px) 33vw, calc(100vw - 2 * var(--grid-gutter))"
      />,
    );
    const picture = container.querySelector("picture");
    expect(picture).not.toBeNull();
    const sources = picture?.querySelectorAll("source") ?? [];
    expect(sources).toHaveLength(2);
    expect(sources[0]?.getAttribute("type")).toBe("image/avif");
    expect(sources[1]?.getAttribute("type")).toBe("image/webp");
    expect(sources[0]?.getAttribute("srcset")).toContain(
      "/images/editorial/path-training-640.avif 640w",
    );
    expect(sources[0]?.getAttribute("sizes")).toBe(
      "(min-width: 768px) 33vw, calc(100vw - 2 * var(--grid-gutter))",
    );
    const img = picture?.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe(
      "Estudiante de FP consultando su plan de formación.",
    );
    expect(img?.getAttribute("width")).toBe("640");
    expect(img?.getAttribute("height")).toBe("480");
  });

  it("treats the hero as priority: eager, high fetchpriority, async decoding", () => {
    const { container } = render(
      <EditorialImage
        asset="hero-career-guidance"
        variants={[640, 960, 1280, 1536]}
        alt="Hero"
        width={1536}
        height={1024}
        sizes="45vw"
        priority
      />,
    );
    const img = container.querySelector("img");
    expect(img?.getAttribute("loading")).toBe("eager");
    expect(img?.getAttribute("fetchpriority")).toBe("high");
    expect(img?.getAttribute("decoding")).toBe("async");
  });

  it("keeps every non-hero image out of the critical path", () => {
    const { container } = render(
      <EditorialImage
        asset="path-offer"
        variants={[640, 960]}
        alt="Oferta"
        width={640}
        height={480}
        sizes="33vw"
      />,
    );
    const img = container.querySelector("img");
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(img?.getAttribute("decoding")).toBe("async");
    expect(img?.hasAttribute("fetchpriority")).toBe(false);
  });

  it("never consumes the original PNG assets", () => {
    const { container } = render(
      <EditorialImage
        asset="centers-vocational-training"
        variants={[640, 960, 1280]}
        alt="Centros"
        width={1280}
        height={720}
        sizes="42vw"
      />,
    );
    expect(container.innerHTML).not.toContain(".png");
    expect(container.innerHTML).not.toContain(".jpg");
  });
});
