import { useId } from "react";
import { IconGlyph } from "./IconGlyph";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  visibleCategoryCount: number;
  visibleLinkCount: number;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  visibleCategoryCount,
  visibleLinkCount
}: SearchBarProps) {
  const inputId = useId();
  const hasQuery = value.trim().length > 0;
  const categoryLabel = visibleCategoryCount === 1 ? "category" : "categories";
  const linkLabel = visibleLinkCount === 1 ? "link" : "links";

  return (
    <section className="search-bar" aria-label="Search and filtering">
      <div>
        <p className="section-eyebrow">Fast search</p>
        <h2>Find websites by category, name, or tag.</h2>
      </div>
      <label className="search-bar__field" htmlFor={inputId}>
        <IconGlyph className="search-bar__icon" name="search" />
        <span className="sr-only">Search sites</span>
        <input
          id={inputId}
          type="search"
          placeholder="Search for Netflix, coding, world news, design..."
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        {hasQuery ? (
          <button
            className="search-bar__clear"
            type="button"
            onClick={onClear}
          >
            Clear
          </button>
        ) : null}
      </label>
      <p aria-live="polite" className="search-bar__summary" role="status">
        Showing {visibleCategoryCount} {categoryLabel} and {visibleLinkCount}{" "}
        {linkLabel}.
      </p>
    </section>
  );
}
