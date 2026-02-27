
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./app/App.tsx";
import "./styles/index.css";

const container = document.getElementById("root")!;
flushSync(() => createRoot(container).render(<App />));
container.style.visibility = "";
