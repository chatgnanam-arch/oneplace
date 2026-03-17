import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { BookmarkCard } from "../components/BookmarkCard";
import {
  BookmarkEditorDialog,
  CREATE_CATEGORY_VALUE,
  type BookmarkEditorValue
} from "../components/BookmarkEditorDialog";
import { CollectionEditorDialog } from "../components/CollectionEditorDialog";
import { CollectionRail } from "../components/CollectionRail";
import { IconGlyph } from "../components/IconGlyph";
import { VaultPanel } from "../components/VaultPanel";
import { useAuth } from "../features/auth/AuthProvider";
import { useBookmarks } from "../features/bookmarks/BookmarksProvider";
import { useEncryption } from "../features/encryption/EncryptionProvider";
import { matchesQuery } from "../lib/url";
import type { Bookmark } from "../types/bookmarks";

export function MyLinksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isEnabled: isVaultEnabled,
    isLoading: vaultLoading,
    isUnlocked
  } = useEncryption();
  const {
    bookmarks,
    collections,
    createBookmark,
    createCollection,
    deleteBookmark,
    deleteCollection,
    error,
    isLoading,
    toggleFavorite,
    updateBookmark
  } = useBookmarks();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [bookmarkDraft, setBookmarkDraft] = useState<Bookmark | null>(null);
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const deferredQuery = useDeferredValue(searchInput.trim().toLowerCase());
  const activeCollection = collections.find((collection) => collection.id === activeFilter);

  useEffect(() => {
    if (
      activeFilter !== "all" &&
      activeFilter !== "favorites" &&
      !collections.some((collection) => collection.id === activeFilter)
    ) {
      startTransition(() => setActiveFilter("all"));
    }
  }, [activeFilter, collections]);

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (!deferredQuery) {
      return true;
    }

    return matchesQuery(deferredQuery, [
      bookmark.title,
      bookmark.url,
      bookmark.description,
      bookmark.notes,
      collections.find((collection) => collection.id === bookmark.collectionId)?.name
    ]);
  });

  const visibleBookmarks = filteredBookmarks.filter((bookmark) => {
    if (activeFilter === "all") {
      return true;
    }

    if (activeFilter === "favorites") {
      return bookmark.isFavorite;
    }

    return bookmark.collectionId === activeFilter;
  });

  const countsByCollectionId = collections.reduce<Record<string, number>>(
    (accumulator, collection) => {
      accumulator[collection.id] = bookmarks.filter(
        (bookmark) => bookmark.collectionId === collection.id
      ).length;
      return accumulator;
    },
    {}
  );
  const activeFilterLabel =
    activeFilter === "all"
      ? "All links"
      : activeFilter === "favorites"
        ? "Favorites"
        : activeCollection?.name ?? "Category";
  const activeFilterDescription =
    activeFilter === "all"
      ? "Everything you have saved in one stream."
      : activeFilter === "favorites"
        ? "The quickest way back to your most important links."
        : activeCollection?.description || "A focused space for this saved category.";
  const activeFilterCount =
    activeFilter === "all"
      ? bookmarks.length
      : activeFilter === "favorites"
        ? bookmarks.filter((bookmark) => bookmark.isFavorite).length
        : countsByCollectionId[activeFilter] ?? 0;

  async function handleCreateCollection(value: {
    description: string;
    name: string;
  }) {
    const result = await createCollection(value);
    setNotice(result.message);

    if (result.ok) {
      setIsCollectionDialogOpen(false);
      if (result.data) {
        setActiveFilter(result.data.id);
      }
    }
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

    setActiveFilter(result.data.id);
    return result.data.id;
  }

  async function handleCreateBookmark(value: BookmarkEditorValue) {
    const collectionId = await resolveCollectionId(value);

    if (!collectionId) {
      return;
    }

    const result = await createBookmark({
      collectionId,
      description: value.description,
      notes: value.notes,
      sourceType: "manual",
      title: value.title,
      url: value.url
    });

    setNotice(result.message);

    if (result.ok) {
      setIsAddBookmarkOpen(false);
    }
  }

  async function handleUpdateBookmark(value: BookmarkEditorValue) {
    if (!bookmarkDraft) {
      return;
    }

    const collectionId = await resolveCollectionId(value);

    if (!collectionId) {
      return;
    }

    const result = await updateBookmark(bookmarkDraft.id, {
      collectionId,
      description: value.description,
      notes: value.notes,
      sourceKey: bookmarkDraft.sourceKey,
      sourceType: bookmarkDraft.sourceType,
      title: value.title,
      url: value.url
    });

    setNotice(result.message);

    if (result.ok) {
      setBookmarkDraft(null);
    }
  }

  async function handleDeleteBookmark(bookmarkId: string) {
    const result = await deleteBookmark(bookmarkId);
    setNotice(result.message);
  }

  async function handleDeleteCollection(collectionId: string) {
    const result = await deleteCollection(collectionId);
    setNotice(result.message);

    if (result.ok) {
      setActiveFilter("all");
    }
  }

  async function handleFavoriteToggle(bookmarkId: string) {
    const result = await toggleFavorite(bookmarkId);
    setNotice(result.message);
  }

  if (authLoading) {
    return (
      <main className="workspace-page">
        <section className="auth-card">
          <p className="section-eyebrow">Loading</p>
          <h1>Preparing your workspace.</h1>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="workspace-page">
        <AuthPanel />
      </main>
    );
  }

  if (vaultLoading || !isVaultEnabled || !isUnlocked) {
    return (
      <main className="workspace-page">
        <VaultPanel />
      </main>
    );
  }

  return (
    <>
      <main className="workspace-page">
        <section className="workspace-hero">
          <div>
            <p className="section-eyebrow">My Links</p>
            <h1>Your private bookmark workspace.</h1>
            <p className="workspace-page__lede">
              Save curated discoveries, add your own websites, and keep your
              essential links, custom categories, and private notes organized in
              one place.
            </p>
          </div>
          <div className="hero__chips" aria-label="Workspace stats">
            <span>
              <IconGlyph name="bookmark" />
              {bookmarks.length} saved links
            </span>
            <span>
              <IconGlyph name="grid" />
              {collections.length} categories
            </span>
            <span>
              <IconGlyph name="heart" />
              {bookmarks.filter((bookmark) => bookmark.isFavorite).length} favorites
            </span>
          </div>
        </section>

        <section className="workspace-summary-grid" aria-label="Workspace summary">
          <article className="summary-card summary-card--feature">
            <p className="summary-card__label">Active view</p>
            <h2>{activeFilterLabel}</h2>
            <p>{activeFilterDescription}</p>
            <span>{activeFilterCount} links currently in focus</span>
          </article>
          <article className="summary-card">
            <p className="summary-card__label">Search state</p>
            <strong>{deferredQuery ? "Filtered" : "Browsing"}</strong>
            <span>
              {deferredQuery
                ? `${visibleBookmarks.length} results for "${deferredQuery}"`
                : "Everything shown for the current category selection"}
            </span>
          </article>
          <article className="summary-card">
            <p className="summary-card__label">Vault</p>
            <strong>{isVaultEnabled && isUnlocked ? "Unlocked" : "Locked"}</strong>
            <span>Private notes and saved links stay behind your client vault.</span>
          </article>
        </section>

        {notice ? (
          <div className="inline-banner">
            <IconGlyph name="spark" />
            <p>{notice}</p>
          </div>
        ) : null}

        {error ? (
          <div className="inline-banner inline-banner--warning">
            <IconGlyph name="headline" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="workspace-layout">
          <CollectionRail
            activeFilter={activeFilter}
            collections={collections}
            countsByCollectionId={countsByCollectionId}
            favoriteCount={bookmarks.filter((bookmark) => bookmark.isFavorite).length}
            totalCount={bookmarks.length}
            onAddCollection={() => setIsCollectionDialogOpen(true)}
            onDeleteCollection={(collectionId) => void handleDeleteCollection(collectionId)}
            onSelect={setActiveFilter}
          />

          <section className="workspace-panel">
            <div className="workspace-toolbar">
              <div className="workspace-toolbar__intro">
                <p className="section-eyebrow">Focused workspace</p>
                <h2>{activeFilterLabel}</h2>
                <p>
                  {visibleBookmarks.length} visible links
                  {deferredQuery ? ` matching "${deferredQuery}"` : ` inside ${activeFilterLabel.toLowerCase()}`}
                  .
                </p>
              </div>
              <label className="workspace-search">
                <IconGlyph name="search" />
                <span className="sr-only">
                  Search title, URL, description, private note, or category
                </span>
                <input
                  placeholder="Search title, URL, description, private note, or category..."
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.currentTarget.value)}
                />
              </label>
              <div className="workspace-toolbar__actions">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setIsCollectionDialogOpen(true)}
                >
                  Add category
                </button>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => setIsAddBookmarkOpen(true)}
                >
                  Add link
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="empty-card">
                <p className="section-eyebrow">Loading</p>
                <h2>Fetching your bookmarks.</h2>
              </div>
            ) : visibleBookmarks.length === 0 ? (
              <div className="empty-card">
                <p className="section-eyebrow">No links yet</p>
                <h2>Your filtered workspace is empty.</h2>
                <p>
                  Add a custom link here or save something from the Discover page to
                  get started.
                </p>
              </div>
            ) : (
              <div className="bookmark-grid">
                {visibleBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    collection={collections.find(
                      (collection) => collection.id === bookmark.collectionId
                    )}
                    onDelete={(bookmarkId) => void handleDeleteBookmark(bookmarkId)}
                    onEdit={setBookmarkDraft}
                    onToggleFavorite={(bookmarkId) => void handleFavoriteToggle(bookmarkId)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {isCollectionDialogOpen ? (
        <CollectionEditorDialog
          onClose={() => setIsCollectionDialogOpen(false)}
          onSubmit={handleCreateCollection}
        />
      ) : null}

      {isAddBookmarkOpen ? (
        <BookmarkEditorDialog
          collections={collections}
          description="Add any website manually and file it into one of your categories."
          initialValue={{
            collectionId: collections[0]?.id ?? CREATE_CATEGORY_VALUE,
            description: "",
            newCollectionDescription: "",
            newCollectionName: "",
            notes: "",
            title: "",
            url: ""
          }}
          submitLabel="Save bookmark"
          title="Add bookmark"
          onClose={() => setIsAddBookmarkOpen(false)}
          onSubmit={handleCreateBookmark}
        />
      ) : null}

      {bookmarkDraft ? (
        <BookmarkEditorDialog
          collections={collections}
          description="Update the details for this saved link."
          initialValue={{
            collectionId: bookmarkDraft.collectionId,
            description: bookmarkDraft.description,
            newCollectionDescription: "",
            newCollectionName: "",
            notes: bookmarkDraft.notes,
            title: bookmarkDraft.title,
            url: bookmarkDraft.url
          }}
          submitLabel="Update bookmark"
          title={`Edit ${bookmarkDraft.title}`}
          onClose={() => setBookmarkDraft(null)}
          onSubmit={handleUpdateBookmark}
        />
      ) : null}
    </>
  );
}
