import {
  startTransition,
  type CSSProperties,
  useDeferredValue,
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import { CategoryDetail } from "../components/CategoryDetail";
import {
  CategoryGrid,
  type CategoryGridItem
} from "../components/CategoryGrid";
import {
  BookmarkEditorDialog,
  CREATE_CATEGORY_VALUE,
  type BookmarkEditorValue
} from "../components/BookmarkEditorDialog";
import { IconGlyph } from "../components/IconGlyph";
import { SearchBar } from "../components/SearchBar";
import catalog from "../data/catalog";
import { useAuth } from "../features/auth/AuthProvider";
import { useBookmarks } from "../features/bookmarks/BookmarksProvider";
import { useEncryption } from "../features/encryption/EncryptionProvider";
import { matchesQuery } from "../lib/url";
import type { Category, LinkItem } from "../types/catalog";

interface CategoryResult {
  allLinks: LinkItem[];
  category: Category;
  visible: boolean;
  visibleLinks: LinkItem[];
}

export function DiscoverPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    isEnabled: isVaultEnabled,
    isLoading: vaultLoading,
    isUnlocked
  } = useEncryption();
  const { collections, createCollection, saveCatalogLink } = useBookmarks();
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveTarget, setSaveTarget] = useState<LinkItem | null>(null);
  const deferredQuery = useDeferredValue(searchInput.trim().toLowerCase());

  const categoryResults: CategoryResult[] = catalog.categories.map((category) => {
    const allLinks = catalog.links.filter((link) => link.categoryId === category.id);
    const hasQuery = deferredQuery.length > 0;
    const categoryMatchesQuery = hasQuery
      ? matchesQuery(deferredQuery, [category.name, category.description])
      : true;
    const matchingLinks = hasQuery
      ? allLinks.filter((link) =>
          matchesQuery(deferredQuery, [
            link.name,
            link.description,
            link.tags.join(" ")
          ])
        )
      : allLinks;
    const visible = !hasQuery || categoryMatchesQuery || matchingLinks.length > 0;
    const visibleLinks = !hasQuery
      ? allLinks
      : categoryMatchesQuery
        ? allLinks
        : matchingLinks;

    return {
      allLinks,
      category,
      visible,
      visibleLinks
    };
  });

  const visibleCategories = categoryResults.filter((result) => result.visible);
  const selectedResult =
    categoryResults.find((result) => result.category.id === selectedCategoryId) ?? null;
  const selectedStillVisible =
    !selectedCategoryId ||
    visibleCategories.some((result) => result.category.id === selectedCategoryId);
  const activeSelectedResult = selectedStillVisible ? selectedResult : null;
  const visibleCategoryCount = visibleCategories.length;
  const visibleLinkCount = visibleCategories.reduce(
    (total, result) => total + result.visibleLinks.length,
    0
  );
  const categoryGridItems: CategoryGridItem[] = visibleCategories.map((result) => ({
    category: result.category,
    totalLinkCount: result.allLinks.length,
    visibleLinkCount: result.visibleLinks.length
  }));
  const searchGroups = visibleCategories
    .filter((result) => result.visibleLinks.length > 0)
    .map((result) => ({
      category: result.category,
      links: result.visibleLinks
    }));
  const heroCategory =
    activeSelectedResult?.category ??
    visibleCategories[0]?.category ??
    catalog.categories[0];
  const heroPreviewCategories = visibleCategories
    .slice(0, 3)
    .map((result) => result.category);

  useEffect(() => {
    if (selectedCategoryId && !selectedStillVisible) {
      startTransition(() => setSelectedCategoryId(null));
    }
  }, [selectedCategoryId, selectedStillVisible]);

  function handleSearchChange(value: string) {
    startTransition(() => setSearchInput(value));
  }

  function handleClearSearch() {
    startTransition(() => setSearchInput(""));
  }

  function handleCategoryToggle(categoryId: string) {
    startTransition(() =>
      setSelectedCategoryId((currentId) =>
        currentId === categoryId ? null : categoryId
      )
    );
  }

  function handleClearSelection() {
    startTransition(() => setSelectedCategoryId(null));
  }

  function handleLinkSave(link: LinkItem) {
    if (!isAuthenticated) {
      navigate("/my-links");
      return;
    }

    if (vaultLoading || !isVaultEnabled || !isUnlocked) {
      navigate("/my-links");
      return;
    }

    setSaveTarget(link);
  }

  async function resolveCollectionId(value: BookmarkEditorValue) {
    if (value.collectionId !== CREATE_CATEGORY_VALUE) {
      return value.collectionId;
    }

    const result = await createCollection({
      description: value.newCollectionDescription.trim(),
      name: value.newCollectionName.trim()
    });

    if (!result.ok || !result.data) {
      setNotice(result.message);
      return null;
    }

    return result.data.id;
  }

  async function handleSaveSubmit(value: BookmarkEditorValue) {
    if (!saveTarget) {
      return;
    }

    const collectionId = await resolveCollectionId(value);

    if (!collectionId) {
      return;
    }

    const result = await saveCatalogLink(saveTarget, {
      collectionId,
      description: value.description,
      notes: value.notes,
      title: value.title,
      url: value.url
    });

    setNotice(result.message);

    if (result.ok) {
      setSaveTarget(null);
    }
  }

  const linkActionLabel = !isAuthenticated
    ? "Sign in to save"
    : vaultLoading
      ? "Loading vault"
      : !isVaultEnabled
        ? "Enable vault"
        : isUnlocked
          ? "Save"
          : "Unlock to save";

  return (
    <>
      <header className="hero">
        <div className="hero__copy">
          <p className="section-eyebrow">Curated website launcher</p>
          <h1>OnePlace keeps discovery public and your bookmarks personal.</h1>
          <p className="hero__lede">
            Browse polished category tiles, save the best links into your private
            library, and add your own custom destinations without relying on a
            cluttered browser bookmarks bar.
          </p>
          <div className="hero__chips" aria-label="Highlights">
            <span>
              <IconGlyph name="layers" />
              {catalog.categories.length} starter categories
            </span>
            <span>
              <IconGlyph name="search" />
              Instant search
            </span>
            <span>
              <IconGlyph name="bookmark" />
              {isAuthenticated ? `Saving as ${user?.email}` : "Sign in to save links"}
            </span>
          </div>
          <div className="hero__feature-grid" aria-label="Platform highlights">
            <article className="hero-feature-card">
              <p>Explore</p>
              <strong>Category-first browsing</strong>
              <span>Large tiles, fast search, and curated starter sets.</span>
            </article>
            <article className="hero-feature-card">
              <p>Save</p>
              <strong>Private handoff to My Links</strong>
              <span>Send any discovery straight into your personal vault.</span>
            </article>
            <article className="hero-feature-card">
              <p>Organize</p>
              <strong>Custom categories and notes</strong>
              <span>Build your own bookmark system without browser clutter.</span>
            </article>
          </div>
        </div>
        <aside
          className="hero__spotlight"
          style={{ "--accent": heroCategory.accentColor } as CSSProperties}
        >
          <div className="hero__spotlight-badge">
            <IconGlyph name={heroCategory.icon} />
            Featured category
          </div>
          <h2>{heroCategory.name}</h2>
          <p>{heroCategory.description}</p>
          <dl className="hero__stats">
            <div>
              <dt>Visible categories</dt>
              <dd>{visibleCategoryCount}</dd>
            </div>
            <div>
              <dt>Visible links</dt>
              <dd>{visibleLinkCount}</dd>
            </div>
          </dl>
          <div className="hero__spotlight-list" aria-label="Popular category previews">
            {heroPreviewCategories.map((category) => (
              <button
                key={category.id}
                aria-label="Preview highlighted category"
                className="hero__spotlight-link"
                type="button"
                onClick={() => handleCategoryToggle(category.id)}
              >
                <span className="hero__spotlight-link-icon">
                  <IconGlyph name={category.icon} />
                </span>
                <span>
                  <strong>{category.name}</strong>
                  <small>{catalog.links.filter((link) => link.categoryId === category.id).length} sites</small>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </header>

      {notice ? (
        <div className="inline-banner">
          <IconGlyph name="spark" />
          <p>{notice}</p>
        </div>
      ) : null}

      <main className="app-layout">
        <section className="catalog-panel">
          <SearchBar
            value={searchInput}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            visibleCategoryCount={visibleCategoryCount}
            visibleLinkCount={visibleLinkCount}
          />
          <CategoryGrid
            items={categoryGridItems}
            onSelect={handleCategoryToggle}
            query={deferredQuery}
            selectedCategoryId={selectedCategoryId}
          />
        </section>
        <CategoryDetail
          linkActionLabel={linkActionLabel}
          onClearSelection={handleClearSelection}
          onLinkAction={handleLinkSave}
          searchGroups={activeSelectedResult ? [] : searchGroups}
          searchTerm={deferredQuery}
          selectedCategory={activeSelectedResult?.category ?? null}
          selectedLinks={activeSelectedResult?.visibleLinks ?? []}
        />
      </main>

      {saveTarget ? (
        <BookmarkEditorDialog
          collections={collections}
          description="Choose the private category where this discovery should live."
          initialValue={{
            collectionId: collections[0]?.id ?? CREATE_CATEGORY_VALUE,
            description: saveTarget.description,
            newCollectionDescription: "",
            newCollectionName: "",
            notes: "",
            title: saveTarget.name,
            url: saveTarget.url
          }}
          submitLabel="Save to My Links"
          title={`Save ${saveTarget.name}`}
          onClose={() => setSaveTarget(null)}
          onSubmit={handleSaveSubmit}
        />
      ) : null}
    </>
  );
}
