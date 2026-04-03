import { useState, useCallback, useRef, useEffect } from "preact/hooks";
import * as fabric from "fabric";
import type { Template } from "../types";

const MAX_HISTORY = 50;

const TEXT_PRESETS = {
  heading: { text: "Add a heading", fontSize: 48, fontWeight: "700", fontFamily: "Montserrat" },
  subheading: { text: "Add a subheading", fontSize: 32, fontWeight: "500", fontFamily: "Inter" },
  body: { text: "Add body text", fontSize: 18, fontWeight: "400", fontFamily: "Inter" },
} as const;

const SHAPE_DEFAULTS = {
  fill: "#6366f1",
  stroke: "",
  strokeWidth: 0,
  opacity: 1,
};

export function useCanvasState() {
  const [canvas, setCanvasRaw] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(1080);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [zoom, setZoom] = useState(0.58);
  const [fitScale, setFitScale] = useState(0.58);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveHistory = useCallback(() => {
    if (!canvas || isRestoringRef.current) return;
    const json = JSON.stringify(canvas.toJSON());
    const idx = historyIndexRef.current;
    // Truncate any forward history
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(json);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current = historyRef.current.length - 1;
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, [canvas]);

  const setCanvas = useCallback(
    (c: fabric.Canvas | null) => {
      setCanvasRaw(c);
      if (c) {
        // Selection events
        c.on("selection:created", (e) => setSelectedObject(e.selected?.[0] ?? null));
        c.on("selection:updated", (e) => setSelectedObject(e.selected?.[0] ?? null));
        c.on("selection:cleared", () => setSelectedObject(null));

        // History events
        c.on("object:added", () => saveHistory());
        c.on("object:modified", () => saveHistory());
        c.on("object:removed", () => saveHistory());

        // Initial history snapshot
        setTimeout(() => {
          const json = JSON.stringify(c.toJSON());
          historyRef.current = [json];
          historyIndexRef.current = 0;
        }, 100);
      }
    },
    [saveHistory]
  );

  // ── Text ────────────────────────────────────────────────────────────

  const addText = useCallback(
    (preset: "heading" | "subheading" | "body") => {
      if (!canvas) return;
      const cfg = TEXT_PRESETS[preset];
      const text = new fabric.Textbox(cfg.text, {
        left: canvasWidth / 2 - 200,
        top: canvasHeight / 2 - 30,
        width: 400,
        fontSize: cfg.fontSize,
        fontWeight: cfg.fontWeight,
        fontFamily: cfg.fontFamily,
        fill: "#ffffff",
        textAlign: "center",
        editable: true,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();
    },
    [canvas, canvasWidth, canvasHeight]
  );

  // ── Shapes ──────────────────────────────────────────────────────────

  const addShape = useCallback(
    (type: "rect" | "circle" | "line" | "triangle") => {
      if (!canvas) return;
      let obj: fabric.FabricObject;
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;

      switch (type) {
        case "rect":
          obj = new fabric.Rect({
            left: cx - 75,
            top: cy - 75,
            width: 150,
            height: 150,
            rx: 8,
            ry: 8,
            ...SHAPE_DEFAULTS,
          });
          break;
        case "circle":
          obj = new fabric.Circle({
            left: cx - 60,
            top: cy - 60,
            radius: 60,
            ...SHAPE_DEFAULTS,
          });
          break;
        case "triangle":
          obj = new fabric.Triangle({
            left: cx - 60,
            top: cy - 60,
            width: 120,
            height: 120,
            ...SHAPE_DEFAULTS,
          });
          break;
        case "line":
          obj = new fabric.Line([cx - 100, cy, cx + 100, cy], {
            stroke: "#6366f1",
            strokeWidth: 3,
            fill: "",
          });
          break;
        default:
          return;
      }
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    },
    [canvas, canvasWidth, canvasHeight]
  );

  // ── Images ──────────────────────────────────────────────────────────

  const addImage = useCallback(
    async (url: string) => {
      if (!canvas) return;
      try {
        const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
        const scale = Math.min(
          (canvasWidth * 0.6) / (img.width || 1),
          (canvasHeight * 0.6) / (img.height || 1),
          1
        );
        img.set({
          left: canvasWidth / 2 - ((img.width || 0) * scale) / 2,
          top: canvasHeight / 2 - ((img.height || 0) * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
      } catch (e) {
        console.error("Failed to load image:", e);
      }
    },
    [canvas, canvasWidth, canvasHeight]
  );

  // ── Background ──────────────────────────────────────────────────────

  const setBackground = useCallback(
    (type: "color" | "gradient" | "image", value: string) => {
      if (!canvas) return;
      if (type === "color") {
        canvas.backgroundColor = value;
        canvas.requestRenderAll();
        saveHistory();
      } else if (type === "gradient") {
        canvas.backgroundColor = value;
        canvas.requestRenderAll();
        saveHistory();
      } else if (type === "image") {
        fabric.FabricImage.fromURL(value, { crossOrigin: "anonymous" }).then((img) => {
          const scaleX = canvasWidth / (img.width || 1);
          const scaleY = canvasHeight / (img.height || 1);
          img.set({ left: 0, top: 0, scaleX, scaleY, selectable: false, evented: false });
          // Remove any existing background image objects
          const objects = canvas.getObjects();
          const bgObj = objects.find((o) => (o as any)._isBgImage);
          if (bgObj) canvas.remove(bgObj);
          (img as any)._isBgImage = true;
          canvas.add(img);
          canvas.sendObjectToBack(img);
          canvas.requestRenderAll();
          saveHistory();
        });
      }
    },
    [canvas, canvasWidth, canvasHeight, saveHistory]
  );

  // ── Object manipulation ─────────────────────────────────────────────

  const updateSelectedObject = useCallback(
    (props: Record<string, unknown>) => {
      if (!canvas || !selectedObject) return;
      selectedObject.set(props as Partial<fabric.FabricObject>);
      canvas.requestRenderAll();
      saveHistory();
      // Force re-render of the selected object state
      setSelectedObject({ ...selectedObject } as fabric.FabricObject);
    },
    [canvas, selectedObject, saveHistory]
  );

  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [canvas]);

  // ── Undo / Redo ─────────────────────────────────────────────────────

  const restoreFromHistory = useCallback(
    (index: number) => {
      if (!canvas || index < 0 || index >= historyRef.current.length) return;
      isRestoringRef.current = true;
      historyIndexRef.current = index;
      const json = historyRef.current[index];
      canvas.loadFromJSON(JSON.parse(json)).then(() => {
        canvas.requestRenderAll();
        isRestoringRef.current = false;
        setCanUndo(index > 0);
        setCanRedo(index < historyRef.current.length - 1);
      });
    },
    [canvas]
  );

  const undo = useCallback(() => {
    restoreFromHistory(historyIndexRef.current - 1);
  }, [restoreFromHistory]);

  const redo = useCallback(() => {
    restoreFromHistory(historyIndexRef.current + 1);
  }, [restoreFromHistory]);

  // ── Canvas size ─────────────────────────────────────────────────────

  const setCanvasSize = useCallback(
    (width: number, height: number) => {
      setCanvasWidth(width);
      setCanvasHeight(height);
      if (canvas) {
        // Update the actual canvas dimensions
        const dpr = window.devicePixelRatio || 1;
        canvas.setDimensions({ width: width * dpr, height: height * dpr }, { cssOnly: false });
        canvas.setDimensions({ width, height }, { cssOnly: true });
        canvas.setViewportTransform([dpr, 0, 0, dpr, 0, 0]);
        canvas.requestRenderAll();
      }
    },
    [canvas]
  );

  // ── Zoom ────────────────────────────────────────────────────────────

  const zoomToFit = useCallback(() => {
    setZoom(fitScale);
  }, [fitScale]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.2, 0.05));
  }, []);

  // ── Export ──────────────────────────────────────────────────────────

  const exportPNG = useCallback(() => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const dataURL = canvas.toDataURL({
      format: "png",
      multiplier: 2,
      quality: 1,
    });

    const link = document.createElement("a");
    link.download = "design.png";
    link.href = dataURL;
    link.click();

    if (activeObj) {
      canvas.setActiveObject(activeObj);
      canvas.requestRenderAll();
    }
  }, [canvas]);

  // ── Serialization ───────────────────────────────────────────────────

  const getCanvasJSON = useCallback(() => {
    if (!canvas) return "{}";
    return JSON.stringify(canvas.toJSON());
  }, [canvas]);

  const loadCanvasJSON = useCallback(
    (json: string) => {
      if (!canvas) return;
      isRestoringRef.current = true;
      try {
        const parsed = JSON.parse(json);
        canvas.loadFromJSON(parsed).then(() => {
          canvas.requestRenderAll();
          isRestoringRef.current = false;
          // Reset history
          historyRef.current = [JSON.stringify(canvas.toJSON())];
          historyIndexRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);
        });
      } catch {
        isRestoringRef.current = false;
      }
    },
    [canvas]
  );

  const loadTemplate = useCallback(
    (template: Template) => {
      setCanvasWidth(template.width);
      setCanvasHeight(template.height);
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.setDimensions(
          { width: template.width * dpr, height: template.height * dpr },
          { cssOnly: false }
        );
        canvas.setDimensions({ width: template.width, height: template.height }, { cssOnly: true });
        canvas.setViewportTransform([dpr, 0, 0, dpr, 0, 0]);
      }
      loadCanvasJSON(template.canvas_json);
    },
    [canvas, loadCanvasJSON]
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (meta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && !isTextEditing(canvas)) {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, deleteSelected, canvas]);

  return {
    canvas,
    setCanvas,
    selectedObject,
    canvasWidth,
    canvasHeight,
    zoom,
    setZoomRaw: setZoom,
    fitScale,
    setFitScale,
    addText,
    addShape,
    addImage,
    setBackground,
    updateSelectedObject,
    deleteSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    setCanvasSize,
    zoomToFit,
    zoomIn,
    zoomOut,
    exportPNG,
    getCanvasJSON,
    loadCanvasJSON,
    loadTemplate,
  };
}

function isTextEditing(canvas: fabric.Canvas | null): boolean {
  if (!canvas) return false;
  const obj = canvas.getActiveObject();
  return obj instanceof fabric.Textbox && obj.isEditing === true;
}
