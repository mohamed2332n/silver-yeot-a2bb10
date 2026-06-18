import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { ControlsBar } from "@/components/ControlsBar";
import { Spinner } from "@/components/ui/Spinner";
import type { UserRole } from "@/types";

type Mode = "signin" | "signup";

export function AuthPage() {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<UserRole>("trainee");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubName, setClubName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "signup" && password.length < 6) {
      setError(t("auth.minPassword"));
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        const res = await signUp({
          fullName,
          email,
          password,
          role,
          clubName: role === "coach" ? clubName || fullName : undefined,
          joinCode: role === "trainee" ? joinCode : undefined,
        });
        if (res.needsConfirmation) {
          setInfo(t("auth.signInTitle"));
          setMode("signin");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (mode === "signin") {
        setError(t("auth.invalidCredentials"));
      } else {
        setError(message || t("auth.signupError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-fg">
            G
          </div>
          <span className="text-lg font-bold text-text">{t("common.appName")}</span>
        </div>
        <ControlsBar />
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="card w-full max-w-md p-6">
          <h1 className="mb-1 text-2xl font-bold text-text">
            {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
          </h1>
          <p className="mb-6 text-sm text-muted">{t("common.appName")}</p>

          {info && (
            <div className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
              {info}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="label">{t("auth.accountType")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["trainee", "coach"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        role === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-bg text-muted hover:bg-surface-2"
                      }`}
                    >
                      {t(`auth.${r}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="label" htmlFor="fullName">
                  {t("auth.fullName")}
                </label>
                <input
                  id="fullName"
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                {t("auth.email")}
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                {t("auth.password")}
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            {mode === "signup" && role === "coach" && (
              <div>
                <label className="label" htmlFor="clubName">
                  {t("auth.clubName")}
                </label>
                <input
                  id="clubName"
                  className="input"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder={fullName}
                />
              </div>
            )}

            {mode === "signup" && role === "trainee" && (
              <div>
                <label className="label" htmlFor="joinCode">
                  {t("auth.joinCode")} <span className="text-muted">({t("common.optional")})</span>
                </label>
                <input
                  id="joinCode"
                  className="input uppercase"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  dir="ltr"
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-muted">{t("auth.joinCodeHint")}</p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner /> : mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted">
            {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <button
              className="font-semibold text-primary hover:underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
            >
              {mode === "signin" ? t("auth.signUp") : t("auth.signIn")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
