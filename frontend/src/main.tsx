import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import DownloadPage from "./Download.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />}></Route>
        <Route path="/d/:path" element={<DownloadPage />} />
      </Routes>
    </Router>
  </StrictMode>
);
