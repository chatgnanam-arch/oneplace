import type { Bookmark, BookmarkCollection } from "../types/bookmarks";
import { IconGlyph } from "./IconGlyph";
import { WebsiteIcon } from "./WebsiteIcon";

interface BookmarkCardProps {
  bookmark: Bookmark;
  collection?: BookmarkCollection;
  onDelete: (bookmarkId: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onToggleFavorite: (bookmarkId: string) => void;
}

export function BookmarkCard({
  bookmark,
  collection,
  onDelete,
  onEdit,
  onToggleFavorite
}: BookmarkCardProps) {
  return (
    <article className="bookmark-card">
      <div className="bookmark-card__header">
        <div className="bookmark-card__title-group">
          <span className="bookmark-card__icon-wrap">
            <WebsiteIcon
              className="bookmark-card__site-icon"
              fallbackName="bookmark"
              url={bookmark.url}
            />
          </span>
          <div>
            <p className="bookmark-card__eyebrow">
              {collection?.name ?? "Uncategorized"}
              {bookmark.sourceType === "catalog" ? " · Saved from discover" : ""}
            </p>
            <h3>{bookmark.title}</h3>
          </div>
        </div>
        <button
          aria-label={
            bookmark.isFavorite ? `Remove ${bookmark.title} from favorites` : `Favorite ${bookmark.title}`
          }
          className={
            bookmark.isFavorite
              ? "icon-button icon-button--active"
              : "icon-button"
          }
          type="button"
          onClick={() => onToggleFavorite(bookmark.id)}
        >
          <IconGlyph name="heart" />
        </button>
      </div>
      <p className="bookmark-card__description">
        {bookmark.description || "No description added yet."}
      </p>
      {bookmark.notes ? (
        <p className="bookmark-card__notes">
          <strong>Private note:</strong> {bookmark.notes}
        </p>
      ) : null}
      <div className="bookmark-card__footer">
        <a
          className="button button--secondary"
          href={bookmark.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open link
        </a>
        <div className="bookmark-card__actions">
          <button className="button button--ghost" type="button" onClick={() => onEdit(bookmark)}>
            Edit
          </button>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => onDelete(bookmark.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
