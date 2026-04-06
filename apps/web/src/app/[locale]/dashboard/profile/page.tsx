"use client";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth/auth-client";

function getInitials(name: string | undefined | null): string {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const t = useTranslations("profile");

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{t("title")}...</p>
      </div>
    );
  }

  if (!session?.user) return null;

  const { user } = session;

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <Card>
        <CardHeader className="items-center">
          <Avatar size="lg">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4">{user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("nameLabel")}</p>
            <p className="text-sm">{user.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("emailLabel")}</p>
            <p className="text-sm">{user.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
