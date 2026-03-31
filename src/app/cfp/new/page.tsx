"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import CFPForm from "@/components/CFPForm";
import type { CFPFormData } from "@/lib/types";

export default function NewCFPPage() {
  const router = useRouter();

  const handleSubmit = async (form: CFPFormData) => {
    const res = await fetch("/api/cfps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.status === 401) {
      window.location.href = "/api/auth/login";
      return;
    }

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Failed to submit");
    }

    const cfp = await res.json();
    router.push(`/cfp/${cfp.id}`);
  };

  return (
    <>
      <Header />
      <CFPForm
        onSubmit={handleSubmit}
        title="New Submission"
        buttonText="Submit CFP"
      />
    </>
  );
}
