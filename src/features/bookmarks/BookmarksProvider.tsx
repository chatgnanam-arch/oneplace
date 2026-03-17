import type { PropsWithChildren } from "react";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState
} from "react";
import type { LinkItem } from "../../types/catalog";
import type {
  Bookmark,
  BookmarkCollection,
  BookmarkCollectionInput,
  BookmarkInput,
  MutationResult
} from "../../types/bookmarks";
import { normalizeUrl } from "../../lib/url";
import { useAuth } from "../auth/AuthProvider";
import { useEncryption } from "../encryption/EncryptionProvider";
import {
  ENCRYPTED_BOOKMARK_PLACEHOLDER_TITLE,
  ENCRYPTED_BOOKMARK_PLACEHOLDER_URL
} from "../encryption/crypto";
import {
  createBookmarkService,
  getDefaultCollectionInput
} from "./bookmark-service";

interface SaveCatalogInput {
  collectionId?: string;
  description: string;
  notes: string;
  title: string;
  url: string;
}

interface BookmarkContextValue {
  bookmarks: Bookmark[];
  collections: BookmarkCollection[];
  createBookmark: (input: BookmarkInput) => Promise<MutationResult<Bookmark>>;
  createCollection: (
    input: BookmarkCollectionInput
  ) => Promise<MutationResult<BookmarkCollection>>;
  deleteBookmark: (bookmarkId: string) => Promise<MutationResult<null>>;
  deleteCollection: (collectionId: string) => Promise<MutationResult<null>>;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  saveCatalogLink: (
    link: LinkItem,
    input: SaveCatalogInput
  ) => Promise<MutationResult<Bookmark>>;
  toggleFavorite: (bookmarkId: string) => Promise<MutationResult<Bookmark>>;
  updateBookmark: (
    bookmarkId: string,
    input: Partial<BookmarkInput>
  ) => Promise<MutationResult<Bookmark>>;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarksProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, isConfigured, user } = useAuth();
  const {
    decryptBookmark,
    encryptBookmarkPayload,
    isEnabled: encryptionEnabled,
    isLoading: encryptionLoading,
    isUnlocked
  } = useEncryption();
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      startTransition(() => {
        setBookmarks([]);
        setCollections([]);
        setIsLoading(false);
        setError(null);
      });
      return;
    }

    const currentUser = user;
    let active = true;

    async function hydrate() {
      setIsLoading(true);

      if (!isConfigured) {
        startTransition(() => {
          setBookmarks([]);
          setCollections([]);
          setError("Configure Supabase to load private bookmarks.");
          setIsLoading(false);
        });
        return;
      }

      if (encryptionLoading) {
        return;
      }

      try {
        const service = createBookmarkService();
        const nextCollections = await service.listCollections(currentUser.id);
        const rawBookmarks =
          encryptionEnabled && !isUnlocked
            ? []
            : await service.listBookmarks(currentUser.id);
        const nextBookmarks = await Promise.all(
          rawBookmarks.map((bookmark) => decryptBookmark(bookmark))
        );

        if (!active) {
          return;
        }

        startTransition(() => {
          setCollections(nextCollections);
          setBookmarks(nextBookmarks);
          setError(null);
          setIsLoading(false);
        });
      } catch (caughtError) {
        if (!active) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load bookmarks right now.";

        startTransition(() => {
          setError(message);
          setIsLoading(false);
        });
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [
    decryptBookmark,
    encryptionEnabled,
    encryptionLoading,
    isAuthenticated,
    isConfigured,
    isUnlocked,
    user?.id
  ]);

  async function refresh() {
    const currentUser = user;

    if (!currentUser) {
      return;
    }

    if (!isConfigured) {
      setError("Configure Supabase to load private bookmarks.");
      return;
    }

    if (encryptionLoading) {
      return;
    }

    try {
      const service = createBookmarkService();
      const nextCollections = await service.listCollections(currentUser.id);
      const rawBookmarks =
        encryptionEnabled && !isUnlocked
          ? []
          : await service.listBookmarks(currentUser.id);
      const nextBookmarks = await Promise.all(
        rawBookmarks.map((bookmark) => decryptBookmark(bookmark))
      );

      startTransition(() => {
        setCollections(nextCollections);
        setBookmarks(nextBookmarks);
        setError(null);
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to refresh bookmarks.";

      setError(message);
    }
  }

  async function createCollection(input: BookmarkCollectionInput) {
    if (!user) {
      return { message: "Sign in to create categories.", ok: false };
    }

    if (!isConfigured) {
      return { message: "Configure Supabase before creating categories.", ok: false };
    }

    try {
      const service = createBookmarkService();
      const createdCollection = await service.createCollection(user.id, input);
      await refresh();
      return {
        data: createdCollection,
        message: `${createdCollection.name} created.`,
        ok: true
      };
    } catch (caughtError) {
      return {
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to create the category.",
        ok: false
      };
    }
  }

  async function deleteCollection(collectionId: string) {
    if (!user) {
      return { message: "Sign in to manage categories.", ok: false };
    }

    if (!isConfigured) {
      return { message: "Configure Supabase before managing categories.", ok: false };
    }

    const bookmarkCount = bookmarks.filter(
      (bookmark) => bookmark.collectionId === collectionId
    ).length;

    if (bookmarkCount > 0) {
      return {
        message: "Move or delete bookmarks in this category before removing it.",
        ok: false
      };
    }

    try {
      const service = createBookmarkService();
      await service.deleteCollection(user.id, collectionId);
      await refresh();
      return { message: "Category removed.", ok: true };
    } catch (caughtError) {
      return {
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to delete the category.",
        ok: false
      };
    }
  }

  async function ensureCollection(collectionId?: string) {
    if (collectionId) {
      return collectionId;
    }

    const firstCollection = collections[0];

    if (firstCollection) {
      return firstCollection.id;
    }

    const created = await createCollection(getDefaultCollectionInput());

    if (!created.ok || !created.data) {
      throw new Error(created.message);
    }

    return created.data.id;
  }

  async function createBookmark(input: BookmarkInput) {
    if (!user) {
      return { message: "Sign in to add bookmarks.", ok: false };
    }

    if (!isConfigured) {
      return { message: "Configure Supabase before saving bookmarks.", ok: false };
    }

    try {
      const service = createBookmarkService();
      const collectionId = await ensureCollection(input.collectionId || undefined);
      const preparedInput = await prepareBookmarkInput({
        ...input,
        collectionId
      });
      const createdBookmark = await service.createBookmark(user.id, preparedInput);
      await refresh();
      return {
        data: createdBookmark,
        message: `${input.title} saved.`,
        ok: true
      };
    } catch (caughtError) {
      return {
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to save the bookmark.",
        ok: false
      };
    }
  }

  async function saveCatalogLink(link: LinkItem, input: SaveCatalogInput) {
    if (!user) {
      return { message: "Sign in to save links.", ok: false };
    }

    if (!isConfigured) {
      return { message: "Configure Supabase before saving links.", ok: false };
    }

    try {
      const collectionId = await ensureCollection(input.collectionId);
      const normalizedUrl = normalizeUrl(input.url);
      const existingBookmark = bookmarks.find(
        (bookmark) =>
          bookmark.collectionId === collectionId &&
          (bookmark.sourceKey === link.id || bookmark.url === normalizedUrl)
      );

      if (existingBookmark) {
        return {
          data: existingBookmark,
          message: `${link.name} is already saved in this category.`,
          ok: false
        };
      }

      return createBookmark({
        collectionId,
        description: input.description,
        notes: input.notes,
        sourceKey: link.id,
        sourceType: "catalog",
        tags: link.tags,
        title: input.title,
        url: normalizedUrl
      });
    } catch (caughtError) {
      return {
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to save this catalog link.",
        ok: false
      };
    }
  }

  async function updateBookmark(
    bookmarkId: string,
    input: Partial<BookmarkInput>
  ) {
    if (!user) {
      return { message: "Sign in to update bookmarks.", ok: false };
    }

    if (!isConfigured) {
      return { message: "Configure Supabase before updating bookmarks.", ok: false };
    }

    try {
      const service = createBookmarkService();
      const preparedInput = await prepareBookmarkUpdate(input);
      const updatedBookmark = await service.updateBookmark(user.id, bookmarkId, preparedInput);
      await refresh();
      return {
        data: updatedBookmark,
        message: `${input.title ?? "Bookmark"} updated.`,
        ok: true
      };
    } catch (caughtError) {
      return {
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to update the bookmark.",
        ok: false
      };
    }
  }

  async function deleteBookmark(bookmarkId: string) {
    if (!user) {
      return { message: "Sign in to delete bookmarks.", ok: false };
    }

    if (!isConfigured) {
      return { message: "Configure Supabase before deleting bookmarks.", ok: false };
    }

    try {
      const service = createBookmarkService();
      await service.deleteBookmark(user.id, bookmarkId);
      await refresh();
      return {
        message: "Bookmark removed.",
        ok: true
      };
    } catch (caughtError) {
      return {
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to remove the bookmark.",
        ok: false
      };
    }
  }

  async function toggleFavorite(bookmarkId: string) {
    const bookmark = bookmarks.find((item) => item.id === bookmarkId);

    if (!bookmark) {
      return { message: "Bookmark not found.", ok: false };
    }

    return updateBookmark(bookmarkId, {
      isFavorite: !bookmark.isFavorite
    });
  }

  async function prepareBookmarkInput(input: BookmarkInput) {
    const normalizedUrl = normalizeUrl(input.url);

    if (!encryptionEnabled) {
      return {
        ...input,
        url: normalizedUrl
      };
    }

    if (!isUnlocked) {
      throw new Error("Unlock your vault before saving encrypted bookmarks.");
    }

    const encrypted = await encryptBookmarkPayload({
      description: input.description,
      notes: input.notes ?? "",
      tags: input.tags ?? [],
      title: input.title,
      url: normalizedUrl
    });

    return {
      ...input,
      description: "",
      encryptedPayload: encrypted.encryptedPayload,
      encryptionVersion: encrypted.encryptionVersion,
      notes: "",
      tags: [],
      title: ENCRYPTED_BOOKMARK_PLACEHOLDER_TITLE,
      url: ENCRYPTED_BOOKMARK_PLACEHOLDER_URL
    };
  }

  async function prepareBookmarkUpdate(input: Partial<BookmarkInput>) {
    if (!encryptionEnabled) {
      return {
        ...input,
        url: input.url ? normalizeUrl(input.url) : undefined
      };
    }

    const hasEncryptedContentUpdate =
      input.title !== undefined ||
      input.url !== undefined ||
      input.description !== undefined ||
      input.notes !== undefined ||
      input.tags !== undefined;

    if (!hasEncryptedContentUpdate) {
      return input;
    }

    if (!isUnlocked) {
      throw new Error("Unlock your vault before updating encrypted bookmarks.");
    }

    if (
      input.title === undefined ||
      input.url === undefined ||
      input.description === undefined
    ) {
      throw new Error("Encrypted bookmark updates need the full bookmark details.");
    }

    const encrypted = await encryptBookmarkPayload({
      description: input.description,
      notes: input.notes ?? "",
      tags: input.tags ?? [],
      title: input.title,
      url: normalizeUrl(input.url)
    });

    return {
      ...input,
      description: "",
      encryptedPayload: encrypted.encryptedPayload,
      encryptionVersion: encrypted.encryptionVersion,
      notes: "",
      tags: [],
      title: ENCRYPTED_BOOKMARK_PLACEHOLDER_TITLE,
      url: ENCRYPTED_BOOKMARK_PLACEHOLDER_URL
    };
  }

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        collections,
        createBookmark,
        createCollection,
        deleteBookmark,
        deleteCollection,
        error,
        isLoading,
        refresh,
        saveCatalogLink,
        toggleFavorite,
        updateBookmark
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const value = useContext(BookmarkContext);

  if (!value) {
    throw new Error("useBookmarks must be used inside BookmarksProvider");
  }

  return value;
}
