import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Users, TrendingUp, Building2, Zap, Copy, Check, ExternalLink, Search } from "lucide-react";
import useStore from "../lib/store";
import { api } from "../lib/api";
import { Logo, Spinner } from "../components";

const BG   = "#0A0A0F";
const CARD = "rgba(255,255,255,0.04)";
const BD   = "rgba(255,255,255,0.08)";
const TXT  = "#fff";
const MUT  = "rgba(255,255,255,0.45)";
const FH   = "'DM Sans','Helvetica Neue',sans-serif";

const PLAN_META = {
  trial:         { label:"Trial",       bg:"rgba(100,116,139,0.25)", color:"#94A3B8" },
  starter:       { label:"Starter",     bg:"rgba(37,99,235,0.25)",   color:"#60A5FA" },
  pro:           { label:"Pro",         bg:"rgba(124,58,237,0.25)",  color:"#A78BFA" },
  pro_autopilot: { label:"Autopilot",   bg:"rgba(217,119,6,0.25)",   color:"#FCD34D" },
  admin:         { label:"Admin",       bg:"rgba(5,150,105,0.25)",   color:"#34D399" },
};

function PlanBadge({ plan, locked }) {
  const m = PLAN_META[plan] || PLAN_META.trial;
  return (
    <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:6, fontSize:11, fontWeight:600, background: locked ? "rgba(220,38,38,0.2)" : m.bg, color: locked ? "#F87171" : m.color, fontFamily:FH, whiteSpace:"nowrap" }}>
      {locked ? "Expired" : m.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "#A78BFA" }) {
  return (
    <div style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:14, padding:"18px 20px", flex:"1 1 140px", minWidth:130 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:`${color}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize:11, color:MUT, fontFamily:FH, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
      </div>
      <div style={{ fontSize:28, fontWeight:700, color:TXT, fontFamily:FH, letterSpacing:"-0.03em", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:MUT, fontFamily:FH, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function TokenBar({ used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round(used / limit * 100)) : 0;
  const color = pct > 85 ? "#F87171" : pct > 60 ? "#FCD34D" : "#34D399";
  const fmt = n => n >= 1000 ? `${(n/1000).toFixed(0)}k` : String(n);
  return (
    <div style={{ minWidth:120 }}>
      <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.08)", marginBottom:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:2, transition:"width 0.4s" }} />
      </div>
      <div style={{ fontSize:11, color: pct > 0 ? MUT : "rgba(255,255,255,0.2)", fontFamily:FH }}>
        {pct > 0 ? `${fmt(used)} / ${fmt(limit)}` : "—"}
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <button onClick={copy} style={{ background:"none", border:"none", cursor:"pointer", color:MUT, padding:"2px 4px", display:"inline-flex", alignItems:"center" }} title="Copy email">
      {copied ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
    </button>
  );
}

function relTime(date) {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

function fmtDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

const PLAN_ORDER = ["all", "trial", "starter", "pro", "pro_autopilot"];
const PLAN_LABELS = { all:"All", trial:"Trial", starter:"Starter", pro:"Pro", pro_autopilot:"Autopilot" };

export default function Admin() {
  const navigate   = useNavigate();
  const user       = useStore(s => s.user);
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [fetchedAt,setFetchedAt]= useState(null);

  useEffect(() => {
    if (!user?.isAdmin) navigate("/dashboard", { replace:true });
  }, [user, navigate]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const d = await api.admin.users();
      setData(d);
      setFetchedAt(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    if (!data) return;
    const headers = ["Email","Name","Plan","Locked","Joined","Businesses","Today Tokens","Token Limit","Marketing Runs","Implementations","Last Active","Email Verified"];
    const rows = data.users.map(u => [
      u.email, u.name, u.plan, u.locked ? "yes" : "no",
      fmtDate(u.createdAt), u.businessCount,
      u.todayTokens, u.tokenLimit,
      u.totalMarketingRuns, u.totalImplementations,
      u.lastActiveAt ? fmtDate(u.lastActiveAt) : "",
      u.emailVerified ? "yes" : "no",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download = `earnedlab-users-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const filteredUsers = (data?.users || []).filter(u => {
    if (filter !== "all" && u.plan !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || (u.businesses || []).some(b => b.toLowerCase().includes(q));
    }
    return true;
  });

  const s = data?.summary;

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:FH, color:TXT }}>
      {/* top bar */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"rgba(10,10,15,0.9)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${BD}`, padding:"0 24px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Logo size={22} />
          <span style={{ fontWeight:700, fontSize:15, letterSpacing:"-0.02em" }}>Admin</span>
          <span style={{ fontSize:12, color:MUT, marginLeft:4 }}>— User Dashboard</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {fetchedAt && <span style={{ fontSize:11, color:MUT }}>Updated {relTime(fetchedAt)}</span>}
          <button onClick={exportCSV} disabled={!data} style={{ background:CARD, border:`1px solid ${BD}`, color:TXT, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:FH, display:"flex", alignItems:"center", gap:6, opacity: data ? 1 : 0.4 }}>
            Export CSV
          </button>
          <button onClick={load} disabled={loading} style={{ background:CARD, border:`1px solid ${BD}`, color:TXT, borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:FH, display:"flex", alignItems:"center", gap:6 }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          <button onClick={() => navigate("/dashboard")} style={{ background:"none", border:"none", color:MUT, fontSize:13, cursor:"pointer", fontFamily:FH }}>← App</button>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"28px 24px" }}>
        {error && (
          <div style={{ background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#F87171", marginBottom:20 }}>{error}</div>
        )}

        {/* summary cards */}
        {s && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:28 }}>
            <StatCard icon={Users}     label="Total Users"   value={s.total}             color="#A78BFA" />
            <StatCard icon={TrendingUp} label="Active Today" value={s.activeToday}        sub="used tokens today"      color="#34D399" />
            <StatCard icon={Building2} label="Businesses"    value={s.totalBusinesses}    color="#60A5FA" />
            <StatCard icon={Zap}       label="Trial"         value={s.byPlan.trial || 0}  color="#94A3B8" />
            <StatCard icon={Zap}       label="Starter"       value={s.byPlan.starter || 0} color="#60A5FA" />
            <StatCard icon={Zap}       label="Pro"           value={s.byPlan.pro || 0}    color="#A78BFA" />
            <StatCard icon={Zap}       label="Autopilot"     value={s.byPlan.pro_autopilot || 0} color="#FCD34D" />
          </div>
        )}

        {/* filter + search */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
          <div style={{ display:"flex", gap:4 }}>
            {PLAN_ORDER.map(p => (
              <button key={p} onClick={() => setFilter(p)} style={{ background: filter===p ? "rgba(167,139,250,0.15)" : "transparent", border: filter===p ? "1px solid rgba(167,139,250,0.4)" : `1px solid ${BD}`, color: filter===p ? "#A78BFA" : MUT, borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:FH, transition:"all 0.15s" }}>
                {PLAN_LABELS[p]}{p !== "all" && s ? ` (${s.byPlan[p] || 0})` : ""}
              </button>
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <Search size={13} color={MUT} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search email, name, business…"
              style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:8, padding:"7px 12px 7px 30px", fontSize:12, color:TXT, outline:"none", fontFamily:FH, width:240 }}
            />
          </div>
        </div>

        {/* table */}
        {loading && !data ? (
          <div style={{ display:"flex", justifyContent:"center", padding:80 }}>
            <Spinner color="#A78BFA" size={36} />
          </div>
        ) : (
          <div style={{ overflowX:"auto", borderRadius:12, border:`1px solid ${BD}` }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:900 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${BD}`, background:"rgba(255,255,255,0.02)" }}>
                  {["User","Plan","Joined","Businesses","Today's Usage","Runs","Last Active","Verified"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, textTransform:"uppercase", letterSpacing:"0.07em", color:MUT, fontWeight:600, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding:"40px 14px", textAlign:"center", color:MUT, fontSize:13 }}>
                      {search || filter !== "all" ? "No users match this filter." : "No users yet."}
                    </td>
                  </tr>
                ) : filteredUsers.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < filteredUsers.length-1 ? `1px solid rgba(255,255,255,0.04)` : "none", transition:"background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* user */}
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div>
                          <div style={{ fontWeight:600, color:TXT, lineHeight:1.3 }}>{u.name}</div>
                          <div style={{ fontSize:11, color:MUT, display:"flex", alignItems:"center", gap:2 }}>
                            {u.email}
                            <CopyButton text={u.email} />
                          </div>
                          {u.isAdmin && <span style={{ fontSize:10, color:"#34D399", fontWeight:600 }}>ADMIN</span>}
                        </div>
                      </div>
                    </td>
                    {/* plan */}
                    <td style={{ padding:"12px 14px" }}>
                      <PlanBadge plan={u.plan} locked={u.locked} />
                      {u.isTrial && !u.locked && u.trialEndsAt && (
                        <div style={{ fontSize:10, color:MUT, marginTop:3 }}>
                          {Math.max(0, Math.ceil((new Date(u.trialEndsAt) - Date.now()) / 86400000))}d left
                        </div>
                      )}
                    </td>
                    {/* joined */}
                    <td style={{ padding:"12px 14px", color:MUT, whiteSpace:"nowrap", fontSize:12 }}>
                      {fmtDate(u.createdAt)}
                    </td>
                    {/* businesses */}
                    <td style={{ padding:"12px 14px" }}>
                      {u.businessCount === 0 ? (
                        <span style={{ color:"rgba(255,255,255,0.2)", fontSize:12 }}>None</span>
                      ) : (
                        <div>
                          <span style={{ fontWeight:600, color:TXT }}>{u.businessCount}</span>
                          <div style={{ fontSize:11, color:MUT, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {u.businesses.join(", ")}
                          </div>
                        </div>
                      )}
                    </td>
                    {/* today's usage */}
                    <td style={{ padding:"12px 14px" }}>
                      <TokenBar used={u.todayTokens} limit={u.tokenLimit} />
                    </td>
                    {/* runs */}
                    <td style={{ padding:"12px 14px", whiteSpace:"nowrap" }}>
                      <span style={{ color:TXT, fontWeight:500 }}>{u.totalMarketingRuns}</span>
                      <span style={{ color:MUT, fontSize:11 }}> mktg</span>
                      <br />
                      <span style={{ color:TXT, fontWeight:500 }}>{u.totalImplementations}</span>
                      <span style={{ color:MUT, fontSize:11 }}> impl</span>
                    </td>
                    {/* last active */}
                    <td style={{ padding:"12px 14px", color:MUT, fontSize:12, whiteSpace:"nowrap" }}>
                      {relTime(u.lastActiveAt)}
                    </td>
                    {/* verified */}
                    <td style={{ padding:"12px 14px", textAlign:"center" }}>
                      {u.emailVerified
                        ? <span style={{ color:"#34D399", fontSize:15 }}>✓</span>
                        : <span style={{ color:"rgba(255,255,255,0.2)", fontSize:13 }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* footer: observability links */}
        <div style={{ marginTop:32, padding:"18px 20px", background:CARD, border:`1px solid ${BD}`, borderRadius:12, display:"flex", flexWrap:"wrap", gap:20, alignItems:"center" }}>
          <div style={{ fontSize:12, color:MUT, fontFamily:FH }}>
            <span style={{ fontWeight:600, color:TXT }}>Page views & sessions</span> — powered by PostHog.
            {import.meta.env.VITE_POSTHOG_KEY
              ? <span style={{ color:"#34D399", marginLeft:6 }}>✓ Active</span>
              : <span style={{ color:"#FCD34D", marginLeft:6 }}>Set VITE_POSTHOG_KEY in Railway to activate</span>
            }
          </div>
          <div style={{ width:1, height:24, background:BD }} />
          <div style={{ fontSize:12, color:MUT, fontFamily:FH }}>
            <span style={{ fontWeight:600, color:TXT }}>Error tracking</span> — powered by Sentry.
            {import.meta.env.VITE_SENTRY_DSN
              ? <a href="https://sentry.io" target="_blank" rel="noreferrer" style={{ color:"#34D399", marginLeft:6, display:"inline-flex", alignItems:"center", gap:3, textDecoration:"none" }}>Open Sentry <ExternalLink size={10} /></a>
              : <span style={{ color:"#FCD34D", marginLeft:6 }}>Set VITE_SENTRY_DSN + SENTRY_DSN in Railway to activate</span>
            }
          </div>
          <div style={{ width:1, height:24, background:BD }} />
          <div style={{ fontSize:12, color:MUT, fontFamily:FH }}>
            <span style={{ fontWeight:600, color:TXT }}>{filteredUsers.length}</span> users shown
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(167,139,250,0.5) !important; }
      `}</style>
    </div>
  );
}
