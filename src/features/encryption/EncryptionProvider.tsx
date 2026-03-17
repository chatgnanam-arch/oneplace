import type { PropsWithChildren } from "react";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState
} from "react";
import type { Bookmark } from "../../types/bookmarks";
import type { UserPreferences } from "../../types/bookmarks";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import {
  BOOKMARK_ENCRYPTION_VERSION,
  createRandomSalt,
  createVaultCheck,
  DEFAULT_PBKDF2_ITERATIONS,
  LEGACY_BOOKMARK_ENCRYPTION_VERSION,
  decryptJson,
  deriveVaultKey,
  encryptJson,
  getVaultDerivationOptions,
  DEFAULT_VAULT_PROFILE,
  type BookmarkEncryptionPayload,
  verifyVaultKey
} from "./crypto";
import { createEncryptionService } from "./encryption-service";

interface EncryptionContextValue {
  decryptBookmark: (bookmark: Bookmark) => Promise<Bookmark>;
  encryptBookmarkPayload: (
    payload: BookmarkEncryptionPayload
  ) => Promise<{ encryptedPayload: string; encryptionVersion: number }>;
  error: string | null;
  isEnabled: boolean;
  isLoading: boolean;
  isUnlocked: boolean;
  lockVault: () => void;
  preferences: UserPreferences | null;
  setupVault: (passphrase: string, profile?: UserPreferences["encryptionProfile"]) => Promise<void>;
  unlockVault: (passphrase: string) => Promise<void>;
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null);

function isBookmarkEncryptionPayload(
  value: unknown
): value is BookmarkEncryptionPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BookmarkEncryptionPayload>;

  return (
    typeof candidate.description === "string" &&
    typeof candidate.notes === "string" &&
    Array.isArray(candidate.tags) &&
    typeof candidate.title === "string" &&
    typeof candidate.url === "string"
  );
}

export function EncryptionProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isEnabled = Boolean(preferences?.encryptionEnabled);

  useEffect(() => {
    if (!isAuthenticated || !user || !isSupabaseConfigured) {
      startTransition(() => {
        setPreferences(null);
        setVaultKey(null);
        setError(null);
        setIsLoading(false);
      });
      return;
    }

    const service = createEncryptionService();
    const currentUser = user;
    let active = true;

    async function hydratePreferences() {
      setIsLoading(true);

      try {
        const nextPreferences = await service.getUserPreferences(currentUser.id);

        if (!active) {
          return;
        }

        startTransition(() => {
          setPreferences(nextPreferences);
          setVaultKey(null);
          setError(null);
          setIsLoading(false);
        });
      } catch (caughtError) {
        if (!active) {
          return;
        }

        startTransition(() => {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load your vault settings."
          );
          setIsLoading(false);
        });
      }
    }

    void hydratePreferences();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);

  async function setupVault(
    passphrase: string,
    profile: UserPreferences["encryptionProfile"] = DEFAULT_VAULT_PROFILE
  ) {
    const currentUser = user;

    if (!currentUser) {
      throw new Error("Sign in before creating a vault.");
    }

    if (!isSupabaseConfigured) {
      throw new Error("Configure Supabase before creating a vault.");
    }

    const normalizedPassphrase = passphrase.trim();

    if (normalizedPassphrase.length < 10) {
      throw new Error("Use at least 10 characters for your vault passphrase.");
    }

    const selectedProfile = profile ?? DEFAULT_VAULT_PROFILE;
    const derivationOptions = getVaultDerivationOptions(selectedProfile);

    try {
      const encryptionService = createEncryptionService();
      const salt = createRandomSalt();
      const nextKey = await deriveVaultKey(
        normalizedPassphrase,
        salt,
        derivationOptions
      );
      const keyCheck = await createVaultCheck(nextKey, selectedProfile);
      const nextPreferences = await encryptionService.updateUserPreferences(currentUser.id, {
        encryptionEnabled: true,
        encryptionIterations: derivationOptions.iterations,
        encryptionKeyCheck: keyCheck,
        encryptionProfile: selectedProfile,
        encryptionSalt: salt
      });

      startTransition(() => {
        setPreferences(nextPreferences);
        setVaultKey(nextKey);
        setError(null);
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create your encrypted vault.";

      startTransition(() => {
        setError(message);
      });

      throw new Error(message);
    }
  }

  async function unlockVault(passphrase: string) {
    const normalizedPassphrase = passphrase.trim();

    if (!preferences?.encryptionSalt || !preferences.encryptionKeyCheck) {
      throw new Error("Create your vault first before unlocking it.");
    }

    if (!normalizedPassphrase) {
      throw new Error("Enter your vault passphrase to unlock your saved links.");
    }

    const derivationOptions = preferences.encryptionProfile
      ? getVaultDerivationOptions(preferences.encryptionProfile)
      : {
          hash: "SHA-256" as const,
          iterations: preferences.encryptionIterations || DEFAULT_PBKDF2_ITERATIONS
        };

    try {
      const nextKey = await deriveVaultKey(
        normalizedPassphrase,
        preferences.encryptionSalt,
        derivationOptions
      );
      const isValid = await verifyVaultKey(nextKey, preferences.encryptionKeyCheck);

      if (!isValid) {
        throw new Error("That vault passphrase is incorrect.");
      }

      startTransition(() => {
        setVaultKey(nextKey);
        setError(null);
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to unlock your encrypted vault.";

      startTransition(() => {
        setError(message);
      });

      throw new Error(message);
    }
  }

  function lockVault() {
    startTransition(() => {
      setError(null);
      setVaultKey(null);
    });
  }

  async function encryptBookmarkPayload(payload: BookmarkEncryptionPayload) {
    if (!isEnabled) {
      return {
        encryptedPayload: "",
        encryptionVersion: BOOKMARK_ENCRYPTION_VERSION
      };
    }

    if (!vaultKey) {
      throw new Error("Unlock your vault before saving encrypted bookmarks.");
    }

    return {
      encryptedPayload: await encryptJson(vaultKey, payload, {
        profile: preferences?.encryptionProfile ?? null
      }),
      encryptionVersion: preferences?.encryptionProfile
        ? BOOKMARK_ENCRYPTION_VERSION
        : LEGACY_BOOKMARK_ENCRYPTION_VERSION
    };
  }

  async function decryptBookmark(bookmark: Bookmark) {
    if (!bookmark.encryptedPayload) {
      return bookmark;
    }

    if (!vaultKey) {
      throw new Error("Unlock your vault to read encrypted bookmarks.");
    }

    let payload: unknown;

    try {
      payload = await decryptJson<unknown>(vaultKey, bookmark.encryptedPayload);
    } catch {
      throw new Error("Unable to decrypt one of your saved bookmarks.");
    }

    if (!isBookmarkEncryptionPayload(payload)) {
      throw new Error("This bookmark payload is not in a supported format.");
    }

    return {
      ...bookmark,
      description: payload.description,
      notes: payload.notes,
      tags: payload.tags,
      title: payload.title,
      url: payload.url
    };
  }

  return (
    <EncryptionContext.Provider
      value={{
        decryptBookmark,
        encryptBookmarkPayload,
        error,
        isEnabled,
        isLoading,
        isUnlocked: Boolean(vaultKey),
        lockVault,
        preferences,
        setupVault,
        unlockVault
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const value = useContext(EncryptionContext);

  if (!value) {
    throw new Error("useEncryption must be used inside EncryptionProvider");
  }

  return value;
}
