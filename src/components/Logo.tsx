import type { Club } from "@/types";

export function Logo({
  club,
  size = 40,
}: {
  club?: Club | null;
  size?: number;
}) {
  if (club?.logo_url) {
    return (
      <img
        src={club.logo_url}
        alt={club.club_name}
        width={size}
        height={size}
        className="rounded-xl object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = club?.club_name?.trim()?.[0]?.toUpperCase() ?? "G";
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-primary font-bold text-primary-fg"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </div>
  );
}
