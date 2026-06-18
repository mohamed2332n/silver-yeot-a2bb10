import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/context/AuthProvider";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ControlsBar() {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const { profile, updateProfile, session } = useAuth();

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    toggleTheme();
    if (session && profile) void updateProfile({ theme: next });
  };

  const handleToggleLang = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    void i18n.changeLanguage(next);
    if (session && profile) void updateProfile({ locale: next });
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleToggleLang}
        className="rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-bold text-text transition hover:bg-surface-2"
        aria-label="toggle language"
      >
        {i18n.language === "ar" ? "EN" : "ع"}
      </button>
      <button
        onClick={handleToggleTheme}
        className="rounded-lg border border-border bg-surface p-2 text-text transition hover:bg-surface-2"
        aria-label="toggle theme"
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}
