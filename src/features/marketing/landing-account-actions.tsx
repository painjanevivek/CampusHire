"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProfileMenu } from "@/components/layout/profile-menu";
import { ProfilePhotoProvider } from "@/features/profile/profile-photo";
import { apiRequest } from "@/lib/api/client";
import type { UserResponse } from "@/lib/api/generated/types.gen";

type Workspace = "student" | "tnp" | "admin";
type AccountState = "checking" | "guest" | Workspace;

function accountWorkspace(user: UserResponse): Workspace {
  if (user.workspace) return user.workspace;
  if (user.role === "student") return "student";
  return user.role.startsWith("tnp_") ? "tnp" : "admin";
}

const accountDestinations: Record<Workspace, {
  profile: string;
  settings: string;
  signIn: "/sign-in" | "/tnp/sign-in" | "/admin/sign-in";
}> = {
  student: {
    profile: "/profile",
    settings: "/profile#account-settings",
    signIn: "/sign-in",
  },
  tnp: {
    profile: "/tnp/account",
    settings: "/tnp/account#admin-settings-title",
    signIn: "/tnp/sign-in",
  },
  admin: {
    profile: "/admin/account",
    settings: "/admin/account#admin-settings-title",
    signIn: "/admin/sign-in",
  },
};

export function LandingAccountActions({
  createProfileClassName,
  sessionCookiePresent,
}: {
  createProfileClassName: string;
  sessionCookiePresent: boolean;
}) {
  const [account, setAccount] = useState<AccountState>(sessionCookiePresent ? "checking" : "guest");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!sessionCookiePresent) return;
    let active = true;
    void apiRequest<UserResponse>("/auth/me", { signal: AbortSignal.timeout(3_500) })
      .then((user) => {
        if (active) setAccount(accountWorkspace(user));
      })
      .catch(() => {
        if (active) setAccount("guest");
      });
    return () => { active = false; };
  }, [sessionCookiePresent]);

  if (account === "checking") return <span aria-hidden="true" />;
  if (account === "guest") {
    return <>
      <Link href="/sign-in">Sign in</Link>
      <Link className={createProfileClassName} href="/sign-up?from=/">Create profile</Link>
    </>;
  }

  const destination = accountDestinations[account];
  return (
    <ProfilePhotoProvider>
      <ProfileMenu
        open={menuOpen}
        onChange={setMenuOpen}
        profileHref={destination.profile}
        settingsHref={destination.settings}
        signOutDestination={destination.signIn}
      />
    </ProfilePhotoProvider>
  );
}
