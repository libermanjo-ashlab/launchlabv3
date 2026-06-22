import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import useStore from "./lib/store";
import Landing      from "./pages/Landing";
import Signup       from "./pages/Signup";
import Dashboard    from "./pages/Dashboard";
import Discovery    from "./pages/Discovery";
import Results      from "./pages/Results";
import Creation     from "./pages/Creation";
import Hub          from "./pages/Hub";
import Pricing      from "./pages/Pricing";
import VerifyEmail  from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import { TermsPage, PrivacyPage, DisclaimerPage } from "./pages/Legal";
import { AppErrorBoundary, C, FH, FB } from "./components";
import "./index.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

function Private({ children }) {
  const token = useStore(s => s.token);
  return token ? children : <Navigate to="/signup" replace />;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0F", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:FB }}>
      <div style={{ maxWidth:460, textAlign:"center" }}>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:72, color:"rgba(255,255,255,0.08)", letterSpacing:"-0.05em", lineHeight:1, marginBottom:16 }}>404</div>
        <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:26, color:"#fff", letterSpacing:"-0.03em", marginBottom:12 }}>Page not found</h1>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.45)", lineHeight:1.75, marginBottom:28 }}>
          This page doesn't exist, or the link may have expired.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button onClick={() => navigate("/")} style={{ background:"#fff", color:"#0A0A0F", border:"none", borderRadius:10, padding:"12px 24px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:FB }}>Go home</button>
          <button onClick={() => navigate(-1)} style={{ background:"transparent", color:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 24px", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:FB }}>Go back</button>
        </div>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.2)", marginTop:28, fontFamily:FB }}>
          Lost? Email <a href="mailto:support@earnedlab.com" style={{ color:"rgba(255,255,255,0.35)", textDecoration:"underline" }}>support@earnedlab.com</a>
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Landing/>} />
        <Route path="/signup"         element={<Signup/>} />
        <Route path="/pricing"        element={<Pricing/>} />
        <Route path="/dashboard"      element={<Private><Dashboard/></Private>} />
        <Route path="/discovery"      element={<Private><Discovery/></Private>} />
        <Route path="/results"        element={<Private><Results/></Private>} />
        <Route path="/creation/:id"   element={<Private><Creation/></Private>} />
        <Route path="/hub/:id"        element={<Private><Hub/></Private>} />
        <Route path="/terms"          element={<TermsPage/>} />
        <Route path="/privacy"        element={<PrivacyPage/>} />
        <Route path="/disclaimer"     element={<DisclaimerPage/>} />
        <Route path="/verify-email"   element={<VerifyEmail/>} />
        <Route path="/reset-password" element={<ResetPassword/>} />
        <Route path="*"               element={<NotFound/>} />
      </Routes>
    </BrowserRouter>
  </AppErrorBoundary>
);
