import type { CSSProperties } from "react";
import type { Category } from "../types/catalog";
import { IconGlyph } from "./IconGlyph";

export interface CategoryGridItem {
  category: Category;
  visibleLinkCount: number;
  totalLinkCount: number;
}

interface CategoryGridProps {
  items: CategoryGridItem[];
  query: string;
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
}

export function CategoryGrid({
  items,
  query,
  selectedCategoryId,
  onSelect
}: CategoryGridProps) {
  if (items.length === 0) {
    return (
      <section className="category-grid" aria-label="Category browser">
        <div className="empty-card empty-card--compact">
          <p className="section-eyebrow">No matches</p>
          <h2>No links match this search yet.</h2>
          <p>Try a broader keyword like streaming, games, news, or coding.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="category-grid" aria-label="Category browser">
      <div className="category-grid__header">
        <div>
          <p className="section-eyebrow">Browse</p>
          <h2>Pick a category to open its website tiles.</h2>
        </div>
        <p className="category-grid__hint">
          {query
            ? "Categories stay visible when either the group or one of its links matches."
            : "Tap a tile to reveal its saved destinations."}
        </p>
      </div>
      <div className="category-grid__list">
        {items.map((item) => {
          const isSelected = item.category.id === selectedCategoryId;
          const summary = query
            ? `${item.visibleLinkCount} matching site${
                item.visibleLinkCount === 1 ? "" : "s"
              }`
            : `${item.totalLinkCount} curated site${
                item.totalLinkCount === 1 ? "" : "s"
              }`;
          const style = {
            "--accent": item.category.accentColor
          } as CSSProperties;

          return (
            <button
              key={item.category.id}
              aria-pressed={isSelected}
              className="category-tile"
              data-selected={isSelected}
              style={style}
              type="button"
              onClick={() => onSelect(item.category.id)}
            >
              <span className="category-tile__icon-wrap">
                <IconGlyph className="category-tile__icon" name={item.category.icon} />
              </span>
              <span className="category-tile__content">
                <span className="category-tile__title">{item.category.name}</span>
                <span className="category-tile__description">
                  {item.category.description}
                </span>
              </span>
              <span className="category-tile__meta">
                <span>{summary}</span>
                <span>{isSelected ? "Selected" : "Open category"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
