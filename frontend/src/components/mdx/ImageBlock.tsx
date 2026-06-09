interface ImageBlockProps {
  src: string;
  alt?: string;
  caption?: string;
}

export function ImageBlock({ src, alt = "", caption }: ImageBlockProps) {
  return (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="rounded-lg border w-full"
        style={{ borderColor: "var(--border)" }}
        loading="lazy"
      />
      {(caption || alt) && (
        <figcaption
          className="mt-2 text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {caption ?? alt}
        </figcaption>
      )}
    </figure>
  );
}
