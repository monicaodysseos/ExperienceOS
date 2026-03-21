"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripeRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/provider/stripe?refresh=true");
  }, [router]);

  return null;
}
