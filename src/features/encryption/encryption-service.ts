import { supabase } from "../../lib/supabase";
import type {
  UserPreferences,
  VaultSecurityProfile,
  WorkspaceHomeView
} from "../../types/bookmarks";
import { DEFAULT_PBKDF2_ITERATIONS } from "./crypto";

interface UserPreferencesRow {
  user_id: string;
  default_collection_id: string | null;
  home_view: WorkspaceHomeView | null;
  encryption_enabled: boolean | null;
  encryption_salt: string | null;
  encryption_key_check: string | null;
  encryption_iterations: number | null;
  encryption_profile: VaultSecurityProfile | null;
  created_at: string;
  updated_at: string;
}

function mapUserPreferences(row: UserPreferencesRow): UserPreferences {
  return {
    createdAt: row.created_at,
    defaultCollectionId: row.default_collection_id,
    encryptionEnabled: Boolean(row.encryption_enabled),
    encryptionIterations: row.encryption_iterations ?? DEFAULT_PBKDF2_ITERATIONS,
    encryptionKeyCheck: row.encryption_key_check,
    encryptionProfile: row.encryption_profile,
    encryptionSalt: row.encryption_salt,
    homeView: row.home_view ?? "discover",
    updatedAt: row.updated_at,
    userId: row.user_id
  };
}

function createDefaultPreferences(userId: string): UserPreferences {
  const timestamp = new Date().toISOString();

  return {
    createdAt: timestamp,
    defaultCollectionId: null,
    encryptionEnabled: false,
    encryptionIterations: DEFAULT_PBKDF2_ITERATIONS,
    encryptionKeyCheck: null,
    encryptionProfile: null,
    encryptionSalt: null,
    homeView: "discover",
    updatedAt: timestamp,
    userId
  };
}

export function createEncryptionService() {
  if (!supabase) {
    throw new Error("Supabase is not configured for vault encryption.");
  }

  const supabaseClient = supabase;

  async function getUserPreferences(userId: string) {
    const { data, error } = await supabaseClient
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return createDefaultPreferences(userId);
    }

    return mapUserPreferences(data as UserPreferencesRow);
  }

  async function updateUserPreferences(
    userId: string,
    input: Partial<UserPreferences>
  ) {
    const payload = {
      ...(input.defaultCollectionId !== undefined
        ? { default_collection_id: input.defaultCollectionId }
        : {}),
      ...(input.encryptionEnabled !== undefined
        ? { encryption_enabled: input.encryptionEnabled }
        : {}),
      ...(input.encryptionIterations !== undefined
        ? { encryption_iterations: input.encryptionIterations }
        : {}),
      ...(input.encryptionKeyCheck !== undefined
        ? { encryption_key_check: input.encryptionKeyCheck }
        : {}),
      ...(input.encryptionProfile !== undefined
        ? { encryption_profile: input.encryptionProfile }
        : {}),
      ...(input.encryptionSalt !== undefined
        ? { encryption_salt: input.encryptionSalt }
        : {}),
      ...(input.homeView !== undefined ? { home_view: input.homeView } : {}),
      user_id: userId
    };

    const { data, error } = await supabaseClient
      .from("user_preferences")
      .upsert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapUserPreferences(data as UserPreferencesRow);
  }

  return {
    getUserPreferences,
    updateUserPreferences
  };
}
