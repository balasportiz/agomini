import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { StudioLoginForm } from "@/components/studio/login-form";
import { getStudioUser } from "@/lib/studio-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default async function StudioLoginPage() {
  const user = await getStudioUser();
  if (user) redirect("/studio");

  return (
    <main className="studio-auth">
      <section className="studio-auth__stage" aria-hidden="true">
        <div className="studio-auth__route">
          <span>Barasat Runners</span>
          <i />
          <span>Live website</span>
        </div>
        <div className="studio-auth__stage-copy">
          <span className="studio-auth__stage-mark">অ</span>
          <p>Agomoni Run / Studio</p>
          <div className="studio-auth__statement">Move the story.<br /><strong>Keep it live.</strong></div>
        </div>
        <div className="studio-auth__stage-foot">
          <span>Race control</span>
          <span>Content operations</span>
        </div>
      </section>
      <section className="studio-auth__card">
        <div className="studio-auth__brand">
          <span className="studio-auth__brand-mark" aria-hidden="true">অ</span>
          <span className="studio-auth__brand-text">
            <strong>Agomoni Studio</strong>
            <span>Race control</span>
          </span>
        </div>
        <h1>Enter the Studio</h1>
        <p className="studio-auth__lead">Sign in to manage the live Agomoni Run website.</p>
        <Suspense fallback={null}>
          <StudioLoginForm />
        </Suspense>
      </section>
    </main>
  );
}
