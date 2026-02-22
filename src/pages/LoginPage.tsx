import { useState, type FormEvent } from "react";
import { signIn, confirmSignIn } from "aws-amplify/auth";
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

  // ── Step 1: initial sign-in ──────────────────────────────────────────
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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
            <p className="hud-login-subtitle">SYSTEM AUTHENTICATION REQUIRED</p>
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
                <input
                  id="password"
                  type="password"
                  className="hud-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
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
                <input
                  id="new-password"
                  type="password"
                  className="hud-input"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
              </div>

              <div className="hud-field">
                <label className="hud-label" htmlFor="confirm-password">CONFIRM PASSWORD</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="hud-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
              </div>

              {error && <p className="hud-login-error" role="alert">{error}</p>}

              <button type="submit" className="hud-btn hud-btn-block" disabled={loading}>
                {loading ? "UPDATING…" : "▶ CONFIRM PASSWORD"}
              </button>
            </form>
          </>
        )}

        <p className="hud-login-hint">Powered by AWS Cognito</p>
      </div>
    </div>
  );
}

