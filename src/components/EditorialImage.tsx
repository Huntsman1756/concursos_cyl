interface EditorialImageProps {
  /** Editorial asset base name under /images/editorial/, e.g. "path-training". */
  asset: string;
  /** Available widths in pixels, ascending. */
  variants: number[];
  alt: string;
  width: number;
  height: number;
  sizes: string;
  /** Hero images join the critical path; everything else stays lazy. */
  priority?: boolean;
  className?: string;
}

const EDITORIAL_BASE = "/images/editorial";

/**
 * Editorial photography (AI-generated, see image-qa-policy.md). Renders a
 * <picture> with AVIF first and WebP fallback, explicit dimensions to avoid
 * CLS, and never touches the original PNG/JPG sources.
 */
export function EditorialImage({
  asset,
  variants,
  alt,
  width,
  height,
  sizes,
  priority = false,
  className,
}: EditorialImageProps) {
  const largest = variants[variants.length - 1] ?? width;
  const srcsetWidth = (extension: "avif" | "webp") =>
    variants
      .map(
        (variant) =>
          `${EDITORIAL_BASE}/${asset}-${variant}.${extension} ${variant}w`,
      )
      .join(", ");

  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcsetWidth("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcsetWidth("webp")} sizes={sizes} />
      <img
        src={`${EDITORIAL_BASE}/${asset}-${largest}.avif`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
      />
    </picture>
  );
}
