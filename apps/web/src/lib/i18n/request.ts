import type { AbstractIntlMessages } from "next-intl";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { libraryRemoveUiByLocale } from "@/lib/i18n/library-remove-ui";
import { routing } from "./routing";

function mergeLibraryRemoveUi(
  messages: AbstractIntlMessages,
  locale: string
): AbstractIntlMessages {
  const ui = libraryRemoveUiByLocale[locale] ?? libraryRemoveUiByLocale.en;
  const lib = messages.library;
  if (!lib || typeof lib !== "object" || Array.isArray(lib)) {
    return messages;
  }
  const library = lib as Record<string, unknown>;
  const rawAction = library.action;
  const action =
    rawAction && typeof rawAction === "object" && !Array.isArray(rawAction)
      ? { ...(rawAction as Record<string, unknown>) }
      : {};
  const rawToast = library.toast;
  const toast =
    rawToast && typeof rawToast === "object" && !Array.isArray(rawToast)
      ? { ...(rawToast as Record<string, unknown>) }
      : {};

  return {
    ...messages,
    library: {
      ...library,
      removeResourceDialogTitle: ui.removeResourceDialogTitle,
      removeResourceDialogDescription: ui.removeResourceDialogDescription,
      removeResourceDialogButton: ui.removeResourceDialogButton,
      removeResourceDialogUntitled: ui.removeResourceDialogUntitled,
      action: {
        ...action,
        removeResource: ui.actionRemoveResource,
      },
      toast: {
        ...toast,
        resourceRemoved: ui.toastResourceRemoved,
      },
    },
  };
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const raw = (await import(`@/config/messages/${locale}.json`)).default as AbstractIntlMessages;

  return {
    locale,
    messages: mergeLibraryRemoveUi(raw, locale),
    timeZone: "Asia/Sydney",
  };
});
