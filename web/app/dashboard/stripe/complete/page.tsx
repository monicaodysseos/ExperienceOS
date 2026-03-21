"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripeCompletePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/provider/stripe?complete=true");
  }, [router]);

  return null;
}
