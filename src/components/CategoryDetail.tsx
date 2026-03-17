import type { Category, LinkItem } from "../types/catalog";
import { LinkTile } from "./LinkTile";

interface SearchResultGroup {
  category: Category;
  links: LinkItem[];
}

interface CategoryDetailProps {
  linkActionLabel: string;
  onLinkAction: (link: LinkItem) => void;
  selectedCategory: Category | null;
  selectedLinks: LinkItem[];
  searchGroups: SearchResultGroup[];
  searchTerm: string;
  onClearSelection: () => void;
}

export function CategoryDetail({
  linkActionLabel,
  onLinkAction,
  selectedCategory,
  selectedLinks,
  searchGroups,
  searchTerm,
  onClearSelection
}: CategoryDetailProps) {
  if (selectedCategory) {
    return (
      <section
        aria-label={`${selectedCategory.name} destinations`}
        className="detail-panel"
      >
        <div className="detail-panel__header">
          <div>
            <p className="section-eyebrow">Selected category</p>
            <h2>{selectedCategory.name}</h2>
            <p className="detail-panel__lede">{selectedCategory.description}</p>
          </div>
          <button
            className="detail-panel__action"
            type="button"
            onClick={onClearSelection}
          >
            Clear selection
          </button>
        </div>
        <p className="detail-panel__summary">
          {searchTerm
            ? `Filtered by "${searchTerm}" across this category.`
            : "Every saved link in this category is ready to launch."}
        </p>
        <div className="link-grid">
          {selectedLinks.map((link) => (
            <LinkTile
              key={link.id}
              actionLabel={linkActionLabel}
              accentColor={selectedCategory.accentColor}
              link={link}
              onAction={onLinkAction}
            />
          ))}
        </div>
      </section>
    );
  }

  if (searchTerm) {
    return (
      <section aria-label="Search results" className="detail-panel">
        <div className="detail-panel__header">
          <div>
            <p className="section-eyebrow">Search results</p>
            <h2>Matches for "{searchTerm}"</h2>
            <p className="detail-panel__lede">
              Open any result directly or choose a category tile to focus it.
            </p>
          </div>
        </div>
        {searchGroups.length === 0 ? (
          <div className="empty-card">
            <p className="section-eyebrow">No matches</p>
            <h3>No links match this search yet.</h3>
            <p>Try a shorter term or browse from the category tiles instead.</p>
          </div>
        ) : (
          <div className="search-groups">
            {searchGroups.map((group) => (
              <section
                key={group.category.id}
                aria-label={`${group.category.name} results`}
                className="search-group"
              >
                <div className="search-group__header">
                  <h3>{group.category.name}</h3>
                  <span>{group.links.length} results</span>
                </div>
                <div className="link-grid">
                  {group.links.map((link) => (
                    <LinkTile
                      key={link.id}
                      actionLabel={linkActionLabel}
                      accentColor={group.category.accentColor}
                      categoryName={group.category.name}
                      link={link}
                      onAction={onLinkAction}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section aria-label="Selection guidance" className="detail-panel detail-panel--empty">
      <div className="empty-card">
        <p className="section-eyebrow">Ready to browse</p>
        <h2>Choose a category tile to reveal its links.</h2>
        <p>
          Start with OTT, Games, or News, or use the search bar to jump to a
          keyword instantly.
        </p>
      </div>
    </section>
  );
}
