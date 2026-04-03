import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { Design, Template } from "./types";
import type * as fabric from "fabric";

export interface CanvasSize {
  label: string;
  width: number;
  height: number;
}

export const CANVAS_SIZES: CanvasSize[] = [
  { label: "LinkedIn Square", width: 1080, height: 1080 },
  { label: "LinkedIn Landscape", width: 1200, height: 627 },
  { label: "LinkedIn Portrait", width: 1200, height: 1500 },
  { label: "Instagram Story", width: 1080, height: 1920 },
];

export interface EditorContextValue {
  // Canvas
  canvas: fabric.Canvas | null;
  setCanvas: (c: fabric.Canvas | null) => void;
  selectedObject: fabric.FabricObject | null;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  setZoomRaw: (z: number) => void;
  fitScale: number;
  setFitScale: (s: number) => void;

  // Canvas actions
  addText: (preset: "heading" | "subheading" | "body") => void;
  addShape: (type: "rect" | "circle" | "line" | "triangle") => void;
  addImage: (url: string) => void;
  setBackground: (type: "color" | "gradient" | "image", value: string) => void;
  updateSelectedObject: (props: Record<string, unknown>) => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  setCanvasSize: (width: number, height: number) => void;
  zoomToFit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  exportPNG: () => void;
  getCanvasJSON: () => string;
  loadCanvasJSON: (json: string) => void;
  loadTemplate: (template: Template) => void;

  // Designs
  designs: Design[];
  activeDesign: Design | null;
  createDesign: () => Promise<void>;
  loadDesign: (id: number) => Promise<void>;
  saveDesign: () => Promise<void>;
  deleteDesign: (id: number) => Promise<void>;
  renameDesign: (id: number, name: string) => Promise<void>;
  saving: boolean;

  // Templates
  templates: Template[];

  // State
  loading: boolean;
}

export const EditorContext = createContext<EditorContextValue>(null!);

export function useEditor() {
  return useContext(EditorContext);
}
