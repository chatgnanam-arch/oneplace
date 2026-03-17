import { supabase } from "../../lib/supabase";
import {
  type Bookmark,
  type BookmarkCollection,
  type BookmarkCollectionInput,
  type BookmarkInput
} from "../../types/bookmarks";

const DEFAULT_COLLECTION = {
  color: "#1f8a70",
  description: "Quick saves from across OnePlace.",
  icon: "bookmark",
  name: "Saved links"
};

interface BookmarkService {
  createBookmark: (userId: string, input: BookmarkInput) => Promise<Bookmark>;
  createCollection: (
    userId: string,
    input: BookmarkCollectionInput
  ) => Promise<BookmarkCollection>;
  deleteBookmark: (userId: string, bookmarkId: string) => Promise<void>;
  deleteCollection: (userId: string, collectionId: string) => Promise<void>;
  listBookmarks: (userId: string) => Promise<Bookmark[]>;
  listCollections: (userId: string) => Promise<BookmarkCollection[]>;
  updateBookmark: (
    userId: string,
    bookmarkId: string,
    input: Partial<BookmarkInput>
  ) => Promise<Bookmark>;
  updateCollection: (
    userId: string,
    collectionId: string,
    input: Partial<BookmarkCollectionInput>
  ) => Promise<BookmarkCollection>;
}

interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

interface BookmarkRow {
  id: string;
  user_id: string;
  collection_id: string;
  title: string;
  url: string;
  description: string | null;
  encrypted_payload: string | null;
  encryption_version: number | null;
  notes: string | null;
  tags: string[] | null;
  is_favorite: boolean | null;
  source_type: "catalog" | "manual" | null;
  source_key: string | null;
  created_at: string;
  updated_at: string;
}

function mapCollectionRow(row: CollectionRow): BookmarkCollection {
  return {
    color: row.color ?? DEFAULT_COLLECTION.color,
    createdAt: row.created_at,
    description: row.description ?? "",
    icon: row.icon ?? DEFAULT_COLLECTION.icon,
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order ?? 0,
    updatedAt: row.updated_at,
    userId: row.user_id
  };
}

function mapBookmarkRow(row: BookmarkRow): Bookmark {
  return {
    collectionId: row.collection_id,
    createdAt: row.created_at,
    description: row.description ?? "",
    encryptedPayload: row.encrypted_payload,
    encryptionVersion: row.encryption_version,
    id: row.id,
    isFavorite: Boolean(row.is_favorite),
    notes: row.notes ?? "",
    sourceKey: row.source_key,
    sourceType: row.source_type ?? "manual",
    tags: row.tags ?? [],
    title: row.title,
    updatedAt: row.updated_at,
    url: row.url,
    userId: row.user_id
  };
}

function createSupabaseBookmarkService(): BookmarkService {
  if (!supabase) {
    throw new Error("Supabase is not configured for private bookmarks.");
  }

  const supabaseClient = supabase;

  async function listCollections(userId: string) {
    const { data, error } = await supabaseClient
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data as CollectionRow[]).map(mapCollectionRow);
  }

  async function listBookmarks(userId: string) {
    const { data, error } = await supabaseClient
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as BookmarkRow[]).map(mapBookmarkRow);
  }

  async function createCollection(userId: string, input: BookmarkCollectionInput) {
    const existingCollections = await listCollections(userId);
    const payload = {
      description: input.description,
      name: input.name,
      sort_order: existingCollections.length,
      user_id: userId
    };
    const { data, error } = await supabaseClient
      .from("collections")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapCollectionRow(data as CollectionRow);
  }

  async function updateCollection(
    userId: string,
    collectionId: string,
    input: Partial<BookmarkCollectionInput>
  ) {
    const payload = {
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.name !== undefined ? { name: input.name } : {})
    };
    const { data, error } = await supabaseClient
      .from("collections")
      .update(payload)
      .eq("id", collectionId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapCollectionRow(data as CollectionRow);
  }

  async function deleteCollection(userId: string, collectionId: string) {
    const { error } = await supabaseClient
      .from("collections")
      .delete()
      .eq("id", collectionId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function createBookmark(userId: string, input: BookmarkInput) {
    const payload = {
      collection_id: input.collectionId,
      description: input.description,
      encrypted_payload: input.encryptedPayload ?? null,
      encryption_version: input.encryptionVersion ?? null,
      is_favorite: input.isFavorite ?? false,
      notes: input.notes ?? "",
      source_key: input.sourceKey ?? null,
      source_type: input.sourceType,
      tags: input.tags ?? [],
      title: input.title,
      url: input.url,
      user_id: userId
    };
    const { data, error } = await supabaseClient
      .from("bookmarks")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapBookmarkRow(data as BookmarkRow);
  }

  async function updateBookmark(
    userId: string,
    bookmarkId: string,
    input: Partial<BookmarkInput>
  ) {
    const payload = {
      ...(input.collectionId !== undefined ? { collection_id: input.collectionId } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.encryptedPayload !== undefined
        ? { encrypted_payload: input.encryptedPayload }
        : {}),
      ...(input.encryptionVersion !== undefined
        ? { encryption_version: input.encryptionVersion }
        : {}),
      ...(input.isFavorite !== undefined ? { is_favorite: input.isFavorite } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.sourceKey !== undefined ? { source_key: input.sourceKey } : {}),
      ...(input.sourceType !== undefined ? { source_type: input.sourceType } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.url !== undefined ? { url: input.url } : {})
    };
    const { data, error } = await supabaseClient
      .from("bookmarks")
      .update(payload)
      .eq("id", bookmarkId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapBookmarkRow(data as BookmarkRow);
  }

  async function deleteBookmark(userId: string, bookmarkId: string) {
    const { error } = await supabaseClient
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    createBookmark,
    createCollection,
    deleteBookmark,
    deleteCollection,
    listBookmarks,
    listCollections,
    updateBookmark,
    updateCollection
  };
}

export function createBookmarkService() {
  return createSupabaseBookmarkService();
}

export function getDefaultCollectionInput() {
  return {
    description: DEFAULT_COLLECTION.description,
    name: DEFAULT_COLLECTION.name
  };
}
