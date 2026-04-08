"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetCurrentUserProfileApiUsersMeGet } from "@/lib/api/users/users";
import { hasBackendAccessToken, signOutAndClearBackendTokens } from "@/lib/auth/auth-client";
import { useRouter } from "@/lib/i18n/routing";

const WHITESPACE_RE = /\s+/;

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(WHITESPACE_RE);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("userMenu");
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(hasBackendAccessToken());
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useGetCurrentUserProfileApiUsersMeGet({
    query: { enabled: hasToken, staleTime: 1000 * 60 * 30 },
  });

  if (isLoading && hasToken) {
    return <span className="size-10 animate-pulse rounded-full bg-muted" />;
  }

  if (error) {
    console.error("[UserMenu] API error:", error);
  }

  if (!user) return null;

  async function handleLogout() {
    await signOutAndClearBackendTokens();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={user.name ?? t("profile")}
          className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar size="lg" className="ring-2 ring-slate-200 shadow-sm">
            {user.image ? <AvatarImage src={user.image} alt={user.name ?? ""} /> : null}
            <AvatarFallback className="text-base font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/profile")}>{t("profile")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>{t("logout")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
