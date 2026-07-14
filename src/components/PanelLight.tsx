import { useState, useEffect, type RefObject } from "react";

interface PanelLightProps {
  parentRef: RefObject<HTMLElement | null>;
}

export default function PanelLight({ parentRef }: PanelLightProps) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = parentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
      setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [parentRef]);

  return (
    <div
      className="panel-light"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s",
      }}
    />
  );
}
