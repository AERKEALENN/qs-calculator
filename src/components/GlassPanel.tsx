import { useRef, type CSSProperties, type ReactNode } from "react";
import PanelLight from "./PanelLight";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function GlassPanel({ children, className = "", style }: GlassPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={panelRef}
      className={`glass-panel ${className}`}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      {children}
      <PanelLight parentRef={panelRef} />
    </div>
  );
}
