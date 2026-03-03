import { useState, type FormEvent } from "react";
import { signIn, signOut, confirmSignIn } from "aws-amplify/auth";
import "../styles/hud.css";

interface LoginPageProps {
  onLogin: () => void;
}

type Step = "login" | "new-password";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [step, setStep] = useState<Step>("login");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // New-password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 1: initial sign-in ──────────────────────────────────────────
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Clear any stale / partial session before signing in
      await signOut().catch(() => {});

      const { isSignedIn, nextStep } = await signIn({ username: email, password });

      if (isSignedIn) {
        onLogin();
      } else if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setStep("new-password");
      } else {
        setError(`SYSTEM: Unexpected step — ${nextStep.signInStep}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(`SYSTEM: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: confirm new password ─────────────────────────────────────
  const handleNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("SYSTEM: Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("SYSTEM: Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { isSignedIn } = await confirmSignIn({ challengeResponse: newPassword });
      if (isSignedIn) onLogin();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set password.";
      setError(`SYSTEM: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="hud-login-root">
      <div className="hud-login-grid" aria-hidden />

      <div className="hud-login-card">
        <div className="hud-login-brand">Solo Leveling</div>

        {step === "login" ? (
          <>
            <form onSubmit={handleLogin} noValidate>
              <div className="hud-field">
                <label className="hud-label" htmlFor="email">USER ID</label>
                <input
                  id="email"
                  type="email"
                  className="hud-input"
                  placeholder="user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>

              <div className="hud-field">
                <label className="hud-label" htmlFor="password">ACCESS KEY</label>
                <div className="hud-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="hud-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="hud-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="hud-login-error" role="alert">{error}</p>}

              <button type="submit" className="hud-btn hud-btn-block" disabled={loading}>
                {loading ? "AUTHENTICATING…" : "▶ ACCESS SYSTEM"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="hud-login-subtitle">SET NEW PASSWORD</p>
            <p className="hud-login-hint" style={{ marginTop: 0, marginBottom: 24, opacity: 0.7 }}>
              A new password is required for your account.
            </p>
            <form onSubmit={handleNewPassword} noValidate>
              <div className="hud-field">
                <label className="hud-label" htmlFor="new-password">NEW PASSWORD</label>
                <div className="hud-input-wrap">
                  <input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    className="hud-input"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="hud-eye-btn"
                    onClick={() => setShowNew((v) => !v)}
                    tabIndex={-1}
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="hud-field">
                <label className="hud-label" htmlFor="confirm-password">CONFIRM PASSWORD</label>
                <div className="hud-input-wrap">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    className="hud-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="hud-eye-btn"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="hud-login-error" role="alert">{error}</p>}

              <button type="submit" className="hud-btn hud-btn-block" disabled={loading}>
                {loading ? "UPDATING…" : "▶ CONFIRM PASSWORD"}
              </button>
            </form>
          </>
        )}

        <p className="hud-login-hint">Developed by dark.alchemist</p>
      </div>
    </div>
  );
}

