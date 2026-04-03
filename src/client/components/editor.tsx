import { Canvas } from "./canvas";
import { Toolbar } from "./toolbar";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";

export function Editor() {
  return (
    <div class="flex flex-col h-full w-full">
      <Toolbar />
      <div class="flex flex-1 min-h-0">
        <LeftSidebar />
        <Canvas />
        <RightSidebar />
      </div>
    </div>
  );
}
