import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth-server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No valid session" }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/auth/internal-exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.user.email,
        name: session.user.name,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Backend exchange failed" }, { status: response.status });
    }

    const tokens = await response.json();
    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: "Exchange failed" }, { status: 500 });
  }
}
