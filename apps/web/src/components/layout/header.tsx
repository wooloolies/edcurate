"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { hasBackendAccessToken } from "@/lib/auth/auth-client";
import { Link } from "@/lib/i18n/routing";

const NAV_LINKS = [
  { href: "/collections", label: "Classroom" },
  { href: "/library", label: "Library" },
  { href: "/contact", label: "Contact us" },
  { href: "/about", label: "About us" },
] as const;

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(hasBackendAccessToken());
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="absolute inset-x-0 top-0 z-50 pt-8 px-4 md:px-8 flex items-center justify-between">
      {/* Left balance column (desktop only) */}
      <div className="flex-1 hidden md:block" />

      {/* ===== Desktop nav ===== */}
      <nav className="hidden md:flex mx-auto w-fit items-center gap-10 rounded-[2.5rem] bg-white/60 px-10 py-4 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.04)] border border-white/60">
        <Link href="/" className="font-bold text-2xl tracking-tight mr-2">
          <span className="text-blue-600">Ed</span>curate
        </Link>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-base font-medium text-gray-500 hover:text-black transition-colors"
          >
            {link.label}
          </Link>
        ))}
        {isLoggedIn ? (
          <UserMenu />
        ) : (
          <Link
            href="/login"
            className="text-base font-semibold bg-[#B7FF70] text-[#111827] px-7 py-3 rounded-[2rem] hover:bg-[#111827] hover:text-white transition-all ml-2 shadow-sm"
          >
            Sign in
          </Link>
        )}
      </nav>

      {/* ===== Mobile nav ===== */}
      <div className="flex md:hidden items-center justify-between w-full">
        <Link href="/" className="font-bold text-xl tracking-tight">
          Edcurate
        </Link>
        <div className="flex items-center gap-2">
          {isLoggedIn && <UserMenu />}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-brand-ink" />
          </button>
        </div>
      </div>

      {/* Mobile slide-in menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            onKeyDown={() => {}}
            role="presentation"
          />
          {/* Slide-in panel */}
          <div className="absolute right-0 top-0 h-full w-72 bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-white/60 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 pt-8 pb-4">
              <span className="font-bold text-lg tracking-tight text-brand-ink">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-brand-ink" />
              </button>
            </div>
            <nav className="flex flex-col px-4 gap-1 flex-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-[15px] font-medium text-brand-ink/70 hover:bg-brand-green/20 hover:text-brand-ink transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="px-6 pb-8 pt-4 border-t border-gray-100 space-y-3">
              <LanguageSwitcher variant="mobile" />
              {!isLoggedIn && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center text-sm font-semibold bg-brand-green text-brand-ink px-6 py-3 rounded-[2rem] hover:bg-brand-ink hover:text-white transition-all shadow-sm"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right corner: Language Switcher (desktop only) */}
      <div className="flex-1 justify-end hidden md:flex">
        <LanguageSwitcher variant="desktop" />
      </div>
    </header>
  );
}
