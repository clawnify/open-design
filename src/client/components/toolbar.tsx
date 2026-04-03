import { useState } from "preact/hooks";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Save,
  ChevronDown,
} from "lucide-preact";
import { useEditor, CANVAS_SIZES } from "../context";

export function Toolbar() {
  const {
    canvasWidth,
    canvasHeight,
    setCanvasSize,
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    fitScale,
    zoomToFit,
    zoomIn,
    zoomOut,
    exportPNG,
    saveDesign,
    saving,
    activeDesign,
    renameDesign,
  } = useEditor();

  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const currentSize = CANVAS_SIZES.find(
    (s) => s.width === canvasWidth && s.height === canvasHeight
  );
  const sizeLabel = currentSize ? currentSize.label : `${canvasWidth} x ${canvasHeight}`;

  const startRename = () => {
    if (!activeDesign) return;
    setNameValue(activeDesign.name);
    setEditingName(true);
  };

  const finishRename = () => {
    if (activeDesign && nameValue.trim()) {
      renameDesign(activeDesign.id, nameValue.trim());
    }
    setEditingName(false);
  };

  return (
    <div class="flex items-center justify-between px-3 py-1.5 bg-[#1e1e2e] border-b border-[#2d2d42] shrink-0">
      {/* Left: Design name + Canvas size */}
      <div class="flex items-center gap-3">
        {activeDesign && (
          editingName ? (
            <input
              class="bg-[#2d2d42] border border-accent rounded px-2 py-0.5 text-xs text-white outline-none w-40"
              value={nameValue}
              onInput={(e) => setNameValue((e.target as HTMLInputElement).value)}
              onBlur={finishRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") finishRename();
                if (e.key === "Escape") setEditingName(false);
              }}
              autoFocus
            />
          ) : (
            <span
              class="text-xs font-semibold text-zinc-300 cursor-pointer hover:text-white transition-colors"
              onDblClick={startRename}
            >
              {activeDesign.name}
            </span>
          )
        )}

        <div class="relative">
          <button
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-400 bg-[#2d2d42] border border-[#3d3d52] cursor-pointer hover:text-white hover:border-zinc-500 transition-all"
            onClick={() => setShowSizeDropdown(!showSizeDropdown)}
          >
            {sizeLabel}
            <ChevronDown size={12} />
          </button>
          {showSizeDropdown && (
            <>
              <div class="fixed inset-0 z-10" onClick={() => setShowSizeDropdown(false)} />
              <div class="absolute top-full left-0 mt-1 bg-[#1e1e2e] border border-[#3d3d52] rounded-lg shadow-xl z-20 min-w-[200px] py-1">
                {CANVAS_SIZES.map((s) => (
                  <button
                    key={s.label}
                    class={`w-full text-left px-3 py-1.5 text-xs cursor-pointer border-none transition-colors ${
                      s.width === canvasWidth && s.height === canvasHeight
                        ? "bg-accent/20 text-accent"
                        : "text-zinc-300 bg-transparent hover:bg-[#2d2d42]"
                    }`}
                    onClick={() => {
                      setCanvasSize(s.width, s.height);
                      setShowSizeDropdown(false);
                    }}
                  >
                    <span class="font-medium">{s.label}</span>
                    <span class="text-zinc-500 ml-2">
                      {s.width} x {s.height}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Undo / Redo */}
      <div class="flex items-center gap-1">
        <button
          class="p-1.5 rounded-md text-zinc-400 bg-transparent border-none cursor-pointer transition-all hover:bg-[#2d2d42] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          class="p-1.5 rounded-md text-zinc-400 bg-transparent border-none cursor-pointer transition-all hover:bg-[#2d2d42] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Right: Zoom + Export + Save */}
      <div class="flex items-center gap-1.5">
        <button
          class="p-1.5 rounded-md text-zinc-400 bg-transparent border-none cursor-pointer transition-all hover:bg-[#2d2d42] hover:text-white"
          onClick={zoomOut}
          title="Zoom out"
        >
          <ZoomOut size={15} />
        </button>
        <span class="text-[11px] text-zinc-500 font-mono w-10 text-center">
          {Math.round((zoom / (fitScale || 1)) * 100)}%
        </span>
        <button
          class="p-1.5 rounded-md text-zinc-400 bg-transparent border-none cursor-pointer transition-all hover:bg-[#2d2d42] hover:text-white"
          onClick={zoomIn}
          title="Zoom in"
        >
          <ZoomIn size={15} />
        </button>
        <button
          class="p-1.5 rounded-md text-zinc-400 bg-transparent border-none cursor-pointer transition-all hover:bg-[#2d2d42] hover:text-white"
          onClick={zoomToFit}
          title="Fit to screen"
        >
          <Maximize size={15} />
        </button>

        <div class="w-px h-5 bg-[#3d3d52] mx-1" />

        <button
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold border border-[#3d3d52] cursor-pointer transition-all bg-transparent text-zinc-300 hover:bg-[#2d2d42] hover:text-white"
          onClick={exportPNG}
          title="Export as PNG"
        >
          <Download size={13} />
          Export
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-md text-[11px] font-semibold border-none cursor-pointer transition-all bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
          onClick={saveDesign}
          disabled={saving || !activeDesign}
        >
          {saving ? <span class="spinner !border-white/30 !border-t-white" /> : <Save size={13} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
