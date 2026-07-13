import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./index";

const BG   = "#0A0A0F";
const BD   = "rgba(255,255,255,0.08)";
const TXT  = "#fff";
const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const FH   = "'DM Sans','Helvetica Neue',sans-serif";
const GRAD = "linear-gradient(135deg,#C855EA,#4558D6)";

const NAV_LINKS = [
  { label:"How it works", href:"/how-it-works" },
  { label:"Features",     href:"/features" },
  { label:"Docs",         href:"/docs" },
  { label:"Pricing",      href:"/pricing" },
];

function NavLink({ href, label, active }) {
  return (
    <Link
      to={href}
      style={{ fontSize:13, color: active ? "#fff" : MUT, textDecoration:"none", padding:"6px 12px", fontFamily:FH, fontWeight: active ? 600 : 400, transition:"color 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.color = "#fff"}
      onMouseLeave={e => e.currentTarget.style.color = active ? "#fff" : MUT}
    >
      {label}
    </Link>
  );
}

export default function ContentLayout({ children, title, description }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:FH, color:TXT, display:"flex", flexDirection:"column" }}>

      {/* nav */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", background:"rgba(10,10,15,0.88)", borderBottom:`1px solid ${BD}`, height:56 }}>
        <div style={{ maxWidth:1080, margin:"0 auto", height:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px" }}>

          <Link to="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
            <Logo size={20} />
            <span style={{ fontWeight:700, fontSize:14, color:TXT, letterSpacing:"-0.02em" }}>EarnedLab</span>
          </Link>

          {/* desktop */}
          <div className="cl-desktop" style={{ display:"flex", alignItems:"center", gap:4 }}>
            {NAV_LINKS.map(l => (
              <NavLink key={l.href} {...l} active={location.pathname === l.href} />
            ))}
            <div style={{ width:1, height:18, background:BD, margin:"0 8px" }} />
            <Link to="/signup" style={{ fontSize:13, color:MUT, textDecoration:"none", padding:"6px 14px", border:`1px solid ${BD}`, borderRadius:8, fontWeight:500 }}>Sign in</Link>
            <Link to="/signup" style={{ fontSize:13, color:"#fff", textDecoration:"none", padding:"7px 16px", background:GRAD, borderRadius:8, fontWeight:600 }}>Start free</Link>
          </div>

          {/* mobile hamburger */}
          <button
            className="cl-mobile"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{ display:"none", background:"none", border:"none", cursor:"pointer", padding:6, color:"rgba(255,255,255,0.75)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="3" y1="3" x2="17" y2="17"/><line x1="17" y1="3" x2="3" y2="17"/></>
                : <><line x1="2" y1="6" x2="18" y2="6"/><line x1="2" y1="10" x2="18" y2="10"/><line x1="2" y1="14" x2="18" y2="14"/></>
              }
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div style={{ background:"rgba(10,10,15,0.97)", borderBottom:`1px solid ${BD}`, display:"flex", flexDirection:"column", padding:"8px 0 16px" }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} to={l.href} onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:MUT, textDecoration:"none", padding:"12px 28px" }}>{l.label}</Link>
            ))}
            <div style={{ height:1, background:BD, margin:"8px 28px" }} />
            <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:"rgba(255,255,255,0.7)", textDecoration:"none", padding:"12px 28px", fontWeight:500 }}>Sign in</Link>
            <div style={{ padding:"8px 28px 0" }}>
              <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ display:"block", fontSize:15, color:"#fff", textDecoration:"none", padding:"12px", background:GRAD, borderRadius:10, fontWeight:600, textAlign:"center" }}>Start free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* page title band */}
      {title && (
        <div style={{ paddingTop:56 }}>
          <div style={{ maxWidth:1080, margin:"0 auto", padding:"64px 28px 0" }}>
            <h1 style={{ fontSize:"clamp(30px,5vw,48px)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.1, marginBottom:16 }}>
              {title}
            </h1>
            {description && (
              <p style={{ fontSize:17, color:MUT, lineHeight:1.7, maxWidth:640 }}>{description}</p>
            )}
          </div>
          <div style={{ height:1, background:BD, margin:"48px 0 0" }} />
        </div>
      )}

      {/* content */}
      <main style={{ flex:1, maxWidth:1080, margin:"0 auto", padding:"48px 28px 80px", width:"100%", paddingTop: title ? 48 : 104 }}>
        {children}
      </main>

      {/* footer */}
      <footer style={{ borderTop:`1px solid ${BD}`, padding:"28px", display:"flex", flexWrap:"wrap", gap:16, alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Logo size={16} />
          <span style={{ fontSize:12, color:DIM }}>© {new Date().getFullYear()} EarnedLab</span>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:20 }}>
          {[["About","/about"],["How it works","/how-it-works"],["Features","/features"],["Docs","/docs"],["Pricing","/pricing"],["Security","/security"],["Responsible AI","/responsible-ai"],["Terms","/terms"],["Privacy","/privacy"]].map(([label, href]) => (
            <Link key={href} to={href} style={{ fontSize:12, color:DIM, textDecoration:"none" }}
              onMouseEnter={e => e.currentTarget.style.color = MUT}
              onMouseLeave={e => e.currentTarget.style.color = DIM}
            >{label}</Link>
          ))}
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .cl-desktop { display: none !important; }
          .cl-mobile  { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
