export type BookmarkSourceType = "manual" | "catalog";
export type VaultSecurityProfile = "modest" | "standard";

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
}

export interface BookmarkCollection {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkCollectionInput {
  name: string;
  description: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  collectionId: string;
  title: string;
  url: string;
  description: string;
  notes: string;
  tags: string[];
  isFavorite: boolean;
  sourceType: BookmarkSourceType;
  sourceKey: string | null;
  encryptedPayload?: string | null;
  encryptionVersion?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkInput {
  collectionId: string;
  title: string;
  url: string;
  description: string;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
  sourceType: BookmarkSourceType;
  sourceKey?: string | null;
  encryptedPayload?: string | null;
  encryptionVersion?: number | null;
}

export type WorkspaceHomeView = "discover" | "my_links";

export interface UserPreferences {
  userId: string;
  defaultCollectionId: string | null;
  homeView: WorkspaceHomeView;
  encryptionEnabled: boolean;
  encryptionSalt: string | null;
  encryptionKeyCheck: string | null;
  encryptionIterations: number;
  encryptionProfile: VaultSecurityProfile | null;
  createdAt: string;
  updatedAt: string;
}

export interface MutationResult<T> {
  ok: boolean;
  message: string;
  data?: T;
}
