"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StudentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/datasets");
  }, [router]);

  return null;
}
