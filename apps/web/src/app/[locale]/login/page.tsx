"use client";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { setAccessToken, setRefreshToken } from "@/lib/auth/token";
import { useRouter } from "@/lib/i18n/routing";

const emailSchema = z.string().email();

type Mode = "signIn" | "signUp" | "verifyEmail";

type RegisterResponse = {
  access_token?: string;
  refresh_token?: string;
  requires_verification: boolean;
  message: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
};

type MessageResponse = {
  message: string;
};

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  const signInForm = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setError("");
      setResendMessage("");
      try {
        const { data } = await apiClient.post<TokenResponse>("/api/auth/email-login", {
          email: value.email,
          password: value.password,
        });
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        router.push("/dashboard");
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          setPendingEmail(value.email);
          setMode("verifyEmail");
        } else {
          setError(t("invalidCredentials"));
        }
      }
    },
  });

  const signUpForm = useForm({
    defaultValues: { name: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      setError("");
      setResendMessage("");
      try {
        const { data } = await apiClient.post<RegisterResponse>("/api/auth/register", {
          email: value.email,
          password: value.password,
          name: value.name,
        });
        if (data.requires_verification) {
          setPendingEmail(value.email);
          setMode("verifyEmail");
          return;
        }
        if (data.access_token) setAccessToken(data.access_token);
        if (data.refresh_token) setRefreshToken(data.refresh_token);
        router.push("/dashboard");
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          t("invalidCredentials");
        setError(msg);
      }
    },
  });

  if (mode === "verifyEmail") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>{t("verifyEmail")}</CardTitle>
            <CardDescription>
              {t("verifyEmailDescription", { email: pendingEmail })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted-foreground text-center text-sm">{t("checkSpam")}</p>
            {resendMessage ? (
              <p className="text-center text-sm" role="status">
                {resendMessage}
              </p>
            ) : null}
            <Button
              variant="outline"
              className="w-full"
              disabled={isResending || !pendingEmail}
              onClick={async () => {
                setError("");
                setResendMessage("");
                setIsResending(true);
                try {
                  const { data } = await apiClient.post<MessageResponse>(
                    "/api/auth/resend-verification",
                    { email: pendingEmail }
                  );
                  setResendMessage(data.message);
                } catch (err: unknown) {
                  const msg =
                    (err as { response?: { data?: { detail?: string } } })?.response?.data
                      ?.detail ?? t("invalidCredentials");
                  setError(msg);
                } finally {
                  setIsResending(false);
                }
              }}
            >
              {isResending ? t("submitting") : t("resendVerification")}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode("signIn");
                setError("");
                setResendMessage("");
              }}
            >
              {t("backToSignIn")}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{mode === "signIn" ? t("signInTitle") : t("signUpTitle")}</CardTitle>
          <CardDescription>
            {mode === "signIn" ? t("signInSubtitle") : t("signUpSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 text-center text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          {mode === "signIn" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                signInForm.handleSubmit();
              }}
              noValidate
            >
              <div className="flex flex-col gap-4">
                <signInForm.Field
                  name="email"
                  validators={{
                    onBlur: ({ value }) =>
                      emailSchema.safeParse(value).success ? undefined : t("invalidEmail"),
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="email">{t("emailLabel")}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        autoComplete="email"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </signInForm.Field>

                <signInForm.Field
                  name="password"
                  validators={{
                    onBlur: ({ value }) => (value ? undefined : t("passwordRequired")),
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="password">{t("passwordLabel")}</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={t("passwordPlaceholder")}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        autoComplete="current-password"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </signInForm.Field>

                <signInForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? t("submitting") : t("signInButton")}
                    </Button>
                  )}
                </signInForm.Subscribe>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                signUpForm.handleSubmit();
              }}
              noValidate
            >
              <div className="flex flex-col gap-4">
                <signUpForm.Field
                  name="name"
                  validators={{
                    onBlur: ({ value }) => (value.trim() ? undefined : t("nameRequired")),
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="name">{t("nameLabel")}</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={t("namePlaceholder")}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        autoComplete="name"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </signUpForm.Field>

                <signUpForm.Field
                  name="email"
                  validators={{
                    onBlur: ({ value }) =>
                      emailSchema.safeParse(value).success ? undefined : t("invalidEmail"),
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="signup-email">{t("emailLabel")}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        autoComplete="email"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </signUpForm.Field>

                <signUpForm.Field
                  name="password"
                  validators={{
                    onBlur: ({ value }) => (value ? undefined : t("passwordRequired")),
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="signup-password">{t("passwordLabel")}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder={t("passwordPlaceholder")}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        autoComplete="new-password"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </signUpForm.Field>

                <signUpForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? t("submitting") : t("signUpButton")}
                    </Button>
                  )}
                </signUpForm.Subscribe>
              </div>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            {mode === "signIn" ? (
              <p>
                {t("noAccount")}{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("signUp");
                    setError("");
                  }}
                >
                  {t("signUp")}
                </button>
              </p>
            ) : (
              <p>
                {t("hasAccount")}{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("signIn");
                    setError("");
                  }}
                >
                  {t("signIn")}
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
