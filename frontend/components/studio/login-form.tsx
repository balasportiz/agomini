"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function safeStudioRedirect(value: string | null): string {
  if (!value || !value.startsWith("/studio") || value.startsWith("//") || value.includes("\\")) {
    return "/studio";
  }
  return value;
}

export function StudioLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeStudioRedirect(searchParams.get("redirect"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setError(response.status === 401 ? "Those details don't match. Please try again." : "Sign in failed. Please try again.");
        return;
      }
      // Full navigation so the server layout re-reads the fresh auth cookie.
      window.location.assign(redirectTo);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <p className="studio-auth__error" role="alert">{error}</p>}
      <div className="studio-field">
        <Label htmlFor="studio-email">Email</Label>
        <Input
          id="studio-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="studio-field">
        <Label htmlFor="studio-password">Password</Label>
        <Input
          id="studio-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full" size="lg">
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
