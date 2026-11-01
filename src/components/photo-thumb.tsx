import { useEffect, useState } from "react";
import { photoSignedUrl } from "@/lib/diary";
import { cn } from "@/lib/utils";

/** A diary photo loaded through its private, signed URL. */
export function PhotoThumb({
  path,
  alt,
  className,
}: {
  path: string;
  alt?: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    photoSignedUrl(path).then((signed) => {
      if (alive) setUrl(signed);
    });
    return () => {
      alive = false;
    };
  }, [path]);

  if (!url) {
    return <div className={cn("animate-pulse bg-secondary", className)} aria-hidden />;
  }

  return (
    <img
      src={url}
      alt={alt ?? "Diary photo"}
      loading="lazy"
      className={cn("object-cover", className)}
    />
  );
}
