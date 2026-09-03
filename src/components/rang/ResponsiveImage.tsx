import { useEffect, useRef, useState } from "react";
import type { CatalogPhoto } from "@/data/rang";

export function ResponsiveImage({
  photo,
  sizes,
  priority = false,
  className,
}: {
  photo: CatalogPhoto;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(priority);
  useEffect(() => {
    if (priority || visible || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [priority, visible]);
  return (
    <img
      ref={ref}
      src={visible ? photo.src : undefined}
      srcSet={visible ? photo.srcSet : undefined}
      sizes={sizes}
      alt={photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  );
}
