import Image from "next/image";

const OPTIMIZABLE_HOSTS = new Set(["images.unsplash.com", "res.cloudinary.com"]);

function isOptimizable(src: string) {
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

type Props = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
} & (
  | { fill: true; sizes: string; width?: never; height?: never }
  | { fill?: false; width: number; height: number; sizes?: string }
);

/**
 * next/image for our two known, size-optimizable sources (Cloudinary
 * uploads, Unsplash seed data) — real width/height negotiation, lazy
 * loading, and on-disk caching instead of every card fetching the same
 * full-resolution original. Falls back to a plain <img> for anything else,
 * since admins can paste an arbitrary image URL (see ImagesField) and
 * next/image refuses to serve a host that isn't allow-listed in
 * next.config.ts.
 */
export default function SmartImage(props: Props) {
  const { src, alt, className, priority } = props;

  if (!isOptimizable(src)) {
    const fallbackClassName = props.fill
      ? `absolute inset-0 h-full w-full object-cover ${className ?? ""}`
      : className;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={fallbackClassName} loading={priority ? "eager" : "lazy"} />
    );
  }

  if (props.fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={props.sizes}
        priority={priority}
        className={`object-cover ${className ?? ""}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={props.width}
      height={props.height}
      sizes={props.sizes}
      priority={priority}
      className={className}
    />
  );
}
