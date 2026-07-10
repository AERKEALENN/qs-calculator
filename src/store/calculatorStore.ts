import { create } from "zustand";

type Operator = "+" | "-" | "×" | "÷" | null;

interface HistoryEntry {
  expression: string;
  result: string;
}

interface CalculatorState {
  display: string;
  prevValue: string;
  operator: Operator;
  waitingForOperand: boolean;
  expression: string;
  history: HistoryEntry[];

  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  performOperator: (op: Operator) => void;
  calculate: () => void;
  clear: () => void;
  clearHistory: () => void;
  backspace: () => void;
  toggleSign: () => void;
  percent: () => void;
}

function formatNumber(n: number): string {
  if (!isFinite(n)) return "Error";
  const str = String(n);
  if (str.length > 15) {
    return n.toExponential(6);
  }
  return str;
}

function parseDisplay(val: string): number {
  return parseFloat(val.replace(/,/g, ""));
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  display: "0",
  prevValue: "",
  operator: null,
  waitingForOperand: false,
  expression: "",
  history: [],

  inputDigit: (digit: string) => {
    const { display, waitingForOperand } = get();
    if (waitingForOperand) {
      set({ display: digit, waitingForOperand: false });
    } else {
      const newDisplay = display === "0" ? digit : display + digit;
      set({ display: newDisplay });
    }
  },

  inputDecimal: () => {
    const { display, waitingForOperand } = get();
    if (waitingForOperand) {
      set({ display: "0.", waitingForOperand: false });
    } else if (!display.includes(".")) {
      set({ display: display + "." });
    }
  },

  performOperator: (op: Operator) => {
    const { display, operator, prevValue, waitingForOperand } = get();

    if (operator && !waitingForOperand) {
      const result = compute(parseDisplay(prevValue), parseDisplay(display), operator);
      if (result === null) {
        set({ display: "Error", prevValue: "", operator: null, waitingForOperand: true, expression: "" });
        return;
      }
      const formatted = formatNumber(result);
      set({ display: formatted, prevValue: formatted, operator: op, waitingForOperand: true, expression: `${formatted} ${op}` });
    } else {
      set({ prevValue: display, operator: op, waitingForOperand: true, expression: `${display} ${op}` });
    }
  },

  calculate: () => {
    const { display, operator, prevValue, history } = get();
    if (!operator) return;

    const result = compute(parseDisplay(prevValue), parseDisplay(display), operator);
    if (result === null) {
      set({ display: "Error", prevValue: "", operator: null, waitingForOperand: true, expression: "" });
      return;
    }
    const formatted = formatNumber(result);
    const entry: HistoryEntry = {
      expression: `${prevValue} ${operator} ${display}`,
      result: formatted,
    };
    set({
      display: formatted,
      expression: `${prevValue} ${operator} ${display} =`,
      prevValue: "", operator: null, waitingForOperand: true,
      history: [entry, ...history].slice(0, 20),
    });
  },

  clearHistory: () => {
    set({ history: [] });
  },

  clear: () => {
    set({ display: "0", prevValue: "", operator: null, waitingForOperand: false, expression: "" });
  },

  backspace: () => {
    const { display, waitingForOperand } = get();
    if (waitingForOperand) return;
    const newDisplay = display.length > 1 ? display.slice(0, -1) : "0";
    set({ display: newDisplay });
  },

  toggleSign: () => {
    const { display } = get();
    if (display === "0") return;
    const num = parseDisplay(display);
    set({ display: formatNumber(-num) });
  },

  percent: () => {
    const { display } = get();
    const num = parseDisplay(display);
    set({ display: formatNumber(num / 100) });
  },
}));

function compute(a: number, b: number, op: Operator): number | null {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "×": return a * b;
    case "÷": return b !== 0 ? a / b : null;
    default: return null;
  }
}
