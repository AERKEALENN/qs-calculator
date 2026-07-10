import { useState, useEffect, type RefObject } from "react";

interface PanelLightProps {
  parentRef: RefObject<HTMLElement | null>;
}

export default function PanelLight({ parentRef }: PanelLightProps) {
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = parentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [parentRef]);

  return (
    <div
      className="panel-light"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    />
  );
}
