import type { VaultSecurityProfile } from "../../types/bookmarks";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const VAULT_CHECK_VALUE = "oneplace-vault-check-v1";
const IV_BYTES = 12;
const KEY_LENGTH = 256;
const SALT_BYTES = 16;
const AES_GCM_TAG_LENGTH = 128;
const LEGACY_PBKDF2_HASH = "SHA-256";

type VaultHash = "SHA-256" | "SHA-512";

interface VaultSecurityProfileDefinition {
  description: string;
  hash: "SHA-512";
  iterations: number;
  label: string;
}

interface LegacyCipherEnvelope {
  algorithm: "AES-GCM";
  ciphertext: string;
  iv: string;
  version: 1;
}

interface EnhancedCipherEnvelope {
  algorithm: "AES-GCM";
  ciphertext: string;
  iv: string;
  kdf: "PBKDF2";
  kdfHash: "SHA-512";
  profile: VaultSecurityProfile;
  tagLength: 128;
  version: 2;
}

interface EnhancedEnvelopeHeader {
  algorithm: "AES-GCM";
  iv: string;
  kdf: "PBKDF2";
  kdfHash: "SHA-512";
  profile: VaultSecurityProfile;
  tagLength: 128;
  version: 2;
}

interface DeriveVaultKeyOptions {
  hash?: VaultHash;
  iterations?: number;
}

interface EncryptJsonOptions {
  profile?: VaultSecurityProfile | null;
}

export const BOOKMARK_ENCRYPTION_VERSION = 2;
export const LEGACY_BOOKMARK_ENCRYPTION_VERSION = 1;
export const DEFAULT_VAULT_PROFILE: VaultSecurityProfile = "modest";
export const DEFAULT_PBKDF2_ITERATIONS = 210000;
export const ENCRYPTED_BOOKMARK_PLACEHOLDER_TITLE = "Encrypted bookmark";
export const ENCRYPTED_BOOKMARK_PLACEHOLDER_URL = "https://vault.oneplace.invalid/";

export const VAULT_SECURITY_PROFILES: Record<
  VaultSecurityProfile,
  VaultSecurityProfileDefinition
> = {
  modest: {
    description: "Lower CPU cost for everyday laptops and phones.",
    hash: "SHA-512",
    iterations: DEFAULT_PBKDF2_ITERATIONS,
    label: "Modest"
  },
  standard: {
    description: "Higher derivation cost for stronger local hardening.",
    hash: "SHA-512",
    iterations: 390000,
    label: "Standard"
  }
};

export interface BookmarkEncryptionPayload {
  description: string;
  notes: string;
  tags: string[];
  title: string;
  url: string;
}

function requireCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure encryption is unavailable in this browser.");
  }

  return globalThis.crypto;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function createEnhancedEnvelopeHeader(
  iv: Uint8Array,
  profile: VaultSecurityProfile
): EnhancedEnvelopeHeader {
  const profileDefinition = VAULT_SECURITY_PROFILES[profile];

  return {
    algorithm: "AES-GCM",
    iv: bytesToBase64(iv),
    kdf: "PBKDF2",
    kdfHash: profileDefinition.hash,
    profile,
    tagLength: AES_GCM_TAG_LENGTH,
    version: BOOKMARK_ENCRYPTION_VERSION
  };
}

function serializeEnhancedHeader(header: EnhancedEnvelopeHeader) {
  return textEncoder.encode(
    JSON.stringify({
      algorithm: header.algorithm,
      iv: header.iv,
      kdf: header.kdf,
      kdfHash: header.kdfHash,
      profile: header.profile,
      tagLength: header.tagLength,
      version: header.version
    })
  );
}

function isEnhancedCipherEnvelope(value: unknown): value is EnhancedCipherEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<EnhancedCipherEnvelope>;

  return (
    candidate.algorithm === "AES-GCM" &&
    typeof candidate.ciphertext === "string" &&
    typeof candidate.iv === "string" &&
    candidate.kdf === "PBKDF2" &&
    candidate.kdfHash === "SHA-512" &&
    candidate.profile !== undefined &&
    candidate.profile in VAULT_SECURITY_PROFILES &&
    candidate.tagLength === AES_GCM_TAG_LENGTH &&
    candidate.version === BOOKMARK_ENCRYPTION_VERSION
  );
}

function isLegacyCipherEnvelope(value: unknown): value is LegacyCipherEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LegacyCipherEnvelope>;

  return (
    candidate.algorithm === "AES-GCM" &&
    typeof candidate.ciphertext === "string" &&
    typeof candidate.iv === "string" &&
    candidate.version === 1
  );
}

export function getVaultSecurityProfile(
  profile: VaultSecurityProfile = DEFAULT_VAULT_PROFILE
) {
  return VAULT_SECURITY_PROFILES[profile];
}

export function getVaultDerivationOptions(profile: VaultSecurityProfile) {
  const definition = getVaultSecurityProfile(profile);

  return {
    hash: definition.hash,
    iterations: definition.iterations
  } as const;
}

export function createRandomSalt() {
  const cryptoApi = requireCrypto();
  const salt = new Uint8Array(SALT_BYTES);
  cryptoApi.getRandomValues(salt);
  return bytesToBase64(salt);
}

export async function deriveVaultKey(
  passphrase: string,
  saltBase64: string,
  options: DeriveVaultKeyOptions = {}
) {
  const { hash = LEGACY_PBKDF2_HASH, iterations = DEFAULT_PBKDF2_ITERATIONS } = options;
  const cryptoApi = requireCrypto();
  const importedKey = await cryptoApi.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return cryptoApi.subtle.deriveKey(
    {
      hash,
      iterations,
      name: "PBKDF2",
      salt: base64ToBytes(saltBase64)
    },
    importedKey,
    {
      length: KEY_LENGTH,
      name: "AES-GCM"
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptJson<T>(
  key: CryptoKey,
  value: T,
  options: EncryptJsonOptions = {}
) {
  const cryptoApi = requireCrypto();
  const iv = new Uint8Array(IV_BYTES);
  cryptoApi.getRandomValues(iv);

  if (!options.profile) {
    const ciphertext = await cryptoApi.subtle.encrypt(
      {
        iv,
        name: "AES-GCM"
      },
      key,
      textEncoder.encode(JSON.stringify(value))
    );

    const envelope: LegacyCipherEnvelope = {
      algorithm: "AES-GCM",
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
      iv: bytesToBase64(iv),
      version: LEGACY_BOOKMARK_ENCRYPTION_VERSION
    };

    return JSON.stringify(envelope);
  }

  const header = createEnhancedEnvelopeHeader(iv, options.profile);
  const ciphertext = await cryptoApi.subtle.encrypt(
    {
      additionalData: serializeEnhancedHeader(header),
      iv,
      name: "AES-GCM",
      tagLength: header.tagLength
    },
    key,
    textEncoder.encode(JSON.stringify(value))
  );
  const envelope: EnhancedCipherEnvelope = {
    ...header,
    ciphertext: bytesToBase64(new Uint8Array(ciphertext))
  };

  return JSON.stringify(envelope);
}

export async function decryptJson<T>(key: CryptoKey, envelopeJson: string) {
  const cryptoApi = requireCrypto();
  const parsedEnvelope = JSON.parse(envelopeJson) as unknown;

  if (isLegacyCipherEnvelope(parsedEnvelope)) {
    const plaintext = await cryptoApi.subtle.decrypt(
      {
        iv: base64ToBytes(parsedEnvelope.iv),
        name: "AES-GCM"
      },
      key,
      base64ToBytes(parsedEnvelope.ciphertext)
    );

    return JSON.parse(textDecoder.decode(plaintext)) as T;
  }

  if (isEnhancedCipherEnvelope(parsedEnvelope)) {
    const header: EnhancedEnvelopeHeader = {
      algorithm: parsedEnvelope.algorithm,
      iv: parsedEnvelope.iv,
      kdf: parsedEnvelope.kdf,
      kdfHash: parsedEnvelope.kdfHash,
      profile: parsedEnvelope.profile,
      tagLength: parsedEnvelope.tagLength,
      version: parsedEnvelope.version
    };
    const plaintext = await cryptoApi.subtle.decrypt(
      {
        additionalData: serializeEnhancedHeader(header),
        iv: base64ToBytes(parsedEnvelope.iv),
        name: "AES-GCM",
        tagLength: parsedEnvelope.tagLength
      },
      key,
      base64ToBytes(parsedEnvelope.ciphertext)
    );

    return JSON.parse(textDecoder.decode(plaintext)) as T;
  }

  throw new Error("This encrypted data uses an unsupported vault format.");
}

export async function createVaultCheck(
  key: CryptoKey,
  profile?: VaultSecurityProfile | null
) {
  return encryptJson(key, { value: VAULT_CHECK_VALUE }, { profile });
}

export async function verifyVaultKey(key: CryptoKey, encryptedCheck: string) {
  try {
    const payload = await decryptJson<{ value: string }>(key, encryptedCheck);
    return payload.value === VAULT_CHECK_VALUE;
  } catch {
    return false;
  }
}
