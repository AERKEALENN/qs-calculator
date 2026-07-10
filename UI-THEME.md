# Dark Glassmorphism UI Theme — 主题实现参考

> 暗色毛玻璃 UI 主题，适用于 Tauri 2.0 + React + TypeScript 桌面应用。

---

## 1. 项目架构（一句话）

- **桌面壳**：Tauri 2.0（Rust 后端，Cargo 管理 Rust 依赖）
- **前端**：React + TypeScript + Vite（npm 管理所有前端包）
- **通信**：前端通过 `invoke` 调用 Rust 命令（非 HTTP）
- **启动**：`npm run tauri dev` → 同时启动 Vite + 编译 Rust → 弹出原生窗口

---

## 2. 主题效果

```
┌──────────────────────────────────────────────────────┐
│ 深色渐变背景（靛蓝→紫→黑）      ┌─────────────┐      │
│  ├─ Canvas 动态动画              │ 毛玻璃面板   │      │
│  │  光线条纹（底层）             │ 透明度 6%   │      │
│  │  极光球（中层）               │ backdrop-blur│      │
│  │  渐变边框                    │             │      │
│  │  暗角（最顶层）               │ 微内阴影    │      │
│  └─ 鼠标跟随光斑                 └─────────────┘      │
│                                   文字：90% 白        │
│                                   次要：75% 白        │
│                                   辅助：40% 白        │
│                                   提示：20% 白        │
└──────────────────────────────────────────────────────┘
```

---

## 3. CSS 变量（完整定义）

```css
:root {
    /* ── 背景 ── */
    --bg-gradient: linear-gradient(160deg, #0a0a1a 0%, #0f0c29 30%, #0d1117 100%);

    /* ── 主题色 ── */
    --accent: #818cf8;
    --accent-deep: #6366f1;
    --accent-glow: rgba(129, 140, 248, 0.25);

    /* ── 文字 ── */
    --text-primary: rgba(255, 255, 255, 0.9);
    --text-body: rgba(255, 255, 255, 0.75);
    --text-secondary: rgba(255, 255, 255, 0.4);
    --text-hint: rgba(255, 255, 255, 0.2);

    /* ── 玻璃面板 ── */
    --glass-bg: rgba(255, 255, 255, 0.06);
    --glass-bg-hover: rgba(255, 255, 255, 0.09);
    --glass-blur: 8px;
    --glass-radius: 14px;
    --glass-border: rgba(255, 255, 255, 0.08);

    /* ── 面板变体 ── */
    --glass-toolbar-bg: rgba(255, 255, 255, 0.06);
    --glass-toolbar-blur: 8px;
    --glass-toolbar-radius: 14px;

    --glass-card-bg: rgba(255, 255, 255, 0.04);
    --glass-card-blur: 10px;
    --glass-card-radius: 20px;

    /* ── 输入框 ── */
    --input-bg: rgba(255, 255, 255, 0.04);
    --input-border: rgba(255, 255, 255, 0.08);
    --input-border-focus: rgba(129, 140, 248, 0.5);
    --input-radius: 8px;

    /* ── 滚动条 ── */
    --scrollbar-bg: transparent;
    --scrollbar-thumb: rgba(255, 255, 255, 0.1);
    --scrollbar-thumb-hover: rgba(255, 255, 255, 0.2);
}
```

---

## 4. 玻璃面板 CSS 类（完整实现）

```css
/* ── 通用玻璃面板 mixin ── */
.glass-panel {
    position: relative;
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    border-radius: var(--glass-radius);
    box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.15),
        inset 0 -2px 4px rgba(0, 0, 0, 0.1),
        inset 2px 0 4px rgba(255, 255, 255, 0.04),
        inset -2px 0 4px rgba(0, 0, 0, 0.04);
}

/* ── 渐变边框（伪元素实现） ── */
.glass-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
        160deg,
        rgba(255, 255, 255, 0.25) 0%,
        rgba(255, 255, 255, 0.06) 40%,
        rgba(255, 255, 255, 0.02) 70%,
        rgba(255, 255, 255, 0.08) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
}

/* ── 顶部高光 ── */
.glass-panel::after {
    content: '';
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.2) 50%,
        transparent 100%
    );
    border-radius: 50%;
    pointer-events: none;
}

/* ── 变体应用 ── */
.glass-toolbar { @extend .glass-panel; background: var(--glass-toolbar-bg); backdrop-filter: blur(var(--glass-toolbar-blur)); border-radius: var(--glass-toolbar-radius); }
.glass-card   { @extend .glass-panel; background: var(--glass-card-bg); backdrop-filter: blur(var(--glass-card-blur)); border-radius: var(--glass-card-radius); }
```

---

## 5. Canvas 动态背景（完整代码复现）

三层在 `<canvas>` 上叠加绘制，实现极光 + 暗角效果。

### JavaScript 实现（`src/utils/canvas-bg.ts`）

```typescript
export function initCanvasBg(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    let w: number, h: number;
    let animId: number;

    // ── 光线条纹（15-20 根，lighter 混合） ──
    const rays: { speed: number; width: number; hue: number; offset: number }[] = [];
    for (let i = 0; i < 18; i++) {
        rays.push({
            speed: 0.2 + Math.random() * 0.3,
            width: 2 + Math.random() * 6,
            hue: 220 + Math.random() * 60,
            offset: Math.random() * 1000,
        });
    }

    // ── 极光球（4-6 个，HSL 径向渐变 + shadowBlur 80） ──
    const auroras: { x: number; y: number; r: number; hue: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < 5; i++) {
        auroras.push({
            x: Math.random() * 2000,
            y: Math.random() * 1000,
            r: 200 + Math.random() * 300,
            hue: 220 + Math.random() * 80,
            speed: 0.1 + Math.random() * 0.2,
            phase: Math.random() * Math.PI * 2,
        });
    }

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
    }

    function draw(t: number) {
        ctx.clearRect(0, 0, w, h);

        // 1. 光线条纹（lighter 混合）
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const ray of rays) {
            ctx.beginPath();
            ctx.moveTo(0, h);
            const yy = (Math.sin(t * ray.speed * 0.001 + ray.offset) * 0.5 + 0.5) * h * 0.6 + h * 0.2;
            ctx.lineTo(w, yy);
            ctx.strokeStyle = `hsla(${ray.hue + Math.sin(t * 0.0005) * 20}, 70%, 60%, 0.06)`;
            ctx.lineWidth = ray.width;
            ctx.stroke();
        }
        ctx.restore();

        // 2. 极光球
        for (const a of auroras) {
            const cx = a.x + Math.sin(t * a.speed * 0.0005 + a.phase) * 200;
            const cy = a.y + Math.cos(t * a.speed * 0.0003 + a.phase) * 150;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, a.r);
            gradient.addColorStop(0, `hsla(${a.hue + Math.sin(t * 0.0008 + a.phase) * 30}, 80%, 60%, 0.12)`);
            gradient.addColorStop(0.5, `hsla(${a.hue + 20}, 60%, 40%, 0.06)`);
            gradient.addColorStop(1, `hsla(${a.hue + 40}, 40%, 20%, 0)`);
            ctx.save();
            ctx.shadowBlur = 80;
            ctx.shadowColor = `hsla(${a.hue}, 80%, 60%, 0.15)`;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, a.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 3. 暗角
        const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    animId = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
}
```

### 在 React 中使用

```tsx
import { useEffect, useRef } from 'react';
import { initCanvasBg } from '../utils/canvas-bg';

export default function BgCanvas() {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const cleanup = initCanvasBg(ref.current);
        return cleanup;
    }, []);
    return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />;
}
```

---

## 6. 全局样式

```css
/* index.css */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { width: 100%; height: 100%; overflow: hidden; }
body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: var(--bg-gradient);
    color: var(--text-body);
}

/* ── 自定义滚动条 ── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--scrollbar-bg); }
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

/* ── 输入框 ── */
input, textarea {
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: var(--input-radius);
    color: var(--text-primary);
    padding: 6px 10px;
    outline: none;
}
input:focus, textarea:focus { border-color: var(--input-border-focus); box-shadow: 0 0 0 2px var(--accent-glow); }
```

---

## 7. 按钮样式

```css
.btn {
    border: none;
    border-radius: 8px;
    padding: 6px 16px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-primary {
    background: var(--accent);
    color: white;
}
.btn-primary:hover { background: var(--accent-deep); box-shadow: 0 0 12px var(--accent-glow); }

.btn-ghost {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-body);
    border: 1px solid rgba(255, 255, 255, 0.06);
}
.btn-ghost:hover { background: rgba(255, 255, 255, 0.08); }
```

---

## 8. 鼠标跟随光斑（始终可见，但限于玻璃范围内）

光斑**始终跟随鼠标**，没有 fade in/out，但只出现在玻璃面板区域内。原理：每个 `GlassPanel` 内部渲染一个 `PanelLight`（`position: absolute` 相对面板定位），玻璃面板的 `overflow: hidden` 自然裁剪光斑到面板边界。

```css
.panel-light {
    position: absolute;       /* 相对玻璃面板定位 */
    width: 300px;
    height: 300px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(129, 140, 248, 0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;               /* 在面板内容后面 */
}
```

```tsx
// PanelLight.tsx
interface PanelLightProps { parentRef: React.RefObject<HTMLElement | null>; }

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
        window.addEventListener('mousemove', onMove);  // 全局监听
        return () => window.removeEventListener('mousemove', onMove);
    }, [parentRef]);

    return <div className="panel-light" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />;
}
```

```tsx
// GlassPanel.tsx（集成方式）
export default function GlassPanel({ children }) {
    const panelRef = useRef<HTMLDivElement>(null);
    return (
        <div ref={panelRef} className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
            {children}
            <PanelLight parentRef={panelRef} />
        </div>
    );
}
```

---

## 9. 启动脚本（package.json）

```json
{
    "scripts": {
        "dev": "vite",
        "build": "tsc -b && vite build",
        "tauri": "tauri"
    },
    "dependencies": {
        "react": "^19",
        "react-dom": "^19",
        "@tauri-apps/api": "^2",
        "@tauri-apps/plugin-xxx": "^2",
        "zustand": "^5",
        "immer": "^10",
        "@xyflow/react": "^12"
    },
    "devDependencies": {
        "@tauri-apps/cli": "^2",
        "typescript": "~5.7",
        "vite": "^6",
        "@vitejs/plugin-react": "^4"
    }
}
```

---

## 10. 背景 Canvas 定位

放在 React 组件树的最外层，`zIndex: 0`，其他所有内容 `zIndex >= 1`：

```tsx
// App.tsx
<BgCanvas />                  {/* z-index: 0 */}
<main style={{ position: 'relative', zIndex: 1 }}>
    <Toolbar />
    <BlockPanel />
    <CanvasArea />
    <PropertyPanel />
</main>
```

---

## 11. 总结：要复现效果需要做的全部步骤

1. 创建 Tauri 2.0 项目（`npm create tauri-app`）
2. 将 `:root` CSS 变量（第 3 节）复制到 `index.css`
3. 将 `.glass-panel` 及其变体（第 4 节）复制到 `App.css`
4. 创建 `utils/canvas-bg.ts`（第 5 节）
5. 创建 `BgCanvas` 组件，放在 `App.tsx` 最外层
6. 复制全局样式（第 6 节）到 `index.css`
7. 添加 `PanelLight.tsx`（第 8 节）—— 必选，玻璃质感必须靠光斑衬托
8. `App.css` 和 `index.css` 中所有代码用上面变量名即可，无需改动

---

## 12. 内嵌标题栏（Custom Titlebar）

Tauri 2.0 无边框窗口 + 自定义标题栏，支持拖拽、最小化、最大化、关闭。

### 12.1 关闭系统标题栏

`src-tauri/tauri.conf.json`：

```json
{
  "app": {
    "windows": [{
      "decorations": false
    }]
  }
}
```

### 12.2 声明窗口操作权限

Tauri 2.0 默认不允许前端调用窗口操作 API，需要在 `src-tauri/capabilities/default.json` 里显式授权：

```json
{
  "permissions": [
    "core:default",
    "core:window:default",
    "core:window:allow-minimize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-close",
    "core:window:allow-start-dragging"
  ]
}
```

> 不声明 → `getCurrentWindow().minimize()` 等调用被静默拒绝，按钮点了没反应。

### 12.3 React 组件

```tsx
import { getCurrentWindow } from "@tauri-apps/api/window";

<div className="titlebar" data-tauri-drag-region>
  <span className="titlebar-title">应用名称</span>
  <div className="spacer" />
  <div className="titlebar-buttons">
    <button className="titlebar-btn" data-tauri-drag-region="false"
      onClick={() => getCurrentWindow().minimize()}>
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M0 5h10" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </button>
    <button className="titlebar-btn" data-tauri-drag-region="false"
      onClick={() => getCurrentWindow().toggleMaximize()}>
      <svg width="10" height="10" viewBox="0 0 10 10">
        <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </button>
    <button className="titlebar-btn titlebar-close" data-tauri-drag-region="false"
      onClick={() => getCurrentWindow().close()}>
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </button>
  </div>
</div>
```

关键点：
- `data-tauri-drag-region` 放在父容器 → 整个标题栏可拖拽
- `data-tauri-drag-region="false"` 放在按钮上 → 阻止拖拽拦截点击
- 按钮 `onClick` 直接调 API，不需要 `stopPropagation`

### 12.4 CSS

```css
.titlebar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  flex-shrink: 0;
  user-select: none;
  padding: 4px 4px 0 12px;
}
.titlebar-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.5px;
  cursor: default;
}
.titlebar-buttons { display: flex; gap: 2px; }
.titlebar-btn {
  width: 28px; height: 28px;
  border: none; border-radius: 6px;
  background: transparent;
  color: rgba(255,255,255,0.4);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.titlebar-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
.titlebar-close:hover { background: rgba(248,113,113,0.5); color: #fff; }
```

### 12.5 布局

标题栏作为 flex 容器第一个子元素，主体 `flex: 1` 填满剩余空间：

```css
.app { display: flex; flex-direction: column; }
.titlebar { flex-shrink: 0; }
.layout { flex: 1; min-height: 0; }
```
