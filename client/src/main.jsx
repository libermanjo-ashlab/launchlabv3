import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useStore from "./lib/store";
import Welcome    from "./pages/Welcome";
import Dashboard  from "./pages/Dashboard";
import Discovery  from "./pages/Discovery";
import Results    from "./pages/Results";
import Creation   from "./pages/Creation";
import Hub        from "./pages/Hub";
import Pricing    from "./pages/Pricing";
import "./index.css";

function Private({ children }) {
  const token = useStore(s => s.token);
  return token ? children : <Navigate to="/" replace />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/"               element={<Welcome/>} />
      <Route path="/pricing"        element={<Pricing/>} />
      <Route path="/dashboard"      element={<Private><Dashboard/></Private>} />
      <Route path="/discovery"      element={<Private><Discovery/></Private>} />
      <Route path="/results"        element={<Private><Results/></Private>} />
      <Route path="/creation/:id"   element={<Private><Creation/></Private>} />
      <Route path="/hub/:id"        element={<Private><Hub/></Private>} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
