import type { PropsWithChildren } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { useEncryption } from "../features/encryption/EncryptionProvider";
import { IconGlyph } from "./IconGlyph";

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const { isAuthenticated, isConfigured, signOut, user } = useAuth();
  const { isEnabled, isLoading: isVaultLoading, isUnlocked, lockVault } = useEncryption();
  const isWorkspaceRoute = location.pathname.startsWith("/my-links");

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--left" />
      <div className="app-shell__glow app-shell__glow--right" />
      <header className="topbar">
        <NavLink className="brand-mark" to="/">
          <span className="brand-mark__icon">
            <IconGlyph name="layers" />
          </span>
          <span>
            <strong>OnePlace</strong>
            <small>Bookmarks without the browser clutter</small>
          </span>
        </NavLink>
        <nav aria-label="Primary" className="topbar__nav">
          <NavLink
            className={({ isActive }) =>
              isActive && !isWorkspaceRoute ? "topbar__link is-active" : "topbar__link"
            }
            to="/"
          >
            Discover
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "topbar__link is-active" : "topbar__link"
            }
            to="/my-links"
          >
            My Links
          </NavLink>
        </nav>
        <div className="topbar__actions">
          {isAuthenticated && user ? (
            <>
              {isConfigured && !isVaultLoading ? (
                <span className="user-pill">
                  <IconGlyph name="lock" />
                  {isEnabled ? (isUnlocked ? "Vault unlocked" : "Vault locked") : "Set up vault"}
                </span>
              ) : null}
              <span className="user-pill">
                <IconGlyph name="mail" />
                {user.email}
              </span>
              {isUnlocked ? (
                <button className="button button--ghost" type="button" onClick={lockVault}>
                  Lock vault
                </button>
              ) : null}
              <button className="button button--ghost" type="button" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink className="button button--primary" to="/my-links">
              Sign in
            </NavLink>
          )}
        </div>
      </header>
      {!isConfigured ? (
        <div className="status-banner">
          <IconGlyph name="lock" />
          <p>
            Private bookmarks are ready once local Supabase keys are configured.
            Public discovery stays available either way.
          </p>
        </div>
      ) : null}
      {children}
    </div>
  );
}
