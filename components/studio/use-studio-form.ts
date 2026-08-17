"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Small form-state helper shared by the Studio editors: tracks values, a dirty
 * flag (compared against the last-saved snapshot), and a saving state, and
 * wraps the async save call with success/error toasts.
 */
export function useStudioForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  const savedSnapshot = useRef(JSON.stringify(initial));

  const dirty = useMemo(() => JSON.stringify(values) !== savedSnapshot.current, [values]);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setValuesBulk = useCallback((patch: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const save = useCallback(
    async (persist: (values: T) => Promise<void>, successMessage = "Saved. Your changes are live on the site.") => {
      setSaving(true);
      try {
        await persist(values);
        savedSnapshot.current = JSON.stringify(values);
        // Force a re-render so `dirty` recomputes to false.
        setValues((prev) => ({ ...prev }));
        toast.success(successMessage);
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong while saving.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [values],
  );

  return { values, setValue, setValuesBulk, setValues, dirty, saving, save };
}
