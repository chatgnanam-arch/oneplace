import { type FormEvent, useState } from "react";
import type { VaultSecurityProfile } from "../types/bookmarks";
import { useEncryption } from "../features/encryption/EncryptionProvider";
import {
  DEFAULT_VAULT_PROFILE,
  VAULT_SECURITY_PROFILES
} from "../features/encryption/crypto";
import { IconGlyph } from "./IconGlyph";

export function VaultPanel() {
  const {
    error,
    isEnabled,
    isLoading,
    setupVault,
    unlockVault
  } = useEncryption();
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [profile, setProfile] = useState<VaultSecurityProfile>(DEFAULT_VAULT_PROFILE);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSetupMode = !isEnabled;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (isSetupMode && passphrase !== confirmPassphrase) {
      setNotice("The vault passphrases do not match yet.");
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      if (isSetupMode) {
        await setupVault(passphrase, profile);
        setNotice("Vault ready. New saves will use the enhanced local encryption profile.");
      } else {
        await unlockVault(passphrase);
        setNotice("Vault unlocked.");
      }
    } catch (caughtError) {
      setNotice(caughtError instanceof Error ? caughtError.message : "Unable to open the vault.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="auth-card">
        <p className="section-eyebrow">Vault</p>
        <h1>Preparing your encrypted vault.</h1>
      </section>
    );
  }

  return (
    <section className="auth-card">
      <p className="section-eyebrow">Encrypted vault</p>
      <h1>{isSetupMode ? "Create your private vault." : "Unlock your private vault."}</h1>
      <p className="workspace-page__lede">
        OnePlace encrypts saved bookmark details in the browser before they are
        written to the database, then decrypts them locally after retrieval.
      </p>
      <div className="hero__chips" aria-label="Vault details">
        <span>
          <IconGlyph name="lock" />
          AES-GCM encryption
        </span>
        <span>
          <IconGlyph name="mail" />
          Separate from account login
        </span>
        <span>
          <IconGlyph name="bookmark" />
          Needed to read saved links
        </span>
      </div>
      <form className="auth-card__form" onSubmit={(event) => void handleSubmit(event)}>
        {isSetupMode ? (
          <label className="field">
            <span>Security profile</span>
            <select
              value={profile}
              onChange={(event) =>
                setProfile(event.currentTarget.value as VaultSecurityProfile)
              }
            >
              {Object.entries(VAULT_SECURITY_PROFILES).map(([value, option]) => (
                <option key={value} value={value}>
                  {option.label}
                  {value === DEFAULT_VAULT_PROFILE ? " (Recommended)" : ""}
                </option>
              ))}
            </select>
            <small className="field__hint">
              {VAULT_SECURITY_PROFILES[profile].description}
            </small>
          </label>
        ) : null}
        <label className="field">
          <span>{isSetupMode ? "Vault passphrase" : "Enter vault passphrase"}</span>
          <input
            autoComplete={isSetupMode ? "new-password" : "current-password"}
            minLength={10}
            placeholder="At least 10 characters"
            required
            type="password"
            value={passphrase}
            onChange={(event) => setPassphrase(event.currentTarget.value)}
          />
        </label>
        {isSetupMode ? (
          <label className="field">
            <span>Confirm vault passphrase</span>
            <input
              autoComplete="new-password"
              minLength={10}
              placeholder="Re-enter the same passphrase"
              required
              type="password"
              value={confirmPassphrase}
              onChange={(event) => setConfirmPassphrase(event.currentTarget.value)}
            />
          </label>
        ) : null}
        <div className="editor-form__actions">
          <button className="button button--primary" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Working..."
              : isSetupMode
                ? "Enable encryption"
                : "Unlock vault"}
          </button>
        </div>
      </form>
      {notice ? <p className="inline-note">{notice}</p> : null}
      {error ? <p className="inline-note">{error}</p> : null}
    </section>
  );
}
