"use client";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetCurrentUserProfileApiUsersMeGet } from "@/lib/api/users/users";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { data: user, isLoading } = useGetCurrentUserProfileApiUsersMeGet({
    query: { staleTime: 1000 * 60 * 30 },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t("title")}...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <Card>
        <CardHeader className="items-center">
          <Avatar size="lg" className="size-20">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4 text-xl">{user.name ?? user.email}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("email")}</span>
            <span className="text-sm">{user.email}</span>
          </div>
          {user.name && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("name")}</span>
              <span className="text-sm">{user.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {user.email_verified ? t("emailVerified") : t("emailNotVerified")}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                user.email_verified
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              }`}
            >
              {user.email_verified ? "\u2713" : "\u2717"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("memberSince")}</span>
            <span className="text-sm">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
