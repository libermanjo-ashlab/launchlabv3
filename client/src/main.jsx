import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import useStore from "./lib/store";
import Landing      from "./pages/Landing";
import Signup       from "./pages/Signup";
import Dashboard    from "./pages/Dashboard";
import Discovery    from "./pages/Discovery";
import Results      from "./pages/Results";
import Creation     from "./pages/Creation";
import Hub          from "./pages/Hub";
import Pricing      from "./pages/Pricing";
import Admin        from "./pages/Admin";
import Start        from "./pages/Start";
import About        from "./pages/About";
import HowItWorks   from "./pages/HowItWorks";
import Features     from "./pages/Features";
import Security     from "./pages/Security";
import ResponsibleAI from "./pages/ResponsibleAI";
import Docs         from "./pages/Docs";
import Templates    from "./pages/Templates";
import TemplateConsulting   from "./pages/templates/TemplateConsulting";
import TemplateLocalService from "./pages/templates/TemplateLocalService";
import TemplateAgency       from "./pages/templates/TemplateAgency";
import TemplateCreator      from "./pages/templates/TemplateCreator";
import TemplateFreelance    from "./pages/templates/TemplateFreelance";
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

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
  });
}

// Identifies the logged-in user to PostHog whenever auth state changes
function UserTracker() {
  const user = useStore(s => s.user);
  useEffect(() => {
    if (!import.meta.env.VITE_POSTHOG_KEY) return;
    if (user?.id) {
      posthog.identify(user.id, { email: user.email, name: user.name, plan: user.plan });
    } else {
      posthog.reset();
    }
  }, [user?.id]);
  return null;
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
      <UserTracker />
      <Routes>
        <Route path="/"               element={<Landing/>} />
        <Route path="/signup"         element={<Signup/>} />
        <Route path="/pricing"        element={<Pricing/>} />
        <Route path="/start"          element={<Start/>} />
        <Route path="/dashboard"      element={<Private><Dashboard/></Private>} />
        <Route path="/discovery"      element={<Private><Discovery/></Private>} />
        <Route path="/results"        element={<Private><Results/></Private>} />
        <Route path="/creation/:id"   element={<Private><Creation/></Private>} />
        <Route path="/hub/:id"        element={<Private><Hub/></Private>} />
        <Route path="/admin"          element={<Private><Admin/></Private>} />
        <Route path="/about"          element={<About/>} />
        <Route path="/how-it-works"   element={<HowItWorks/>} />
        <Route path="/features"       element={<Features/>} />
        <Route path="/security"       element={<Security/>} />
        <Route path="/responsible-ai" element={<ResponsibleAI/>} />
        <Route path="/docs"                         element={<Docs/>} />
        <Route path="/templates"                    element={<Templates/>} />
        <Route path="/templates/consulting"         element={<TemplateConsulting/>} />
        <Route path="/templates/local-service"      element={<TemplateLocalService/>} />
        <Route path="/templates/agency"             element={<TemplateAgency/>} />
        <Route path="/templates/creator"            element={<TemplateCreator/>} />
        <Route path="/templates/freelance"          element={<TemplateFreelance/>} />
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
