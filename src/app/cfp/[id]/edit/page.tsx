import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import CFPForm from "@/components/CFPForm";
import { getSessionUser } from "@/lib/session";
import type { CFP, CFPFormData } from "@/lib/types";

async function getCFP(id: string): Promise<CFP | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/cfps/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function EditCFPPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cfp, user] = await Promise.all([getCFP(id), getSessionUser()]);

  if (!cfp) notFound();
  if (!user || cfp.submitted_by !== user.sub) {
    redirect(`/cfp/${id}`);
  }

  const initialData: CFPFormData = {
    title: cfp.title,
    conference_name: cfp.conference_name,
    description: cfp.description ?? "",
    deadline: cfp.deadline,
    location: cfp.location ?? "",
    is_virtual: cfp.is_virtual,
    url: cfp.url ?? "",
    categories: cfp.categories,
    tags: cfp.tags,
  };

  const handleUpdate = async (form: CFPFormData) => {
    "use server";
    // This is just a placeholder, the actual submission happens on the client side
    // in the CFPForm component via fetch.
  };

  return (
    <>
      <Header />
      {/* We pass a client-side fetch handler to the form */}
      <EditFormWrapper id={id} initialData={initialData} />
    </>
  );
}

// Client wrapper to handle the specific PATCH request
import ClientEditWrapper from "./ClientEditWrapper";
function EditFormWrapper({ id, initialData }: { id: string; initialData: CFPFormData }) {
  return <ClientEditWrapper id={id} initialData={initialData} />;
}
