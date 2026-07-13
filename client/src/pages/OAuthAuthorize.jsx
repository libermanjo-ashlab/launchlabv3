import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useStore from "../lib/store";
import { C, FH, FB, Logo, inp, lbl } from "../components";

const PERMISSIONS = [
  "View your account name and email",
  "Create business workspaces on your behalf",
  "Save plans and content to your workspaces",
];

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F8FAFC",
    padding: "24px",
  },
  box: {
    background: "#fff",
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "40px 36px",
    maxWidth: 420,
    width: "100%",
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
  },
  logoRow: { display: "flex", justifyContent: "center", marginBottom: 28 },
  title: { fontFamily: FH, fontSize: 20, fontWeight: 700, color: C.text, textAlign: "center", marginBottom: 6 },
  sub:   { fontFamily: FB, fontSize: 14, color: C.muted, textAlign: "center", marginBottom: 24, lineHeight: 1.55 },
  perms: {
    background: "#F8FAFC",
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 24,
  },
  permLabel: { fontFamily: FB, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 },
  permItem:  { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 7 },
  dot:       { width: 6, height: 6, borderRadius: "50%", background: C.primary, marginTop: 6, flexShrink: 0 },
  permText:  { fontFamily: FB, fontSize: 13, color: C.text, lineHeight: 1.5 },
  userChip: {
    display: "flex", alignItems: "center", gap: 12,
    background: "#F8FAFC", border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "12px 14px", marginBottom: 20,
  },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: C.primaryBg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: FH, fontWeight: 700, fontSize: 14, color: C.primary, flexShrink: 0,
  },
  btnPrimary: {
    width: "100%", padding: "12px",
    background: C.primary, color: "#fff",
    border: "none", borderRadius: 10,
    fontFamily: FH, fontSize: 15, fontWeight: 700,
    cursor: "pointer", marginBottom: 10,
    transition: "opacity 0.15s",
  },
  btnDeny: {
    width: "100%", padding: "11px",
    background: "transparent", color: C.muted,
    border: `1.5px solid ${C.border}30`, borderRadius: 10,
    fontFamily: FB, fontSize: 14, cursor: "pointer",
  },
  fieldRow: { marginBottom: 14 },
  err:  { color: C.err, fontSize: 13, fontFamily: FB, textAlign: "center", marginBottom: 14 },
  foot: { fontFamily: FB, fontSize: 11, color: C.subtle, textAlign: "center", marginTop: 20, lineHeight: 1.5 },
};

export default function OAuthAuthorize() {
  const [params]    = useSearchParams();
  const { user, token } = useStore();

  const clientId      = params.get("client_id");
  const redirectUri   = params.get("redirect_uri");
  const codeChallenge = params.get("code_challenge");
  const state         = params.get("state");

  const [clientName, setClientName] = useState("An AI assistant");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/oauth/client-info?client_id=${encodeURIComponent(clientId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.name && d.name !== "Unknown") setClientName(d.name); })
      .catch(() => {});
  }, [clientId]);

  if (!clientId || !redirectUri) {
    return (
      <div style={S.page}>
        <div style={S.box}>
          <div style={S.logoRow}><Logo size={30} /></div>
          <p style={{ ...S.sub, color: C.err }}>Invalid authorization request — missing required parameters.</p>
        </div>
      </div>
    );
  }

  const deny = () => {
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  };

  const approve = async (tok) => {
    setLoading(true);
    setErr("");
    try {
      const res  = await fetch("/api/oauth/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri, code_challenge: codeChallenge, state }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authorization failed");
      window.location.href = data.redirect;
    } catch (e) {
      setErr(e.message);
      setLoading(false);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      await approve(data.token);
    } catch (e) {
      setErr(e.message);
      setLoading(false);
    }
  };

  const permBlock = (
    <div style={S.perms}>
      <div style={S.permLabel}>This app will be able to:</div>
      {PERMISSIONS.map((p, i) => (
        <div key={i} style={{ ...S.permItem, marginBottom: i === PERMISSIONS.length - 1 ? 0 : 7 }}>
          <span style={S.dot} />
          <span style={S.permText}>{p}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={S.logoRow}><Logo size={30} /></div>
        <div style={S.title}>{clientName} wants access</div>
        <div style={S.sub}>
          {user
            ? `Connect ${clientName} to your EarnedLab account to use business tools.`
            : "Sign in to authorize this connection to your EarnedLab account."}
        </div>

        {permBlock}

        {user && token ? (
          <>
            <div style={S.userChip}>
              <div style={S.avatar}>{(user.name?.[0] || "U").toUpperCase()}</div>
              <div>
                <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 600, color: C.text }}>{user.name}</div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.muted }}>{user.email}</div>
              </div>
            </div>
            {err && <div style={S.err}>{err}</div>}
            <button
              style={{ ...S.btnPrimary, opacity: loading ? 0.65 : 1 }}
              onClick={() => approve(token)}
              disabled={loading}
            >
              {loading ? "Connecting…" : "Allow access"}
            </button>
            <button style={S.btnDeny} onClick={deny} disabled={loading}>Deny</button>
          </>
        ) : (
          <form onSubmit={login}>
            <div style={S.fieldRow}>
              <label style={lbl}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required style={inp()} />
            </div>
            <div style={{ ...S.fieldRow, marginBottom: 18 }}>
              <label style={lbl}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required style={inp()} />
            </div>
            {err && <div style={S.err}>{err}</div>}
            <button
              type="submit"
              style={{ ...S.btnPrimary, opacity: loading ? 0.65 : 1 }}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in and allow access"}
            </button>
            <button type="button" style={S.btnDeny} onClick={deny} disabled={loading}>Deny</button>
          </form>
        )}

        <p style={S.foot}>
          By allowing access, this app can act on your EarnedLab account.<br />
          You can revoke access anytime from account settings.
        </p>
      </div>
    </div>
  );
}
