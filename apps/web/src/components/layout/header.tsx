"use client";

import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { Link } from "@/lib/i18n/routing";
import { hasBackendAccessToken } from "@/lib/auth/auth-client";

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(hasBackendAccessToken());
  }, []);

  return (
    <header className="absolute inset-x-0 top-0 z-50 pt-8 px-8 flex items-center justify-between">
      {/* Left balance column */}
      <div className="flex-1" />

      {/* Center aligned transparent glass nav */}
      <nav className="mx-auto flex w-fit items-center gap-8 rounded-[2.5rem] bg-white/60 px-8 py-3 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.04)] border border-white/60">
        <Link href="/" className="font-bold text-xl tracking-tight mr-2">Edcurate</Link>
        <Link href="/about" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">About us</Link>
        <Link href="/collections" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Your collection</Link>
        <Link href="/contact" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Contact us</Link>
        {isLoggedIn ? (
          <UserMenu />
        ) : (
          <Link href="/login" className="text-sm font-semibold bg-[#B7FF70] text-[#111827] px-6 py-2.5 rounded-[2rem] hover:bg-[#111827] hover:text-white transition-all ml-2 shadow-sm">Sign in</Link>
        )}
      </nav>

      {/* Right corner: Language Switcher */}
      <div className="flex-1 flex justify-end">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
