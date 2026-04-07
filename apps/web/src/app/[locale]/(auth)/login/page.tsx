"use client";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { setAccessToken, setRefreshToken } from "@/lib/auth/token";
import { useRouter, Link } from "@/lib/i18n/routing";

const emailSchema = z.string().email();

type TokenResponse = {
  access_token: string;
  refresh_token: string;
};

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [redirectUrl] = useQueryState("redirect", parseAsString.withDefault("/dashboard"));
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  const form = useForm({
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
        router.push(redirectUrl);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          setPendingEmail(value.email);
          setShowVerify(true);
        } else {
          setError(t("invalidCredentials"));
        }
      }
    },
  });

  if (showVerify) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-bold text-[#111827] tracking-tight mb-3">
            {t("verifyEmail")}
          </h1>
          <p className="text-[#111827]/60 text-[15px] leading-relaxed">
            {t("verifyEmailDescription", { email: pendingEmail })}
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <p className="text-muted-foreground text-center text-sm">{t("checkSpam")}</p>
          {resendMessage && (
            <p className="text-center text-sm text-green-600 font-medium">{resendMessage}</p>
          )}
          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <Button
            type="button"
            className="w-full bg-[#111827] text-white hover:bg-[#111827]/90 py-6 rounded-xl font-semibold shadow-lg text-base"
            disabled={isResending || !pendingEmail}
            onClick={async () => {
              setError("");
              setResendMessage("");
              setIsResending(true);
              try {
                const { data } = await apiClient.post<{ message: string }>(
                  "/api/auth/resend-verification",
                  { email: pendingEmail },
                );
                setResendMessage(data.message);
              } catch (err: unknown) {
                const msg =
                  (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
                  t("invalidCredentials");
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
            className="w-full py-6 rounded-xl font-semibold"
            onClick={() => {
              setShowVerify(false);
              setError("");
              setResendMessage("");
            }}
          >
            {t("backToSignIn")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#111827] tracking-tight mb-4">
          {t("signInTitle")}
        </h1>
        <p className="text-[#111827]/70 text-[15px] leading-relaxed pr-4">
          {t("featureDescription")}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        noValidate
        className="space-y-5"
      >
        <form.Field
          name="email"
          validators={{
            onBlur: ({ value }) =>
              emailSchema.safeParse(value).success ? undefined : t("invalidEmail"),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label className="text-[13px] font-bold text-[#111827]">{t("emailLabel")}</Label>
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                autoFocus
                autoComplete="email"
                className="bg-white border-2 border-gray-100 px-4 py-6 rounded-xl hover:border-gray-200 focus:border-[#111827] transition-colors text-sm shadow-sm"
              />
              <div className={`grid transition-[grid-template-rows] duration-200 ${field.state.meta.errors.length > 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <p className="text-destructive text-sm font-medium overflow-hidden">
                  {field.state.meta.errors[0]}
                </p>
              </div>
            </div>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onBlur: ({ value }) => (value ? undefined : t("passwordRequired")),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label className="text-[13px] font-bold text-[#111827]">{t("passwordLabel")}</Label>
              <Input
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                autoComplete="current-password"
                className="bg-white border-2 border-gray-100 px-4 py-6 rounded-xl hover:border-gray-200 focus:border-[#111827] transition-colors text-sm shadow-sm"
              />
              <div className={`grid transition-[grid-template-rows] duration-200 ${field.state.meta.errors.length > 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <p className="text-destructive text-sm font-medium overflow-hidden">
                  {field.state.meta.errors[0]}
                </p>
              </div>
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              className="w-full mt-2 bg-[#09090b] text-white hover:bg-[#111827] py-6 rounded-xl font-bold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? t("submitting") : t("signInButton")}
            </Button>
          )}
        </form.Subscribe>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
          {t("orContinueWith")}
        </span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <button
          type="button"
          className="flex items-center justify-center py-4 border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
        >
          <span className="font-bold text-gray-800 text-xl leading-none">G</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center py-4 border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
        >
          <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </button>
        <button
          type="button"
          className="flex items-center justify-center py-4 border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
        >
          <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-1.954.04-3.766 1.144-4.773 2.913-2.046 3.585-.523 8.913 1.47 11.83 1.002 1.442 2.146 3.067 3.65 3.013 1.441-.054 2.012-.93 3.738-.93 1.727 0 2.224.93 3.738.894 1.559-.04 2.53-1.488 3.513-2.946 1.144-1.685 1.615-3.322 1.638-3.411-.035-.015-3.18-1.22-3.216-4.854-.035-3.045 2.493-4.524 2.607-4.595-1.428-2.097-3.626-2.366-4.417-2.417-1.931-.157-3.914 1.157-4.988 1.157v.386zm1.758-2.585c.813-.984 1.36-2.35 1.21-3.715-1.173.047-2.6.78-3.447 1.776-.718.84-1.34 2.23-1.157 3.568 1.312.102 2.576-.641 3.394-1.629z" />
          </svg>
        </button>
      </div>

      {/* Link to register */}
      <div className="text-center text-[14px] font-medium text-gray-500">
        <p>
          {t("noAccount")}{" "}
          <Link href="/register" className="text-[#FF5722] hover:underline font-bold">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
