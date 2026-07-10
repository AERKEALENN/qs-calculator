import { useEffect, useRef } from "react";
import { initCanvasBg } from "../utils/canvas-bg";

export default function BgCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return initCanvasBg(ref.current);
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0 }} />;
}
