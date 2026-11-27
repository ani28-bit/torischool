import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/auth/set-password`);
    }

    console.error("Invitation PKCE verification error:", error.message);
  }

  if (tokenHash && type === "invite") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "invite",
    });

    if (!error) {
      return NextResponse.redirect(`${origin}/auth/set-password`);
    }

    console.error("Invitation OTP verification error:", error.message);
  }

  console.error("Invitation callback parameters:", {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type,
  });

  return NextResponse.redirect(
    `${origin}/login?error=invitation_verification_failed`
  );
}