import type { CSSProperties } from "react";
import type { BookmarkCollection } from "../types/bookmarks";
import { IconGlyph } from "./IconGlyph";

interface CollectionRailProps {
  activeFilter: string;
  collections: BookmarkCollection[];
  countsByCollectionId: Record<string, number>;
  favoriteCount: number;
  onAddCollection: () => void;
  onDeleteCollection: (collectionId: string) => void;
  onSelect: (filterId: string) => void;
  totalCount: number;
}

export function CollectionRail({
  activeFilter,
  collections,
  countsByCollectionId,
  favoriteCount,
  onAddCollection,
  onDeleteCollection,
  onSelect,
  totalCount
}: CollectionRailProps) {
  const activeCollection = collections.find(
    (collection) => collection.id === activeFilter
  );
  const activeCollectionCount = activeCollection
    ? countsByCollectionId[activeCollection.id] ?? 0
    : 0;

  return (
    <aside className="collection-rail">
      <div className="collection-rail__header">
        <div>
          <p className="section-eyebrow">Categories</p>
          <h2>Organize your links.</h2>
        </div>
        <button className="button button--secondary" type="button" onClick={onAddCollection}>
          New category
        </button>
      </div>
      <div className="collection-rail__summary">
        <strong>{collections.length} custom categories</strong>
        <span>{totalCount} saved links across your library</span>
      </div>
      <div className="collection-rail__list">
        <button
          className={activeFilter === "all" ? "rail-item is-active" : "rail-item"}
          type="button"
          onClick={() => onSelect("all")}
        >
          <span className="rail-item__icon">
            <IconGlyph name="layers" />
          </span>
          <span className="rail-item__body">
            <strong>All links</strong>
            <small>{totalCount} bookmarks</small>
          </span>
        </button>
        <button
          className={
            activeFilter === "favorites" ? "rail-item is-active" : "rail-item"
          }
          type="button"
          onClick={() => onSelect("favorites")}
        >
          <span className="rail-item__icon">
            <IconGlyph name="heart" />
          </span>
          <span className="rail-item__body">
            <strong>Favorites</strong>
            <small>{favoriteCount} saved</small>
          </span>
        </button>
        {collections.map((collection) => (
          <button
            key={collection.id}
            className={
              activeFilter === collection.id ? "rail-item is-active" : "rail-item"
            }
            type="button"
            onClick={() => onSelect(collection.id)}
          >
            <span
              className="rail-item__icon rail-item__icon--color"
              style={{ "--accent": collection.color } as CSSProperties}
            >
              <IconGlyph name="bookmark" />
            </span>
            <span className="rail-item__body">
              <strong>{collection.name}</strong>
              <small>{countsByCollectionId[collection.id] ?? 0} bookmarks</small>
            </span>
          </button>
        ))}
      </div>
      {activeCollection ? (
        <div className="collection-rail__footer">
          <p>{activeCollection.description || "A focused category for your saved links."}</p>
          <button
            className="button button--ghost"
            disabled={activeCollectionCount > 0}
            type="button"
            onClick={() => onDeleteCollection(activeCollection.id)}
          >
            Delete empty category
          </button>
        </div>
      ) : null}
    </aside>
  );
}
