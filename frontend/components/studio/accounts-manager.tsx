"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createDoc, deleteDoc, updateDoc } from "@/components/studio/studio-api";
import { ROLE_LABELS, ROLE_OPTIONS, type Role } from "@/lib/roles";
import type { StudioAccount } from "@/lib/studio-data";

const ROLE_HELP: Record<Role, string> = {
  admin: "Full control, including managing accounts.",
  editor: "Can edit all website content and settings.",
  "media-manager": "Can manage the photo gallery only.",
};

function RoleSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <select
      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function AccountsManager({ initialAccounts, currentUserId }: { initialAccounts: StudioAccount[]; currentUserId: string }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<StudioAccount[]>(initialAccounts);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", password: "", role: "editor" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudioAccount | null>(null);

  async function handleCreate() {
    if (!draft.email.trim() || !draft.password.trim() || !draft.name.trim()) {
      toast.error("Please fill in name, email and a password.");
      return;
    }
    setSaving(true);
    try {
      const { id } = await createDoc("users", draft);
      setAccounts((prev) => [{ id, name: draft.name, email: draft.email, role: draft.role }, ...prev]);
      toast.success(`Account created for ${draft.email}.`);
      setCreating(false);
      setDraft({ name: "", email: "", password: "", role: "editor" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the account.");
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(account: StudioAccount, role: string) {
    const previous = account.role;
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, role } : a)));
    try {
      await updateDoc("users", account.id, { role });
      toast.success(`${account.email} is now ${ROLE_LABELS[role as Role] ?? role}.`);
    } catch (error) {
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, role: previous } : a)));
      toast.error(error instanceof Error ? error.message : "Could not change the role.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc("users", deleteTarget.id);
      setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast.success(`Removed ${deleteTarget.email}.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this account.");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="studio-content__inner">
      <div className="studio-page-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h2>Accounts</h2>
          <p>People who can sign in and edit the website. Choose what each person is allowed to do.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus /> Add person</Button>
      </div>

      <div className="studio-card">
        <div className="studio-list">
          {accounts.map((account) => {
            const isSelf = account.id === currentUserId;
            return (
              <div className="studio-list__row" key={account.id}>
                <span className="studio-user__avatar" aria-hidden="true">{(account.name || account.email).slice(0, 1).toUpperCase()}</span>
                <div className="studio-list__main">
                  <strong>{account.name || account.email}{isSelf ? " (you)" : ""}</strong>
                  <span>{account.email}</span>
                </div>
                <div style={{ width: "12rem" }} title={ROLE_HELP[account.role as Role]}>
                  <RoleSelect value={account.role} onChange={(v) => changeRole(account, v)} disabled={isSelf} />
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Remove account" disabled={isSelf} onClick={() => setDeleteTarget(account)}>
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="studio-hint" style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <UserCog size={14} /> You can&rsquo;t change your own role or remove yourself, and the last Super Admin can&rsquo;t be removed.
      </p>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add a person</DialogTitle></DialogHeader>
          <div className="studio-dialog-body">
            <div className="studio-field-row"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="studio-field-row"><Label>Email</Label><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
            <div className="studio-field-row"><Label>Temporary password</Label><Input type="text" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder="At least a few characters" /><span className="studio-hint">Share this with them; they can change it later.</span></div>
            <div className="studio-field-row"><Label>Role</Label><RoleSelect value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} /><span className="studio-hint">{ROLE_HELP[draft.role as Role]}</span></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this account?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.email} will no longer be able to sign in. This can&rsquo;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
