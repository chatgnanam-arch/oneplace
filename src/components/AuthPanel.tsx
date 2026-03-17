import { type FormEvent, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { IconGlyph } from "./IconGlyph";

type AuthMode = "sign-in" | "sign-up";

export function AuthPanel() {
  const {
    authMessage,
    isConfigured,
    signInWithPassword,
    signUpWithPassword
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (isSignUp) {
      if (password.length < 8) {
        return;
      }

      if (password !== confirmPassword) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithPassword(email, password);
      } else {
        await signInWithPassword(email, password);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const passwordTooShort = isSignUp && password.length > 0 && password.length < 8;
  const passwordMismatch =
    isSignUp &&
    confirmPassword.length > 0 &&
    password.length > 0 &&
    password !== confirmPassword;

  return (
    <section className="auth-card">
      <p className="section-eyebrow">Private workspace</p>
      <h1>Your links, synced to your account.</h1>
      <p className="workspace-page__lede">
        Sign in to keep a personal link library with categories, custom saves,
        and one-click saving from Discover.
      </p>
      <div className="hero__chips" aria-label="Workspace features">
        <span>
          <IconGlyph name="bookmark" />
          Personal categories
        </span>
        <span>
          <IconGlyph name="plus" />
          Custom links
        </span>
        <span>
          <IconGlyph name="lock" />
          Email account access
        </span>
      </div>
      <div className="auth-card__switch" role="tablist" aria-label="Authentication mode">
        <button
          aria-selected={mode === "sign-in"}
          className={mode === "sign-in" ? "button button--primary" : "button button--ghost"}
          role="tab"
          type="button"
          onClick={() => setMode("sign-in")}
        >
          Sign in
        </button>
        <button
          aria-selected={isSignUp}
          className={isSignUp ? "button button--primary" : "button button--ghost"}
          role="tab"
          type="button"
          onClick={() => setMode("sign-up")}
        >
          Create account
        </button>
      </div>
      <form className="auth-card__form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            placeholder="you@example.com"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={isSignUp ? 8 : undefined}
            placeholder={isSignUp ? "At least 8 characters" : "Your password"}
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
        </label>
        {isSignUp ? (
          <label className="field">
            <span>Confirm password</span>
            <input
              autoComplete="new-password"
              minLength={8}
              placeholder="Re-enter your password"
              required
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            />
          </label>
        ) : null}
        {passwordTooShort ? (
          <p className="inline-note">Use at least 8 characters for your password.</p>
        ) : null}
        {passwordMismatch ? (
          <p className="inline-note">The passwords do not match yet.</p>
        ) : null}
        {!isConfigured ? (
          <div className="setup-note">
            <p>Add your Supabase keys to `.env` before using private bookmarks locally.</p>
            <p>`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required.</p>
            <p>Run `npm run db:start` and `npm run db:reset`, then restart `npm run dev`.</p>
          </div>
        ) : null}
        <div className="editor-form__actions">
          <button
            className="button button--primary"
            disabled={
              isSubmitting ||
              !isConfigured ||
              passwordTooShort ||
              passwordMismatch
            }
            type="submit"
          >
            {isSubmitting
              ? "Working..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </div>
      </form>
      {authMessage ? <p className="inline-note">{authMessage}</p> : null}
    </section>
  );
}
