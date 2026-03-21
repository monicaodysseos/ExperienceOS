import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // JWT tokens are in localStorage (client-side only).
  // Actual auth protection is handled by AuthGuard/ProviderGuard components.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/bookings/:path*", "/checkout/:path*"],
};
