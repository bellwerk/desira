import type { ReactNode } from "react";

type ItemCardMediaProps = {
  title: string;
  imageUrl: string | null;
  productRedirectPath?: string | null;
  overlay?: ReactNode;
  wrapperClassName?: string;
  imageClassName?: string;
  linkClassName?: string;
};

export function ItemCardMedia({
  title,
  imageUrl,
  productRedirectPath,
  overlay,
  wrapperClassName = "",
  imageClassName = "w-full h-full object-cover",
  linkClassName = "block h-full w-full",
}: ItemCardMediaProps): React.ReactElement {
  const content = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={title} className={imageClassName} />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" className="h-24 w-24 opacity-35" />
    </div>
  );

  return (
    <div className={wrapperClassName}>
      {overlay}
      {productRedirectPath ? (
        <a
          href={productRedirectPath}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          aria-label={`Open product link for ${title}`}
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
