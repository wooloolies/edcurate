import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = await fetch(
    `${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
  );

  if (response.ok) {
    // Redirect to login with success message
    return NextResponse.redirect(
      new URL("/login?verified=true", request.url),
    );
  }

  return NextResponse.redirect(
    new URL("/login?verified=false", request.url),
  );
}
