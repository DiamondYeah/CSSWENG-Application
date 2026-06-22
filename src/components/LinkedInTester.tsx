import React, { useState, useEffect } from "react";
import { Play, User, Send, LogOut, ShieldAlert, Key } from "lucide-react";

interface LogTrace {
  id: string;
  time: string;
  action: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  data: any;
}

export default function LinkedInTester() {
  const [clientId, setClientId] = useState("86ueodthd34mj9");
  const [clientSecret, setClientSecret] = useState("WPL_AP1.KHCDfjSrRqBkXU04.29is7A==");
  const [capturedCode, setCapturedCode] = useState("");
  const [token, setToken] = useState("");
  const [authorUrn, setAuthorUrn] = useState("");
  const [profile, setProfile] = useState<any>(null);

  const [commentary, setCommentary] = useState(""); // Common text content for posts *sample body*
  const [mediaType, setMediaType] = useState<"TEXT" | "IMAGE" | "VIDEO">("TEXT");
  const [file, setFile] = useState<File | null>(null);

  const [logs, setLogs] = useState<LogTrace[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizeLogData = (value: any) => {
    if (value instanceof Error) {
      return { message: value.message, stack: value.stack };
    }
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        const normalized: Record<string, any> = {};
        for (const key of Object.keys(value)) {
          try {
            normalized[key] = JSON.parse(JSON.stringify(value[key]));
          } catch {
            normalized[key] = String(value[key]);
          }
        }
        return normalized;
      }
    }
    return value;
  };

  const addLog = (action: string, status: "PENDING" | "SUCCESS" | "FAILED", data: any) => {
    setLogs(prev => [{ id: Math.random().toString(), time: new Date().toLocaleTimeString(), action, status, data: normalizeLogData(data) }, ...prev]);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setCapturedCode(code);
      addLog("OAuth Callback Captured", "SUCCESS", { code, message: "Code detected! Click 'Trade Code for Token' to authorize." });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = () => {
    if (!clientId) return addLog("Auth", "FAILED", { error: "Client ID required." });
    addLog("OAuth Login Redirect", "PENDING", "Redirecting session to LinkedIn verification screen...");
    const redirect = encodeURIComponent("http://localhost:5173/linkedin/callback");
    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirect}&scope=openid%20profile%20email%20w_member_social`;
  };

  const fetchProfile = async (accessToken?: string) => {
    const accessTokenToUse = accessToken || token;
    addLog("Fetch Account Info", "PENDING", "Resolving member profile from LinkedIn...");
    try {
      const res = await fetch("http://localhost:3001/api/userinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessTokenToUse })
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setProfile(data);
      setAuthorUrn(`urn:li:person:${data.sub}`);
      addLog("Fetch Account Info", "SUCCESS", data);
    } catch (e: any) {
      const normalizedError = e instanceof Error ? { message: e.message, stack: e.stack } : normalizeLogData(e);
      addLog("Fetch Account Info", "FAILED", normalizedError);
    }
  };

  const tradeCodeForToken = async () => {
    if (!capturedCode) return addLog("Token Exchange", "FAILED", { error: "No temporary auth code found. Login first." });
    addLog("Token Exchange", "PENDING", "Trading auth code for an Access Token...");
    
    try {
      const res = await fetch("http://localhost:3001/api/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: capturedCode, client_id: clientId, client_secret: clientSecret })
      });
      const data = await res.json();
      if (!res.ok) throw data;
      
      if (data.access_token) {
        setToken(data.access_token);
        addLog("Token Exchange", "SUCCESS", { message: "Access Token extracted and configured!", data });
        await fetchProfile(data.access_token);
      }
    } catch (e: any) {
      addLog("Token Exchange", "FAILED", { message: e.message || "Network error", errorObject: String(e) });
    }
  };

  const handleLogout = async () => {
    addLog("Revoking Token", "PENDING", "Calling proxy token death endpoint...");
    try {
      const res = await fetch("http://localhost:3001/api/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, client_id: clientId, client_secret: clientSecret })
      });
      const out = await res.json();
      setToken(""); setProfile(null); setAuthorUrn(""); setCapturedCode("");
      addLog("Token Revoked", "SUCCESS", out);
    } catch (e: any) { 
      addLog("Token Revoked", "FAILED", { message: e.message || "Logout error", errorObject: String(e) }); 
    }
  };

  const handlePostPipeline = async () => {
    if ((mediaType === 'IMAGE' || mediaType === 'VIDEO') && !file) {
      return addLog("Execution Pipeline", "FAILED", { error: 'Please select an image or video file before posting.' });
    }

    if (!authorUrn) {
      return addLog("Execution Pipeline", "FAILED", { error: 'Author URN is required. Get account info or authenticate first.' });
    }

    addLog("Execution Pipeline", "PENDING", `Running automated sequence for type: ${mediaType}`);
    setLoading(true);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("authorUrn", authorUrn);
    formData.append("commentary", commentary);
    formData.append("mediaType", mediaType);
    if (file) formData.append("file", file);

    try {
      const res = await fetch("http://localhost:3001/api/post", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw data;
      addLog("Execution Pipeline", "SUCCESS", data);
    } catch (e: any) { 
      const normalizedError = e instanceof Error ? { message: e.message, stack: e.stack } : normalizeLogData(e);
      addLog("Execution Pipeline", "FAILED", normalizedError); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <h2>LinkedIn Integration Sandbox </h2>
        <span style={styles.pill}>Backend Link: Active (Port 3001)</span>
      </header>

      <div style={styles.layout}>
        <div style={styles.panel}>
          <h3>1. Authentication & Session</h3>
          <div style={styles.row}>
            <input placeholder="Client ID" value={clientId} onChange={e=>setClientId(e.target.value)} style={styles.input}/>
            <input placeholder="Client Secret" type="password" value={clientSecret} onChange={e=>setClientSecret(e.target.value)} style={styles.input}/>
          </div>
          
          <div style={{...styles.row, marginTop: '10px'}}>
            <button onClick={handleLogin} style={styles.btn}><Play size={12}/> Fetch OAuth URL & Login</button>
            {capturedCode && (
              <button onClick={tradeCodeForToken} style={{...styles.btn, backgroundColor: '#4caf50'}}><Key size={12}/> Trade Code for Token</button>
            )}
            <button onClick={handleLogout} style={{...styles.btn, backgroundColor: '#c62828'}}><LogOut size={12}/> Revoke Token (Logout)</button>
          </div>

          <input placeholder="Access Token String (Auto-populated or paste manually)" value={token} onChange={e=>setToken(e.target.value)} style={{...styles.input, marginTop: '12px'}}/>

          <hr style={styles.hr}/>

          <h3>2. Account Metric Acquisition</h3>
          <button onClick={() => fetchProfile()} style={{...styles.btn, backgroundColor: '#0288d1'}}><User size={12}/> Get Account Info</button>

          <hr style={styles.hr}/>

          <h3>3. Production Posting Pipeline</h3>
          <input placeholder="Write a post here..." value={commentary} onChange={e=>setCommentary(e.target.value)} style={styles.input}/>
          <div style={{...styles.row, marginTop: '8px'}}>
            <select value={mediaType} onChange={e=>setMediaType(e.target.value as any)} style={styles.input}>
              <option value="TEXT">Write a post </option>
              <option value="IMAGE">Upload Image</option>
              <option value="VIDEO">Upload Video</option>
            </select>
            {mediaType !== 'TEXT' && <input type="file" accept={mediaType==='IMAGE'?'image/*':'video/*'} onChange={e=>setFile(e.target.files?e.target.files[0]:null)} style={styles.input}/>}
          </div>

          <button onClick={handlePostPipeline} disabled={loading} style={{...styles.btn, backgroundColor: '#ff9800', width: '100%', marginTop: '15px'}}>
            <Send size={12}/> {loading ? "Streaming Content Pipeline..." : `Deploy Content Post (${mediaType})`}
          </button>
        </div>

        <div style={styles.panel}>
          <h3>Active Account Identity Scope</h3>
          <div style={styles.profileBox}>
            {profile ? (
              <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                <img src={profile.picture || "https://placehold.co/40"} alt="" style={{width: 40, height: 40, borderRadius: '50%'}}/>
                <div>
                  <h4 style={{margin:0}}>{profile.name}</h4>
                  <span style={{fontSize: 10, color: '#aaa'}}>URN: {authorUrn}</span>
                </div>
              </div>
            ) : <div style={{color: '#666', fontSize: 12}}><ShieldAlert size={12}/> Awaiting authenticated session profile metrics.</div>}
          </div>

          <h3>Automated Telemetry Logs</h3>
          <div style={styles.terminal}>
            {logs.length === 0 && <span style={{color: '#333'}}>Idle system matrix monitor.</span>}
            {logs.map(l => (
              <div key={l.id} style={{marginBottom: 10, fontSize: 11, borderBottom: '1px solid #222', paddingBottom: 6}}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span>[{l.time}] <b style={{color: '#00bcd4'}}>{l.action}</b></span>
                  <b style={{color: l.status==='SUCCESS'?'#4caf50':l.status==='FAILED'?'#f44336':'#ffeb3b'}}>{l.status}</b>
                </div>
                <pre style={styles.json}>{JSON.stringify(l.data, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { fontFamily: 'monospace', padding: 20, backgroundColor: '#0c0c0e', color: '#e2e2e5', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: 10, marginBottom: 20 },
  pill: { backgroundColor: '#1e1e24', padding: '4px 8px', fontSize: 11, borderRadius: 4, color: '#0a66c2', fontWeight: 'bold' },
  layout: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  panel: { flex: '1 1 450px', backgroundColor: '#141417', padding: 20, borderRadius: 6, border: '1px solid #222' },
  row: { display: 'flex', gap: 10 },
  input: { width: '100%', padding: 8, backgroundColor: '#1e1e24', border: '1px solid #2d2d34', borderRadius: 4, color: '#fff', fontSize: 12 },
  btn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: 'none', borderRadius: 4, backgroundColor: '#0a66c2', color: '#fff', fontWeight: 'bold', fontSize: 11, cursor: 'pointer' },
  hr: { border: 0, borderTop: '1px solid #222', margin: '15px 0' },
  profileBox: { backgroundColor: '#1a1a20', padding: 12, borderRadius: 4, border: '1px solid #2d2d34', marginBottom: 15 },
  terminal: { backgroundColor: '#050506', padding: 12, borderRadius: 4, height: 380, overflowY: 'auto', border: '1px solid #222' },
  json: { backgroundColor: '#0e0e11', padding: 6, color: '#9cdcfe', overflowX: 'auto', margin: '4px 0 0 0', borderRadius: 3 }
};