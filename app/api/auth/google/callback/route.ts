import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      console.error("Google OAuth callback: No user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Google OAuth callback: User authenticated successfully", { userId });

    // Redirect to home page after successful Google sign-in
    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("Error in Google OAuth callback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
