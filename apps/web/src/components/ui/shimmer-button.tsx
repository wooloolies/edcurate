"use client";

import { type ComponentPropsWithoutRef, type ReactNode, useEffect, useState } from "react";
import { Link } from "@/lib/i18n/routing";
import { hasBackendAccessToken } from "@/lib/auth/auth-client";

interface ShimmerLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  shimmerColor?: string;
  authRequired?: boolean;
  children: ReactNode;
}

function ShimmerLink({
  children,
  className = "",
  shimmerColor = "#B7FF70",
  authRequired = false,
  href,
  ...props
}: ShimmerLinkProps) {
  const [resolvedHref, setResolvedHref] = useState(href);

  useEffect(() => {
    if (authRequired && !hasBackendAccessToken()) {
      setResolvedHref(`/login?redirect=${encodeURIComponent(String(href))}`);
    }
  }, [authRequired, href]);

  return (
    <Link
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-[2.5rem] p-[2px] shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_32px_rgba(183,255,112,0.3)] ${className}`}
      href={resolvedHref}
      {...props}
    >
      {/* Rotating shimmer — oversized square centered on the button */}
      <span
        className="absolute top-1/2 left-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 animate-[shimmer-spin_3s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg, transparent 60%, ${shimmerColor} 78%, ${shimmerColor}bb 80%, ${shimmerColor} 82%, transparent 100%)`,
        }}
      />
      {/* Static faint border behind the shimmer for always-visible outline */}
      <span
        className="absolute inset-0 rounded-[2.5rem]"
        style={{
          background: `linear-gradient(135deg, ${shimmerColor}33, transparent 50%, ${shimmerColor}33)`,
        }}
      />
      {/* Inner pill that masks everything except the 2px border */}
      <span className="relative z-10 flex items-center justify-center rounded-[calc(2.5rem-2px)] bg-[#F8F9FA] px-10 py-5 transition-colors duration-300 group-hover:bg-[#111827]">
        <span className="text-lg font-semibold text-[#111827] transition-colors duration-300 group-hover:text-white">
          {children}
        </span>
      </span>
    </Link>
  );
}

export { ShimmerLink };
