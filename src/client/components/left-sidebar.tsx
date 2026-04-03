import { useState, useRef, useCallback } from "preact/hooks";
import {
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  Image,
  Upload,
  Palette,
  LayoutGrid,
  Sparkles,
} from "lucide-preact";
import { useEditor } from "../context";
import { TemplateCard } from "./template-card";
import { DesignList } from "./design-list";
import { api } from "../api";

type Tab = "templates" | "text" | "shapes" | "images" | "background" | "designs";

const TABS: { key: Tab; icon: typeof LayoutGrid; label: string }[] = [
  { key: "templates", icon: Sparkles, label: "Templates" },
  { key: "text", icon: Type, label: "Text" },
  { key: "shapes", icon: Square, label: "Shapes" },
  { key: "images", icon: Image, label: "Images" },
  { key: "background", icon: Palette, label: "Bg" },
  { key: "designs", icon: LayoutGrid, label: "Designs" },
];

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

const BG_COLORS = [
  "#1a1a2e", "#0f172a", "#18181b", "#1e1b4b",
  "#ffffff", "#f8fafc", "#fafaf9", "#fef3c7",
  "#2563eb", "#7c3aed", "#dc2626", "#059669",
  "#0891b2", "#d97706", "#e11d48", "#4f46e5",
];

export function LeftSidebar() {
  const { addText, addShape, addImage, setBackground, templates, loadTemplate } = useEditor();
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          const form = new FormData();
          form.append("file", file);
          const { url } = await api<{ url: string }>("POST", "/api/uploads", undefined);
          // Use fetch directly for FormData
          const resp = await fetch("/api/uploads", { method: "POST", body: form });
          const data = await resp.json();
          if (data.url) addImage(data.url);
        }
      } catch (e) {
        console.error("Upload failed:", e);
      } finally {
        setUploading(false);
      }
    },
    [addImage]
  );

  const handleBgUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const form = new FormData();
      form.append("file", files[0]);
      try {
        const resp = await fetch("/api/uploads", { method: "POST", body: form });
        const data = await resp.json();
        if (data.url) setBackground("image", data.url);
      } catch (e) {
        console.error("Bg upload failed:", e);
      }
    },
    [setBackground]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      handleImageUpload(e.dataTransfer?.files ?? null);
    },
    [handleImageUpload]
  );

  return (
    <aside class="w-[260px] bg-[#16162a] border-r border-[#2d2d42] flex flex-col shrink-0">
      {/* Tab strip */}
      <div class="grid grid-cols-6 border-b border-[#2d2d42]">
        {TABS.map((t) => (
          <button
            key={t.key}
            class={`flex flex-col items-center gap-0.5 py-2 bg-transparent border-none cursor-pointer transition-all text-[10px] ${
              activeTab === t.key
                ? "text-accent bg-accent/10"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setActiveTab(t.key)}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-3">
        {/* Templates */}
        {activeTab === "templates" && (
          <div>
            <p class="text-zinc-500 text-[11px] mb-3">Click a template to apply</p>
            <div class="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <TemplateCard key={t.id} template={t} onClick={() => loadTemplate(t)} />
              ))}
            </div>
          </div>
        )}

        {/* Text */}
        {activeTab === "text" && (
          <div class="flex flex-col gap-2">
            <p class="text-zinc-500 text-[11px] mb-1">Click to add text</p>
            <button
              class="w-full text-left p-3 rounded-lg bg-[#1e1e34] border border-[#2d2d42] cursor-pointer transition-all hover:border-accent hover:bg-accent/5 group"
              onClick={() => addText("heading")}
            >
              <span class="text-lg font-bold text-white group-hover:text-accent transition-colors">
                Add a heading
              </span>
              <span class="block text-[10px] text-zinc-500 mt-0.5">
                Montserrat Bold, 48px
              </span>
            </button>
            <button
              class="w-full text-left p-3 rounded-lg bg-[#1e1e34] border border-[#2d2d42] cursor-pointer transition-all hover:border-accent hover:bg-accent/5 group"
              onClick={() => addText("subheading")}
            >
              <span class="text-sm font-medium text-white group-hover:text-accent transition-colors">
                Add a subheading
              </span>
              <span class="block text-[10px] text-zinc-500 mt-0.5">
                Inter Medium, 32px
              </span>
            </button>
            <button
              class="w-full text-left p-3 rounded-lg bg-[#1e1e34] border border-[#2d2d42] cursor-pointer transition-all hover:border-accent hover:bg-accent/5 group"
              onClick={() => addText("body")}
            >
              <span class="text-xs text-white group-hover:text-accent transition-colors">
                Add body text
              </span>
              <span class="block text-[10px] text-zinc-500 mt-0.5">
                Inter Regular, 18px
              </span>
            </button>
          </div>
        )}

        {/* Shapes */}
        {activeTab === "shapes" && (
          <div>
            <p class="text-zinc-500 text-[11px] mb-2">Click to add a shape</p>
            <div class="grid grid-cols-2 gap-2">
              {[
                { type: "rect" as const, icon: Square, label: "Rectangle" },
                { type: "circle" as const, icon: Circle, label: "Circle" },
                { type: "triangle" as const, icon: Triangle, label: "Triangle" },
                { type: "line" as const, icon: Minus, label: "Line" },
              ].map((s) => (
                <button
                  key={s.type}
                  class="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#1e1e34] border border-[#2d2d42] cursor-pointer transition-all hover:border-accent hover:bg-accent/5"
                  onClick={() => addShape(s.type)}
                >
                  <s.icon size={24} class="text-zinc-400" />
                  <span class="text-[11px] text-zinc-500">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        {activeTab === "images" && (
          <div>
            <p class="text-zinc-500 text-[11px] mb-2">Upload images to add to canvas</p>
            <div
              class="border-2 border-dashed border-[#3d3d52] rounded-lg p-6 text-center cursor-pointer transition-all hover:border-accent/50 hover:bg-accent/5"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload size={24} class="text-zinc-500 mx-auto mb-2" />
              <p class="text-xs text-zinc-400">
                {uploading ? "Uploading..." : "Click or drag images here"}
              </p>
              <p class="text-[10px] text-zinc-600 mt-1">PNG, JPG, SVG, WebP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              onChange={(e) => handleImageUpload((e.target as HTMLInputElement).files)}
            />
          </div>
        )}

        {/* Background */}
        {activeTab === "background" && (
          <div>
            <p class="text-zinc-500 text-[11px] mb-2">Solid colors</p>
            <div class="grid grid-cols-4 gap-1.5 mb-4">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  class="w-full aspect-square rounded-md border border-[#3d3d52] cursor-pointer transition-all hover:scale-110 hover:border-accent"
                  style={{ background: c }}
                  onClick={() => setBackground("color", c)}
                />
              ))}
            </div>

            <p class="text-zinc-500 text-[11px] mb-2">Custom color</p>
            <input
              type="color"
              class="w-full h-8 rounded-md border border-[#3d3d52] cursor-pointer bg-transparent"
              onChange={(e) =>
                setBackground("color", (e.target as HTMLInputElement).value)
              }
            />

            <p class="text-zinc-500 text-[11px] mb-2 mt-4">Gradient presets</p>
            <div class="grid grid-cols-3 gap-1.5 mb-4">
              {GRADIENT_PRESETS.map((g, i) => (
                <button
                  key={i}
                  class="w-full aspect-square rounded-md border border-[#3d3d52] cursor-pointer transition-all hover:scale-110 hover:border-accent"
                  style={{ background: g }}
                  onClick={() => {
                    // Extract the first color as a simple background
                    const match = g.match(/#[0-9a-f]{6}/gi);
                    if (match) setBackground("color", match[0]);
                  }}
                />
              ))}
            </div>

            <p class="text-zinc-500 text-[11px] mb-2">Background image</p>
            <button
              class="w-full p-3 rounded-lg bg-[#1e1e34] border border-[#2d2d42] cursor-pointer text-xs text-zinc-400 hover:border-accent hover:text-zinc-200 transition-all"
              onClick={() => bgFileRef.current?.click()}
            >
              <Upload size={14} class="inline mr-1.5" />
              Upload image
            </button>
            <input
              ref={bgFileRef}
              type="file"
              accept="image/*"
              class="hidden"
              onChange={(e) => handleBgUpload((e.target as HTMLInputElement).files)}
            />
          </div>
        )}

        {/* Designs */}
        {activeTab === "designs" && <DesignList />}
      </div>
    </aside>
  );
}
