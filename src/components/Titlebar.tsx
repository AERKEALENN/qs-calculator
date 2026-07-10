import { getCurrentWindow } from "@tauri-apps/api/window";

export default function Titlebar() {
  return (
    <div className="titlebar" data-tauri-drag-region>
      <span className="titlebar-title">QS 计算器</span>
      <div className="spacer" />
      <div className="titlebar-buttons">
        <button
          className="titlebar-btn"
          data-tauri-drag-region="false"
          onClick={() => getCurrentWindow().minimize()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 5h10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          className="titlebar-btn"
          data-tauri-drag-region="false"
          onClick={() => getCurrentWindow().toggleMaximize()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          className="titlebar-btn titlebar-close"
          data-tauri-drag-region="false"
          onClick={() => getCurrentWindow().close()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
