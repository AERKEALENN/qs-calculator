import BgCanvas from "./components/BgCanvas";
import Titlebar from "./components/Titlebar";
import Calculator from "./components/Calculator";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <BgCanvas />
      <main className="layout">
        <Titlebar />
        <div className="calculator-wrapper">
          <Calculator />
        </div>
      </main>
    </div>
  );
}
