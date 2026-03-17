import type { CSSProperties } from "react";
import type { LinkItem } from "../types/catalog";
import { IconGlyph } from "./IconGlyph";
import { WebsiteIcon } from "./WebsiteIcon";

interface LinkTileProps {
  actionLabel?: string;
  accentColor: string;
  categoryName?: string;
  link: LinkItem;
  onAction?: (link: LinkItem) => void;
}

export function LinkTile({
  actionLabel,
  accentColor,
  categoryName,
  link,
  onAction
}: LinkTileProps) {
  const style = {
    "--accent": accentColor
  } as CSSProperties;

  return (
    <article className="link-tile" style={style}>
      <a
        className="link-tile__main"
        href={link.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="link-tile__icon-wrap">
          <WebsiteIcon
            className="link-tile__icon"
            fallbackName={link.iconKey}
            url={link.url}
          />
        </span>
        <span className="link-tile__body">
          {categoryName ? (
            <span className="link-tile__eyebrow">{categoryName}</span>
          ) : null}
          <span className="link-tile__title-row">
            <span className="link-tile__title">{link.name}</span>
            <IconGlyph className="link-tile__arrow" name="arrow-up-right" />
          </span>
          <span className="link-tile__description">{link.description}</span>
          <span className="link-tile__tags" aria-hidden="true">
            {link.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </span>
        </span>
      </a>
      {actionLabel && onAction ? (
        <button
          aria-label={`${actionLabel} ${link.name}`}
          className="button button--secondary link-tile__action"
          type="button"
          onClick={() => onAction(link)}
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}
