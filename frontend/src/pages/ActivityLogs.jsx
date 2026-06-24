import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  LayoutDashboard, Ticket, Users, ScrollText, Search, RefreshCw,
  LogOut, ShieldCheck, Activity, Clock, LogIn, FileStack, Power, BarChart3
} from 'lucide-react';

/* ---------- animated counter ---------- */
function CountUp({ value, duration = 950 }) {
  const [n, setN] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) { setN(0); ref.current = 0; return; }
    let raf; const start = performance.now(); const from = ref.current;
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick); else ref.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n}</>;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{"name":"Admin User"}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchLogs();
  }, [navigate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Accessing the paginated data (.data) from Laravel
      const res = await api.get('/activity-logs');
      setLogs(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  // --- ACTION FORMATTER ---
  const formatAction = (action) => {
    const map = {
      'ticket_created': { text: 'Created a Ticket', icon: '📝', color: '#2563eb', bg: '#eff6ff' },
      'ticket_updated': { text: 'Updated Ticket Details', icon: '✏️', color: '#d97706', bg: '#fffbeb' },
      'ticket_reassigned': { text: 'Reassigned a Ticket', icon: '🔄', color: '#7c3aed', bg: '#f5f3ff' },
      'ticket_escalated': { text: 'Escalated a Ticket', icon: '⚠️', color: '#e11d48', bg: '#ffe4e6' },
      'ticket_cancelled': { text: 'Cancelled a Ticket', icon: '🚫', color: '#475569', bg: '#f1f5f9' },
      'comment_added': { text: 'Added a Comment', icon: '💬', color: '#059669', bg: '#f0fdf4' },
      'internal_note_added': { text: 'Added Internal Note', icon: '🔒', color: '#ea580c', bg: '#ffedd5' },
      'user_login': { text: 'Logged In', icon: '🔑', color: '#0d9488', bg: '#ccfbf1' },
      'user_logout': { text: 'Logged Out', icon: '🚪', color: '#64748b', bg: '#f8fafc' },
      'user_registered': { text: 'Provisioned New User', icon: '👤', color: '#0284c7', bg: '#e0f2fe' },
      'profile_updated': { text: 'Updated Profile', icon: '⚙️', color: '#4f46e5', bg: '#e0e7ff' },
      'password_changed': { text: 'Changed Password', icon: '🔐', color: '#4f46e5', bg: '#e0e7ff' },
      'login_failed': { text: 'Failed Login Attempt', icon: '❗', color: '#d97706', bg: '#fef3c7' },
      'admin_login_failed': { text: 'Failed Admin Login', icon: '🛡️', color: '#d97706', bg: '#fef3c7' },
      'account_locked': { text: 'Account Locked', icon: '🔒', color: '#e11d48', bg: '#ffe4e6' },
    };
    return map[action] || { text: action.replace(/_/g, ' ').toUpperCase(), icon: '⚡', color: '#475569', bg: '#f1f5f9' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown Time';
    return new Date(dateStr.replace(' ', 'T') + 'Z').toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const parseDetails = (jsonStr) => {
    if (!jsonStr) return null;
    try {
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      return Object.entries(parsed).map(([key, value]) => `${key}: ${value}`).join(' | ');
    } catch (e) { return null; }
  };

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const author = (log.user_name || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const entity = (log.entity_type || '').toLowerCase();
    return author.includes(q) || action.includes(q) || entity.includes(q);
  });

  /* ---------- derived summary stats ---------- */
  const todayStr = new Date().toDateString();
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    try { return new Date(dateStr.replace(' ', 'T') + 'Z').toDateString() === todayStr; }
    catch (e) { return false; }
  };
  const stats = {
    total: logs.length,
    today: logs.filter(l => isToday(l.created_at)).length,
    logins: logs.filter(l => l.action === 'user_login').length,
    tickets: logs.filter(l => (l.action || '').startsWith('ticket_')).length,
  };

  const navLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/tickets', label: 'Incident Tickets', icon: Ticket },
    { to: '/roster', label: 'Agent Roster', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/activity-logs', label: 'System Audit Log', icon: ScrollText, active: true },
  ];

  const statCards = [
    { label: 'Total Events', value: stats.total, icon: Activity, c1: '#0ea5e9', c2: '#0284c7', tint: '#e0f2fe' },
    { label: 'Today', value: stats.today, icon: Clock, c1: '#10b981', c2: '#059669', tint: '#d1fae5' },
    { label: 'Sign-ins', value: stats.logins, icon: LogIn, c1: '#14b8a6', c2: '#0d9488', tint: '#ccfbf1' },
    { label: 'Ticket Events', value: stats.tickets, icon: FileStack, c1: '#8b5cf6', c2: '#7c3aed', tint: '#f3e8ff' },
  ];

  return (
    <div className="cc-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        .cc-wrap {
          --ink:#102a43; --ink-soft:#334e68; --muted:#627d98; --muted-2:#9fb3c8;
          --cloud:#f3f9ff; --cloud-2:#e9f3fe; --surface:#ffffff;
          --border:#e1eefc; --border-2:#c5dcf6;
          --volt:#0284c7; --volt-2:#0ea5e9; --volt-3:#38bdf8; --volt-soft:#e0f2fe;
          font-family:'Plus Jakarta Sans',system-ui,sans-serif;
          color:var(--ink);
        }
        .cc-wrap *{ box-sizing:border-box; }
        @keyframes ccFade{ from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:none;} }
        @keyframes ccPop{ 0%{opacity:0; transform:scale(.9);} 60%{opacity:1; transform:scale(1.04);} 100%{transform:scale(1);} }
        @keyframes ccShine{ 0%{transform:translateX(-120%);} 100%{transform:translateX(220%);} }
        @keyframes ccFloat{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-9px);} }
        @keyframes ccFloatB{ 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(10px) scale(1.04);} }
        @keyframes ccPulse{ 0%{box-shadow:0 0 0 0 rgba(16,185,129,.5);} 70%{box-shadow:0 0 0 7px rgba(16,185,129,0);} 100%{box-shadow:0 0 0 0 rgba(16,185,129,0);} }
        @keyframes ccDot{ 0%{transform:scale(.85); opacity:.6;} 50%{transform:scale(1); opacity:1;} 100%{transform:scale(.85); opacity:.6;} }
        @keyframes ccGrow{ from{height:0;} to{height:100%;} }

        .cc-nav-link{ display:flex; align-items:center; gap:11px; padding:10px 13px; border-radius:11px;
          text-decoration:none; color:var(--ink-soft); font-weight:600; font-size:13.5px;
          border:1px solid transparent; transition:all .18s ease; cursor:pointer; }
        .cc-nav-link:hover{ background:var(--cloud-2); color:var(--volt); transform:translateX(2px); }
        .cc-nav-link.active{ background:linear-gradient(135deg,#0ea5e9,#0284c7); color:#fff;
          box-shadow:0 8px 20px -7px rgba(2,132,199,.6); }
        .cc-nav-link.active svg{ color:#fff; }

        .cc-icon-btn{ display:inline-flex; align-items:center; gap:8px; background:var(--surface);
          border:1.5px solid var(--border-2); border-radius:11px; padding:9px 15px; cursor:pointer;
          color:var(--ink); font-size:12.5px; font-weight:700; font-family:inherit; transition:all .16s ease; }
        .cc-icon-btn:hover{ border-color:var(--volt-2); color:var(--volt); box-shadow:0 6px 16px -8px rgba(2,132,199,.5); transform:translateY(-1px); }

        .cc-search{ width:340px; max-width:42vw; padding:10px 14px 10px 38px; border:1.5px solid var(--border-2);
          border-radius:11px; outline:none; font-size:13px; color:var(--ink); background:var(--surface); font-family:inherit; transition:all .16s ease; }
        .cc-search:focus{ border-color:var(--volt-2); box-shadow:0 0 0 4px rgba(14,165,233,.13); }
        .cc-search::placeholder{ color:var(--muted-2); }

        .cc-stat{ position:relative; overflow:hidden; background:var(--surface); border:1px solid var(--border);
          border-radius:18px; padding:18px 18px 16px; box-shadow:0 10px 26px -18px rgba(16,42,67,.4);
          animation:ccFade .55s ease both; transition:transform .18s ease, box-shadow .18s ease; }
        .cc-stat:hover{ transform:translateY(-4px); box-shadow:0 18px 38px -20px rgba(2,132,199,.5); }
        .cc-stat .shine{ position:absolute; top:0; left:0; width:40%; height:100%;
          background:linear-gradient(110deg,transparent,rgba(255,255,255,.55),transparent); pointer-events:none; }
        .cc-stat:hover .shine{ animation:ccShine 1s ease; }

        .cc-tl{ position:relative; }
        .cc-tl-item{ position:relative; display:flex; gap:22px; animation:ccFade .5s ease both; }
        .cc-tl-card{ flex:1; background:var(--surface); border:1px solid var(--border); border-radius:14px;
          padding:14px 16px; box-shadow:0 6px 18px -14px rgba(16,42,67,.45); transition:all .18s ease; }
        .cc-tl-item:hover .cc-tl-card{ transform:translateX(4px); border-color:var(--border-2);
          box-shadow:0 14px 30px -18px rgba(2,132,199,.45); }
        .cc-tl-node{ position:relative; z-index:2; width:44px; height:44px; border-radius:14px;
          display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;
          background:#fff; box-shadow:0 6px 16px -8px rgba(16,42,67,.4); transition:transform .18s ease; }
        .cc-tl-item:hover .cc-tl-node{ transform:scale(1.08) rotate(-4deg); }

        .cc-chip{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700;
          padding:3px 9px; border-radius:999px; font-family:'JetBrains Mono',monospace; }
        .cc-detail{ font-size:12px; color:var(--ink-soft); background:var(--cloud); padding:7px 11px;
          border-radius:9px; display:inline-block; border:1px solid var(--border); margin-top:8px;
          font-family:'JetBrains Mono',monospace; }

        .cc-scroll::-webkit-scrollbar{ width:9px; }
        .cc-scroll::-webkit-scrollbar-thumb{ background:var(--border-2); border-radius:9px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', background: 'linear-gradient(160deg,#f3f9ff 0%,#e9f3fe 60%,#e0f2fe 100%)' }}>

        {/* decorative orbs */}
        <div style={{ position: 'fixed', top: -120, right: -80, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,.22),transparent 70%)', filter: 'blur(8px)', pointerEvents: 'none', animation: 'ccFloat 9s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: -140, left: 180, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,165,233,.16),transparent 70%)', filter: 'blur(8px)', pointerEvents: 'none', animation: 'ccFloatB 11s ease-in-out infinite', zIndex: 0 }} />

        {/* SIDEBAR */}
        <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 256, background: '#fff', borderRight: '1px solid var(--border)', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 0 40px -28px rgba(16,42,67,.35)' }}>
          <div>
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px -8px rgba(2,132,199,.6)' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '.5px' }}>IT</span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>CommandCenter</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 600, color: 'var(--volt)', textTransform: 'uppercase', letterSpacing: '1px' }}>Enterprise Ops</div>
                </div>
              </div>
            </div>
            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map(({ to, label, icon: Icon, active }) => (
                <a key={to} href={to} className={`cc-nav-link${active ? ' active' : ''}`}
                  onClick={(e) => { e.preventDefault(); if (!active) navigate(to); }}>
                  <Icon size={17} strokeWidth={2.1} /> {label}
                </a>
              ))}
            </nav>
          </div>
          <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cloud)', borderRadius: 13, padding: '11px 12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{currentUser.name?.charAt(0) || 'A'}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--muted)' }}>Administrator</p>
                </div>
              </div>
              <button onClick={handleLogout} title="Sign out" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--muted)', borderRadius: 8, display: 'flex' }}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

          {/* HEADER */}
          <header style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(243,249,255,.82)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '13px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 13, color: 'var(--muted-2)' }} />
              <input type="text" className="cc-search" placeholder="Search by user, action, or entity…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={fetchLogs} className="cc-icon-btn">
              <RefreshCw size={14} /> Refresh
            </button>
          </header>

          <div className="cc-scroll" style={{ padding: '26px 30px 50px', flex: 1, maxWidth: 1080, width: '100%', margin: '0 auto' }}>

            {/* HERO BANNER */}
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '26px 30px', marginBottom: 22, background: 'linear-gradient(120deg,#0284c7,#0ea5e9 55%,#38bdf8)', boxShadow: '0 22px 50px -26px rgba(2,132,199,.7)', animation: 'ccFade .5s ease both' }}>
              <div style={{ position: 'absolute', top: -50, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.13)' }} />
              <div style={{ position: 'absolute', bottom: -70, right: 120, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.09)' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', flexShrink: 0 }}>
                  <ShieldCheck size={28} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 25, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-.4px' }}>System Audit Log</h1>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.18)', padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#fff' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6ee7b7', animation: 'ccDot 1.4s ease-in-out infinite' }} /> LIVE
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,.9)', fontSize: 13, margin: '5px 0 0' }}>Complete chronological trail of every action across the CommandCenter.</p>
                </div>
              </div>
            </div>

            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 26 }}>
              {statCards.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="cc-stat" style={{ animationDelay: `${i * 0.07}s` }}>
                    <div className="shine" />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ink)', marginTop: 6, lineHeight: 1 }}>
                          <CountUp value={s.value} />
                        </div>
                      </div>
                      <div style={{ width: 42, height: 42, borderRadius: 13, background: s.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={21} color={s.c2} strokeWidth={2.2} />
                      </div>
                    </div>
                    <div style={{ marginTop: 14, height: 5, borderRadius: 99, background: 'var(--cloud-2)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: stats.total ? `${Math.min(100, Math.round((s.value / Math.max(1, stats.total)) * 100))}%` : '0%', borderRadius: 99, background: `linear-gradient(90deg,${s.c1},${s.c2})`, transition: 'width .9s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TIMELINE CARD */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', padding: '22px 26px 28px', boxShadow: '0 14px 40px -26px rgba(16,42,67,.4)', animation: 'ccFade .55s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--volt-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} color="var(--volt)" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Activity Timeline</h2>
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 0' }}>Newest events first</p>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--volt)', background: 'var(--volt-soft)', padding: '5px 12px', borderRadius: 999 }}>
                  {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
                  <div style={{ width: 34, height: 34, border: '3px solid var(--border-2)', borderTopColor: 'var(--volt)', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin .8s linear infinite' }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
                  Loading security logs…
                </div>
              ) : filteredLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
                  <ScrollText size={40} color="var(--border-2)" style={{ marginBottom: 12 }} />
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink-soft)' }}>No activity found</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5 }}>Try adjusting your search.</p>
                </div>
              ) : (
                <div className="cc-tl">
                  {filteredLogs.map((log, index) => {
                    const ui = formatAction(log.action);
                    const details = parseDetails(log.new_value) || parseDetails(log.old_value);
                    const isLast = index === filteredLogs.length - 1;

                    return (
                      <div key={log.id} className="cc-tl-item" style={{ paddingBottom: isLast ? 0 : 22, animationDelay: `${Math.min(index * 0.04, 0.6)}s` }}>

                        {/* timeline connector */}
                        {!isLast && <div style={{ position: 'absolute', top: 48, left: 21, bottom: 0, width: 2, background: 'linear-gradient(to bottom,var(--border-2),var(--border))' }} />}

                        {/* node */}
                        <div className="cc-tl-node" style={{ background: ui.bg, border: `1.5px solid ${ui.color}33` }}>
                          {ui.icon}
                        </div>

                        {/* card */}
                        <div className="cc-tl-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>
                                <strong style={{ fontWeight: 800 }}>{log.user_name || 'System'}</strong>{' '}
                                <span style={{ color: 'var(--ink-soft)' }}>{ui.text.toLowerCase()}</span>{' '}
                                {log.entity_type && (
                                  <span className="cc-chip" style={{ background: ui.bg, color: ui.color }}>
                                    {log.entity_type} #{log.entity_id}
                                  </span>
                                )}
                              </p>
                              {details && <div className="cc-detail">{details}</div>}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                                <Clock size={12} color="var(--muted-2)" /> {formatDate(log.created_at)}
                              </p>
                              <p style={{ margin: '5px 0 0', fontSize: 10.5, fontFamily: "'JetBrains Mono',monospace", color: 'var(--muted-2)' }}>
                                IP: {log.ip_address || 'Internal'}
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
