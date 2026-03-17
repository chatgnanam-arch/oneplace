import { describe, expect, it } from "vitest";
import {
  DEFAULT_VAULT_PROFILE,
  createRandomSalt,
  createVaultCheck,
  decryptJson,
  deriveVaultKey,
  encryptJson,
  getVaultDerivationOptions,
  verifyVaultKey
} from "./crypto";

describe("bookmark vault crypto", () => {
  it("encrypts and decrypts bookmark payloads with the enhanced modest profile", async () => {
    const salt = createRandomSalt();
    const key = await deriveVaultKey(
      "correct horse battery staple",
      salt,
      getVaultDerivationOptions(DEFAULT_VAULT_PROFILE)
    );
    const encryptedPayload = await encryptJson(key, {
      description: "Research notes",
      notes: "Priority link for launch week",
      tags: ["launch", "priority"],
      title: "Docs",
      url: "https://example.com/docs"
    }, {
      profile: DEFAULT_VAULT_PROFILE
    });

    const decryptedPayload = await decryptJson<{
      description: string;
      notes: string;
      tags: string[];
      title: string;
      url: string;
    }>(key, encryptedPayload);

    expect(decryptedPayload).toEqual({
      description: "Research notes",
      notes: "Priority link for launch week",
      tags: ["launch", "priority"],
      title: "Docs",
      url: "https://example.com/docs"
    });
  });

  it("keeps legacy payloads readable for older vault rows", async () => {
    const salt = createRandomSalt();
    const key = await deriveVaultKey("legacy passphrase", salt, {
      hash: "SHA-256",
      iterations: 310000
    });
    const encryptedPayload = await encryptJson(
      key,
      {
        title: "Legacy",
        url: "https://example.com/legacy"
      }
    );
    const decryptedPayload = await decryptJson<{
      title: string;
      url: string;
    }>(key, encryptedPayload);

    expect(decryptedPayload).toEqual({
      title: "Legacy",
      url: "https://example.com/legacy"
    });
  });

  it("verifies the correct vault passphrase and rejects the wrong one", async () => {
    const salt = createRandomSalt();
    const correctKey = await deriveVaultKey(
      "my strong vault passphrase",
      salt,
      getVaultDerivationOptions(DEFAULT_VAULT_PROFILE)
    );
    const wrongKey = await deriveVaultKey(
      "totally different passphrase",
      salt,
      getVaultDerivationOptions(DEFAULT_VAULT_PROFILE)
    );
    const keyCheck = await createVaultCheck(correctKey, DEFAULT_VAULT_PROFILE);

    await expect(verifyVaultKey(correctKey, keyCheck)).resolves.toBe(true);
    await expect(verifyVaultKey(wrongKey, keyCheck)).resolves.toBe(false);
  });
});
