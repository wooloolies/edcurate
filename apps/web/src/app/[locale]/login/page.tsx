"use client";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink } from "@/lib/auth/auth-client";

const RESEND_COOLDOWN = 60;
const emailSchema = z.string().email();

export default function LoginPage() {
  const t = useTranslations("login");
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const form = useForm({
    defaultValues: {
      email: "",
      confirmEmail: "",
    },
    onSubmit: async ({ value }) => {
      const result = await sendMagicLink(value.email);
      if (!result.error) {
        setSentEmail(value.email);
        setSent(true);
        startCooldown();
      }
    },
  });

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>{t("checkEmail")}</CardTitle>
            <CardDescription>{t("checkEmailDescription", { email: sentEmail })}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted-foreground text-center text-sm">{t("checkSpam")}</p>
            <Button
              variant="outline"
              className="w-full"
              disabled={cooldown > 0}
              onClick={async () => {
                const result = await sendMagicLink(sentEmail);
                if (!result.error) {
                  startCooldown();
                }
              }}
            >
              {cooldown > 0 ? t("resendCooldown", { seconds: cooldown }) : t("resend")}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSent(false);
                setSentEmail("");
                form.reset();
              }}
            >
              {t("tryAgain")}
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
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            noValidate
          >
            <div className="flex flex-col gap-4">
              <form.Field
                name="email"
                validators={{
                  onBlur: ({ value }) => {
                    const result = emailSchema.safeParse(value);
                    if (!result.success) {
                      return t("invalidEmail");
                    }
                    return undefined;
                  },
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
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length > 0 ? "email-error" : undefined
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p id="email-error" className="text-destructive text-sm" role="alert">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="confirmEmail"
                validators={{
                  onBlur: ({ value, fieldApi }) => {
                    const email = fieldApi.form.getFieldValue("email");
                    if (value !== email) {
                      return t("emailMismatch");
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirmEmail">{t("confirmEmailLabel")}</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder={t("confirmEmailPlaceholder")}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      autoComplete="email"
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length > 0 ? "confirm-email-error" : undefined
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p id="confirm-email-error" className="text-destructive text-sm" role="alert">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!canSubmit || isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? t("sending") : t("sendMagicLink")}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
