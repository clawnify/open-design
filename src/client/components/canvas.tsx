import { useRef, useEffect } from "preact/hooks";
import * as fabric from "fabric";
import { useEditor } from "../context";

export function Canvas() {
  const { setCanvas, canvasWidth, canvasHeight, zoom, setZoomRaw, setFitScale } = useEditor();
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasElRef.current || fabricRef.current) return;

    const c = new fabric.Canvas(canvasElRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#1a1a2e",
      preserveObjectStacking: true,
      selection: true,
      controlsAboveOverlay: true,
    });

    // Retina rendering
    const dpr = window.devicePixelRatio || 1;
    c.setDimensions({ width: canvasWidth * dpr, height: canvasHeight * dpr }, { cssOnly: false });
    c.setDimensions({ width: canvasWidth, height: canvasHeight }, { cssOnly: true });
    c.setViewportTransform([dpr, 0, 0, dpr, 0, 0]);

    // Custom selection styling
    fabric.FabricObject.prototype.set({
      transparentCorners: false,
      cornerColor: "#6366f1",
      cornerStrokeColor: "#ffffff",
      cornerSize: 10,
      cornerStyle: "circle",
      borderColor: "#6366f1",
      borderScaleFactor: 2,
      padding: 4,
    });

    fabricRef.current = c;
    setCanvas(c);

    return () => {
      c.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Update canvas size when dimensions change
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.setDimensions({ width: canvasWidth * dpr, height: canvasHeight * dpr }, { cssOnly: false });
    c.setDimensions({ width: canvasWidth, height: canvasHeight }, { cssOnly: true });
    c.setViewportTransform([dpr, 0, 0, dpr, 0, 0]);
    c.requestRenderAll();
  }, [canvasWidth, canvasHeight]);

  // Calculate fit scale on mount and when canvas/container size changes
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const padding = 80; // px padding around canvas
    const availW = wrapper.clientWidth - padding;
    const availH = wrapper.clientHeight - padding;
    const fit = Math.min(availW / canvasWidth, availH / canvasHeight, 1);
    setFitScale(fit);
    setZoomRaw(fit); // Start at "fit to screen"
  }, [canvasWidth, canvasHeight]);

  // Recalculate on resize
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const obs = new ResizeObserver(() => {
      const padding = 80;
      const availW = wrapper.clientWidth - padding;
      const availH = wrapper.clientHeight - padding;
      const fit = Math.min(availW / canvasWidth, availH / canvasHeight, 1);
      setFitScale(fit);
    });
    obs.observe(wrapper);
    return () => obs.disconnect();
  }, [canvasWidth, canvasHeight]);

  // Mouse wheel zoom
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    wrapper.addEventListener("wheel", handler, { passive: false });
    return () => wrapper.removeEventListener("wheel", handler);
  }, []);

  return (
    <div
      ref={wrapperRef}
      class="flex-1 flex items-center justify-center overflow-auto"
      style={{ background: "#2a2a3a" }}
    >
      <div
        class="relative shadow-2xl"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: "transform 0.15s ease",
        }}
      >
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}
