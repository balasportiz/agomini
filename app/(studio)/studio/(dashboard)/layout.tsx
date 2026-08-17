import type { ReactNode } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { visibleNav } from "@/lib/studio-nav";

export const dynamic = "force-dynamic";

export default async function StudioDashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await requireStudioUser();
  const caps = getStudioCapabilities(user);
  const nav = visibleNav(caps);
  const roleLabel = ROLE_LABELS[(user.role as Role) ?? "editor"] ?? "Team member";

  return (
    <StudioShell
      user={{ name: user.name ?? "", email: user.email ?? "", roleLabel }}
      nav={nav}
    >
      {children}
    </StudioShell>
  );
}
