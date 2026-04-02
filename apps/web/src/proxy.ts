import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = [
  /^\/$/,
  /^\/[a-z]{2}\/?$/,
  /^\/login$/,
  /^\/[a-z]{2}\/login$/,
  /^\/api\/auth\/.*/,
];
const LOCALE_PATTERN = /^\/([a-z]{2})(\/|$)/;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((pattern) => pattern.test(pathname));
}

function getLocaleFromPathname(pathname: string): string {
  const match = pathname.match(LOCALE_PATTERN);
  return match ? match[1] : "en";
}

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  if (!isPublicPath(pathname)) {
    const sessionCookie = request.cookies.get("better-auth.session_token");
    if (!sessionCookie) {
      const locale = getLocaleFromPathname(pathname);
      const validLocales = ["en", "ko", "zh", "th", "vi"];
      const loginLocale = validLocales.includes(locale) ? locale : "en";
      const loginPath = loginLocale === "en" ? "/login" : `/${loginLocale}/login`;
      const loginUrl = new URL(loginPath, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = intlMiddleware(request);
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - api routes
    // - _next (Next.js internals)
    // - _vercel (Vercel internals)
    // - static files (images, fonts, etc.)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
