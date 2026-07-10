import { useEffect, useRef } from "react";
import PanelLight from "./PanelLight";
import { useCalculatorStore } from "../store/calculatorStore";

const btnConfig = [
  { label: "C", action: "clear", variant: "function" as const },
  { label: "⌫", action: "backspace", variant: "function" as const },
  { label: "%", action: "percent", variant: "function" as const },
  { label: "÷", action: "operator", variant: "operator" as const },

  { label: "7", action: "digit", variant: "number" as const },
  { label: "8", action: "digit", variant: "number" as const },
  { label: "9", action: "digit", variant: "number" as const },
  { label: "×", action: "operator", variant: "operator" as const },

  { label: "4", action: "digit", variant: "number" as const },
  { label: "5", action: "digit", variant: "number" as const },
  { label: "6", action: "digit", variant: "number" as const },
  { label: "-", action: "operator", variant: "operator" as const },

  { label: "1", action: "digit", variant: "number" as const },
  { label: "2", action: "digit", variant: "number" as const },
  { label: "3", action: "digit", variant: "number" as const },
  { label: "+", action: "operator", variant: "operator" as const },

  { label: "±", action: "toggleSign", variant: "function" as const },
  { label: "0", action: "digit", variant: "number" as const },
  { label: ".", action: "decimal", variant: "number" as const },
  { label: "=", action: "equals", variant: "equals" as const },
];

export default function Calculator() {
  const displayRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const {
    display, expression, history,
    inputDigit, inputDecimal, performOperator, calculate, clear, backspace, toggleSign, percent,
  } = useCalculatorStore();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") { inputDigit(e.key); return; }
      if (e.key === ".") { inputDecimal(); return; }
      if (e.key === "%") { percent(); return; }
      if (e.key === "Escape" || e.key === "c" || e.key === "C") { clear(); return; }
      if (e.key === "Backspace") { backspace(); return; }
      if (e.key === "Enter" || e.key === "=") { calculate(); return; }
      if (e.key === "+") { performOperator("+"); return; }
      if (e.key === "-") { performOperator("-"); return; }
      if (e.key === "*" || e.key === "×") { performOperator("×"); return; }
      if (e.key === "/" || e.key === "÷") { performOperator("÷"); return; }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inputDigit, inputDecimal, performOperator, calculate, clear, backspace, percent]);

  function handleClick(label: string, action: string) {
    switch (action) {
      case "digit":
        inputDigit(label);
        break;
      case "decimal":
        inputDecimal();
        break;
      case "operator":
        performOperator(label as "+" | "-" | "×" | "÷");
        break;
      case "equals":
        calculate();
        break;
      case "clear":
        clear();
        break;
      case "backspace":
        backspace();
        break;
      case "toggleSign":
        toggleSign();
        break;
      case "percent":
        percent();
        break;
    }
  }

  return (
    <div className="calculator-panel">
      <div ref={displayRef} className="calculator-display">
        <div className="calculator-history">
          {history.map((h, i) => (
            <div key={i} className="history-row">
              <span className="history-expr">{h.expression}</span>
              <span className="history-result">{h.result}</span>
            </div>
          ))}
        </div>
        <div className="calculator-expression">{expression}&nbsp;</div>
        <div className="calculator-value">{display}</div>
        <PanelLight parentRef={displayRef} />
      </div>
      <div ref={buttonsRef} className="calculator-buttons">
        {btnConfig.map((btn) => (
          <button
            key={btn.label}
            className={`calc-btn calc-btn-${btn.variant}`}
            onClick={() => handleClick(btn.label, btn.action)}
          >
            {btn.label}
          </button>
        ))}
        <PanelLight parentRef={buttonsRef} />
      </div>
    </div>
  );
}
