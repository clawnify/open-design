import { useState, useCallback, useRef, useEffect } from "preact/hooks";
import type { Design, Template } from "../types";
import { api } from "../api";

export function useDesigns(getCanvasJSON: () => string, loadCanvasJSON: (json: string) => void) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeDesign, setActiveDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const activeIdRef = useRef<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load designs + templates on mount
  useEffect(() => {
    (async () => {
      try {
        const [d, t] = await Promise.all([
          api<Design[]>("GET", "/api/designs"),
          api<Template[]>("GET", "/api/templates"),
        ]);
        setDesigns(d);
        setTemplates(t);
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveDesign = useCallback(async () => {
    if (!activeIdRef.current) return;
    setSaving(true);
    try {
      const json = getCanvasJSON();
      const updated = await api<Design>("PUT", `/api/designs/${activeIdRef.current}`, {
        canvas_json: json,
      });
      setDesigns((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setActiveDesign(updated);
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  }, [getCanvasJSON]);

  const createDesign = useCallback(async () => {
    try {
      const d = await api<Design>("POST", "/api/designs", {
        name: "Untitled Design",
        canvas_json: getCanvasJSON(),
      });
      setDesigns((prev) => [d, ...prev]);
      setActiveDesign(d);
      activeIdRef.current = d.id;
    } catch (e) {
      console.error("Failed to create design:", e);
    }
  }, [getCanvasJSON]);

  const loadDesign = useCallback(
    async (id: number) => {
      try {
        const d = await api<Design>("GET", `/api/designs/${id}`);
        setActiveDesign(d);
        activeIdRef.current = d.id;
        loadCanvasJSON(d.canvas_json);
      } catch (e) {
        console.error("Failed to load design:", e);
      }
    },
    [loadCanvasJSON]
  );

  const deleteDesign = useCallback(async (id: number) => {
    try {
      await api<{ ok: boolean }>("DELETE", `/api/designs/${id}`);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      if (activeIdRef.current === id) {
        setActiveDesign(null);
        activeIdRef.current = null;
      }
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  }, []);

  const renameDesign = useCallback(async (id: number, name: string) => {
    try {
      const updated = await api<Design>("PUT", `/api/designs/${id}`, { name });
      setDesigns((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      if (activeIdRef.current === id) setActiveDesign(updated);
    } catch (e) {
      console.error("Failed to rename:", e);
    }
  }, []);

  // Auto-save debounced
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDesign(), 2000);
  }, [saveDesign]);

  return {
    designs,
    templates,
    activeDesign,
    setActiveDesign,
    activeIdRef,
    loading,
    saving,
    createDesign,
    loadDesign,
    saveDesign,
    deleteDesign,
    renameDesign,
    scheduleSave,
  };
}
