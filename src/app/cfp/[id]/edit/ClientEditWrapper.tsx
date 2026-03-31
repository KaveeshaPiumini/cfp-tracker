"use client";

import { useRouter } from "next/navigation";
import CFPForm from "@/components/CFPForm";
import type { CFPFormData } from "@/lib/types";

interface ClientEditWrapperProps {
  id: string;
  initialData: CFPFormData;
}

export default function ClientEditWrapper({ id, initialData }: ClientEditWrapperProps) {
  const router = useRouter();

  const handleUpdate = async (form: CFPFormData) => {
    const res = await fetch(`/api/cfps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.status === 401) {
      window.location.href = "/api/auth/login";
      return;
    }

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Failed to update");
    }

    router.push(`/cfp/${id}`);
    router.refresh();
  };

  return (
    <CFPForm
      initialData={initialData}
      onSubmit={handleUpdate}
      title="Edit Submission"
      buttonText="Save Changes"
    />
  );
}
