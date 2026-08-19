import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionEditor, type StudioFieldDef } from "@/components/studio/collection-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadCollectionRows } from "@/lib/studio-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "FAQs" };

const fields: StudioFieldDef[] = [
  { name: "question", label: "Question", type: "text", required: true, placeholder: "e.g. How do I register?" },
  { name: "answer", label: "Answer", type: "textarea", required: true },
  { name: "active", label: "Show on website", type: "toggle", help: "Only shown publicly when on." },
];

export default async function StudioFaqsPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();
  const rows = await loadCollectionRows("faqs");

  return (
    <CollectionEditor
      collection="faqs"
      singular="FAQ"
      plural="FAQs"
      description="Questions and answers shown in the homepage FAQ section."
      titleField="question"
      fields={fields}
      defaults={{ question: "", answer: "", active: true }}
      initialRows={rows}
      mediaOptions={[]}
      orderable
    />
  );
}
