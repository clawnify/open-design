import type { Template } from "../types";

interface Props {
  template: Template;
  onClick: () => void;
}

export function TemplateCard({ template, onClick }: Props) {
  return (
    <button
      class="group relative bg-[#1e1e34] border border-[#2d2d42] rounded-lg overflow-hidden cursor-pointer transition-all hover:border-accent hover:shadow-lg hover:shadow-accent/10 p-0"
      onClick={onClick}
    >
      {/* Preview area — render a mini canvas thumbnail */}
      <div
        class="w-full aspect-square flex items-center justify-center text-[10px] text-zinc-600 overflow-hidden"
        style={{ background: getTemplateBg(template.canvas_json) }}
      >
        <span class="text-zinc-400 text-[10px] font-medium px-2 text-center leading-tight opacity-80 group-hover:opacity-100 transition-opacity">
          {template.name}
        </span>
      </div>
      {/* Label */}
      <div class="px-2 py-1.5 border-t border-[#2d2d42]">
        <span class="text-[10px] text-zinc-400 font-medium truncate block">
          {template.name}
        </span>
        <span class="text-[9px] text-zinc-600">
          {template.width}x{template.height}
        </span>
      </div>
    </button>
  );
}

function getTemplateBg(canvasJson: string): string {
  try {
    const parsed = JSON.parse(canvasJson);
    const bg = parsed.objects?.[0];
    if (bg?.type === "rect" && bg.fill) return bg.fill;
  } catch {}
  return "#1a1a2e";
}
