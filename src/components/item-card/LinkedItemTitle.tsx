type LinkedItemTitleProps = {
  title: string;
  productRedirectPath?: string | null;
  className?: string;
};

export function LinkedItemTitle({
  title,
  productRedirectPath,
  className = "",
}: LinkedItemTitleProps): React.ReactElement {
  if (!productRedirectPath) {
    return <>{title}</>;
  }

  return (
    <a
      href={productRedirectPath}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={`Open product link for ${title}`}
    >
      {title}
    </a>
  );
}
