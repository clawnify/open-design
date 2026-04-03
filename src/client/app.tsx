import { EditorContext } from "./context";
import { useCanvasState } from "./hooks/use-canvas";
import { useDesigns } from "./hooks/use-designs";
import { Editor } from "./components/editor";
import WebFont from "webfontloader";
import { useEffect } from "preact/hooks";

export function App() {
  const canvasState = useCanvasState();
  const designState = useDesigns(canvasState.getCanvasJSON, canvasState.loadCanvasJSON);

  // Load Google Fonts
  useEffect(() => {
    WebFont.load({
      google: {
        families: [
          "Inter:400,500,600,700",
          "Playfair Display:400,500,600,700,800,900",
          "Montserrat:400,500,600,700,800,900",
          "Poppins:400,500,600,700",
          "Roboto:400,500,700",
          "Open Sans:400,600,700",
          "Lora:400,700",
          "Raleway:400,500,600",
          "Source Sans Pro:400,600,700",
          "Merriweather:400,700",
        ],
      },
    });
  }, []);

  if (designState.loading) {
    return (
      <div class="flex items-center justify-center h-full bg-[#12121e]">
        <div class="text-center">
          <div class="spinner !w-6 !h-6 !border-accent/30 !border-t-accent mb-3 mx-auto" />
          <p class="text-zinc-500 text-sm">Loading editor...</p>
        </div>
      </div>
    );
  }

  const contextValue = {
    ...canvasState,
    ...designState,
  };

  return (
    <EditorContext.Provider value={contextValue}>
      <Editor />
    </EditorContext.Provider>
  );
}
