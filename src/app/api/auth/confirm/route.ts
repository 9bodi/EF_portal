import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash") || request.nextUrl.searchParams.get("token");
  const type = request.nextUrl.searchParams.get("type");
  const redirectTo = request.nextUrl.searchParams.get("redirect_to") || "/reset-password";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
    if (!error) {
      const finalUrl = redirectTo.startsWith("http") ? redirectTo : new URL(redirectTo, request.url).toString();
      return NextResponse.redirect(finalUrl);
    }
    console.error("[CONFIRM] Erreur verification:", error);
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
}
