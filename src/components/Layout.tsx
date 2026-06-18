import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { ControlsBar } from "@/components/ControlsBar";
import { Logo } from "@/components/Logo";
import {
  ChartIcon,
  CalendarIcon,
  DumbbellIcon,
  HomeIcon,
  LogoutIcon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/icons";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

export function Layout({ role }: { role: "coach" | "trainee" }) {
  const { t } = useTranslation();
  const { profile, club, signOut } = useAuth();

  const coachNav: NavItem[] = [
    { to: "/", label: t("nav.dashboard"), icon: <HomeIcon /> },
    { to: "/library", label: t("nav.library"), icon: <DumbbellIcon /> },
    { to: "/programs", label: t("nav.programs"), icon: <CalendarIcon /> },
    { to: "/trainees", label: t("nav.trainees"), icon: <UsersIcon /> },
    { to: "/reports", label: t("nav.reports"), icon: <ChartIcon /> },
    { to: "/settings", label: t("nav.settings"), icon: <SettingsIcon /> },
  ];

  const traineeNav: NavItem[] = [
    { to: "/", label: t("nav.home"), icon: <HomeIcon /> },
    { to: "/assistant", label: t("nav.assistant"), icon: <SparklesIcon /> },
    { to: "/progress", label: t("nav.progress"), icon: <ChartIcon /> },
  ];

  const nav = role === "coach" ? coachNav : traineeNav;

  return (
    <div className="min-h-screen bg-bg lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-border bg-surface p-4 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <Logo club={club} size={40} />
          <div className="min-w-0">
            <p className="truncate font-bold text-text">{club?.club_name ?? t("common.appName")}</p>
            <p className="truncate text-xs text-muted">{t(`auth.${role}`)}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-surface-2 hover:text-text"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => void signOut()}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-danger"
        >
          <LogoutIcon />
          {t("auth.signOut")}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo club={club} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text">
                {profile?.full_name ?? t("common.appName")}
              </p>
              <p className="truncate text-xs text-muted">{club?.club_name}</p>
            </div>
          </div>
          <div className="hidden text-sm font-semibold text-text lg:block">
            {profile?.full_name}
          </div>
          <div className="flex items-center gap-2">
            <ControlsBar />
            <button
              onClick={() => void signOut()}
              className="rounded-lg border border-border bg-surface p-2 text-muted transition hover:text-danger lg:hidden"
              aria-label="sign out"
            >
              <LogoutIcon />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 lg:px-6 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-surface/95 px-2 py-1.5 backdrop-blur lg:hidden">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition ${
                isActive ? "text-primary" : "text-muted"
              }`
            }
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
