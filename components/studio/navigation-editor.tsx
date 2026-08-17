"use client";

import { ChevronDown, ChevronUp, Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveBar } from "@/components/studio/save-bar";
import { useStudioForm } from "@/components/studio/use-studio-form";
import { updateGlobal } from "@/components/studio/studio-api";

type Link = { label: string; href: string };
type Values = { headerLinks: Link[]; footerLinks: Link[] };

export function NavigationEditor({ initial }: { initial: Values }) {
  const { values, setValue, dirty, saving, save } = useStudioForm<Values>({
    headerLinks: initial.headerLinks.length ? initial.headerLinks : [{ label: "", href: "" }],
    footerLinks: initial.footerLinks.length ? initial.footerLinks : [{ label: "", href: "" }],
  });

  function update(key: keyof Values, index: number, patch: Partial<Link>) {
    const next = values[key].map((link, i) => (i === index ? { ...link, ...patch } : link));
    setValue(key, next);
  }
  function add(key: keyof Values) {
    setValue(key, [...values[key], { label: "", href: "" }]);
  }
  function remove(key: keyof Values, index: number) {
    setValue(key, values[key].filter((_, i) => i !== index));
  }
  function move(key: keyof Values, index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= values[key].length) return;
    const next = [...values[key]];
    [next[index], next[target]] = [next[target], next[index]];
    setValue(key, next);
  }

  async function handleSave() {
    const clean = (links: Link[]) => links.filter((l) => l.label.trim() && l.href.trim());
    await save(() => updateGlobal("navigation", { headerLinks: clean(values.headerLinks), footerLinks: clean(values.footerLinks) }));
  }

  return (
    <div className="studio-content__inner">
      <div className="studio-page-head">
        <h2>Menus &amp; links</h2>
        <p>Control the links in your site's top menu and footer. Empty rows are ignored when you save.</p>
      </div>

      <div className="studio-help-note">
        <Info aria-hidden="true" />
        <span>Use an internal path like <strong>/#about</strong> or <strong>/gallery</strong>, or a full web address like <strong>https://…</strong></span>
      </div>

      <LinkList title="Header menu" description="Shown in the floating top navigation and mobile menu." links={values.headerLinks} onUpdate={(i, p) => update("headerLinks", i, p)} onRemove={(i) => remove("headerLinks", i)} onMove={(i, d) => move("headerLinks", i, d)} onAdd={() => add("headerLinks")} />
      <LinkList title="Footer menu" description="Shown in the footer's Explore column." links={values.footerLinks} onUpdate={(i, p) => update("footerLinks", i, p)} onRemove={(i) => remove("footerLinks", i)} onMove={(i, d) => move("footerLinks", i, d)} onAdd={() => add("footerLinks")} />

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} />
    </div>
  );
}

function LinkList({
  title,
  description,
  links,
  onUpdate,
  onRemove,
  onMove,
  onAdd,
}: {
  title: string;
  description: string;
  links: Link[];
  onUpdate: (index: number, patch: Partial<Link>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onAdd: () => void;
}) {
  return (
    <div className="studio-card">
      <div className="studio-card__head"><h3>{title}</h3><p>{description}</p></div>
      <div className="studio-card__body">
        {links.map((link, index) => (
          <div key={index} style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem", marginBottom: "0.75rem" }}>
            <span className="studio-reorder">
              <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index, -1)}><ChevronUp size={13} /></button>
              <button type="button" aria-label="Move down" disabled={index === links.length - 1} onClick={() => onMove(index, 1)}><ChevronDown size={13} /></button>
            </span>
            <div style={{ flex: "0 0 40%", display: "grid", gap: "0.3rem" }}>
              {index === 0 && <Label style={{ fontSize: "0.8rem" }}>Label</Label>}
              <Input value={link.label} placeholder="e.g. About" onChange={(e) => onUpdate(index, { label: e.target.value })} />
            </div>
            <div style={{ flex: 1, display: "grid", gap: "0.3rem" }}>
              {index === 0 && <Label style={{ fontSize: "0.8rem" }}>Destination</Label>}
              <Input value={link.href} placeholder="/#about" onChange={(e) => onUpdate(index, { href: e.target.value })} />
            </div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove link" onClick={() => onRemove(index)}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus /> Add link
        </Button>
      </div>
    </div>
  );
}
