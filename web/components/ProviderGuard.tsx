"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { AuthGuard } from "./AuthGuard";

function ProviderCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.has_provider_profile) {
      router.push("/become-provider");
    }
  }, [user, router]);

  if (!user?.has_provider_profile) return null;

  return <>{children}</>;
}

export function ProviderGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ProviderCheck>{children}</ProviderCheck>
    </AuthGuard>
  );
}
