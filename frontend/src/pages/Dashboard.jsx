import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:           #f4f6fb;
      --bg-2:         #eef1f8;
      --surface:      #ffffff;
      --surface-2:    #f8faff;
      --border:       #e4e9f4;
      --border-2:     #d0d8ef;
      --accent:       #4f46e5;
      --accent-light: #ede9fe;
      --accent-mid:   #7c73f0;
      --sky:          #0ea5e9;
      --sky-light:    #e0f2fe;
      --rose:         #f43f5e;
      --rose-light:   #ffe4e9;
      --amber:        #f59e0b;
      --amber-light:  #fef3c7;
      --emerald:      #10b981;
      --emerald-light:#d1fae5;
      --txt-primary:  #0f172a;
      --txt-secondary:#475569;
      --txt-muted:    #94a3b8;
      --shadow-sm:    0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
      --shadow-md:    0 4px 16px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.05);
      --shadow-lg:    0 12px 40px rgba(15,23,42,0.12), 0 4px 12px rgba(15,23,42,0.06);
      --shadow-accent: 0 8px 28px rgba(79,70,229,0.22);
      --font-body:    'Plus Jakarta Sans', sans-serif;
      --font-mono:    'JetBrains Mono', monospace;
      --radius-sm:    8px;
      --radius-md:    12px;
      --radius-lg:    16px;
      --radius-xl:    20px;
    }

    body {
      background: var(--bg);
      color: var(--txt-primary);
      font-family: var(--font-body);
      -webkit-font-smoothing: antialiased;
    }

    /* ── Animations ── */
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes barGrow {
      from { transform: scaleY(0); opacity: 0; }
      to   { transform: scaleY(1); opacity: 1; }
    }
    @keyframes progressFill {
      from { width: 0%; }
    }
    @keyframes pulseDot {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.4; transform:scale(.65); }
    }
    @keyframes floatA {
      0%,100% { transform: translateY(0)   scale(1); }
      50%      { transform: translateY(-24px) scale(1.04); }
    }
    @keyframes floatB {
      0%,100% { transform: translateY(0)   scale(1); }
      50%      { transform: translateY(20px) scale(1.03); }
    }
    @keyframes modalIn {
      from { opacity:0; transform:translateY(28px) scale(.96); }
      to   { opacity:1; transform:translateY(0)    scale(1); }
    }
    @keyframes overlayIn {
      from { opacity:0; } to { opacity:1; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes shimmerSlide {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes countUp {
      from { opacity:0; transform:translateY(6px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ── Utility ── */
    .fade-up   { animation: fadeSlideUp .45s ease both; }
    .fade-in   { animation: fadeIn .3s ease both; }

    .stat-card {
      animation: fadeSlideUp .45s ease both;
      transition: transform .22s ease, box-shadow .22s ease;
      cursor: default;
    }
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    .ticket-row {
      transition: background .18s, transform .18s;
      cursor: pointer;
    }
    .ticket-row:hover {
      background: #f5f3ff !important;
      transform: translateX(2px);
    }
    .ticket-row:hover .t-title { color: var(--accent) !important; }

    .nav-item {
      transition: background .18s, color .18s;
      position: relative;
    }
    .nav-item::after {
      content: '';
      position: absolute; left: 0; top: 20%; bottom: 20%;
      width: 3px; border-radius: 2px;
      background: var(--accent);
      opacity: 0; transition: opacity .18s;
    }
    .nav-item.active::after { opacity: 1; }

    .bar-col { transition: filter .2s; cursor: default; }
    .bar-col:hover .bar-inner { filter: brightness(1.1); }

    .progress-fill {
      animation: progressFill 1.1s cubic-bezier(.4,0,.2,1) both;
    }

    .btn-primary {
      transition: transform .15s, box-shadow .15s;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-accent);
    }

    .btn-ghost {
      transition: background .15s, color .15s;
    }
    .btn-ghost:hover { background: var(--bg-2); }

    .modal-overlay { animation: overlayIn .25s ease both; }
    .modal-panel   { animation: modalIn .35s cubic-bezier(.34,1.56,.64,1) both; }

    .live-dot { animation: pulseDot 1.6s ease-in-out infinite; }

    .input-field {
      transition: border-color .18s, box-shadow .18s;
    }
    .input-field:focus {
      outline: none;
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 3px rgba(79,70,229,.1);
    }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent-mid); }

    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 9px; border-radius: 6px;
      font-size: 10px; font-weight: 700;
      font-family: var(--font-mono);
      letter-spacing: .04em; text-transform: uppercase;
      border: 1px solid transparent;
    }

    .orb-a {
      animation: floatA 9s ease-in-out infinite;
      pointer-events: none;
    }
    .orb-b {
      animation: floatB 12s ease-in-out infinite;
      pointer-events: none;
    }

    .detail-grid-row { transition: background .14s; }
    .detail-grid-row:hover { background: #f8f7ff; }

    .chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 20px;
      font-family: var(--font-mono); font-size: 10px; font-weight: 600;
      letter-spacing: .05em; text-transform: uppercase;
    }
  `}</style>
);

/* ─────────────── Ticket Detail Modal ─────────────── */
function TicketModal({ ticket, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!ticket) return null;

  const pId = Number(ticket.priority_id);
  const pName = pId === 4 ? 'Critical' : pId === 3 ? 'High' : pId === 2 ? 'Medium' : 'Low';
  const sId = Number(ticket.status_id);
  const sName = sId === 2 ? 'In Progress' : sId === 3 ? 'Resolved' : 'Open';

  const pStyle = {
    Critical: { bg: '#fff1f2', border: '#fecdd3', color: '#e11d48', dot: '#f43f5e' },
    High:     { bg: '#fffbeb', border: '#fde68a', color: '#d97706', dot: '#f59e0b' },
    Medium:   { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', dot: '#3b82f6' },
    Low:      { bg: '#f0fdf4', border: '#bbf7d0', color: '#059669', dot: '#10b981' },
  }[pName];

  const sStyle = {
    Open:         { bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed' },
    'In Progress':{ bg: '#fffbeb', border: '#fde68a', color: '#d97706' },
    Resolved:     { bg: '#f0fdf4', border: '#bbf7d0', color: '#059669' },
  }[sName] || { bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed' };

  const ticketNum  = ticket.ticket_number || `TKT-00${ticket.id}`;
  const createdAt  = ticket.created_at
    ? new Date(ticket.created_at).toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Just now';
  const updatedAt  = ticket.updated_at
    ? new Date(ticket.updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const fields = [
    ['Ticket ID',     `#${ticket.id}`],
    ['Reference',     ticketNum],
    ['Category',      ticket.category_id ? `Category ${ticket.category_id}` : 'Unclassified'],
    ['Assigned To',   ticket.agent_name || ticket.assigned_to || 'Unassigned'],
    ['Reporter',      ticket.user_name  || ticket.reported_by || 'System'],
    ['Department',    ticket.department || 'IT Operations'],
    ['Created',       createdAt],
    ['Last Updated',  updatedAt],
  ];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 22,
          width: '100%', maxWidth: 600,
          boxShadow: '0 32px 80px rgba(15,23,42,0.2), 0 0 0 1px rgba(15,23,42,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '22px 26px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, #faf9ff 0%, #f0f4ff 100%)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                color: 'var(--accent)', letterSpacing: '.08em',
                background: 'var(--accent-light)', border: '1px solid #c4b5fd',
                padding: '3px 10px', borderRadius: 6,
              }}>
                {ticketNum}
              </span>
              <span className="badge" style={{ background: pStyle.bg, borderColor: pStyle.border, color: pStyle.color }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: pStyle.dot, display: 'inline-block', flexShrink: 0 }}/>
                {pName}
              </span>
              <span className="badge" style={{ background: sStyle.bg, borderColor: sStyle.border, color: sStyle.color }}>
                {sName}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 800, color: 'var(--txt-primary)', lineHeight: 1.3 }}>
              {ticket.title || 'Untitled Incident'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              color: 'var(--txt-secondary)', cursor: 'pointer',
              borderRadius: 10, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px' }}>
          {ticket.description && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 7 }}>Description</p>
              <p style={{ fontSize: 13, color: 'var(--txt-secondary)', lineHeight: 1.75, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '13px 15px' }}>
                {ticket.description}
              </p>
            </div>
          )}

          {/* Detail grid */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {fields.map(([label, value], i) => (
              <div
                key={i}
                className="detail-grid-row"
                style={{
                  display: 'grid', gridTemplateColumns: '130px 1fr',
                  borderBottom: i < fields.length - 1 ? '1px solid var(--border)' : 'none',
                  background: i % 2 === 0 ? '#fff' : 'var(--surface-2)',
                }}
              >
                <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                  {label}
                </div>
                <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--txt-primary)', display: 'flex', alignItems: 'center' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '9px 20px', borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--txt-secondary)' }}
          >
            Close
          </button>
          <button
            className="btn-primary"
            style={{ padding: '9px 22px', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', background: 'var(--accent)', border: 'none', color: '#fff', boxShadow: 'var(--shadow-accent)' }}
          >
            Manage Ticket →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Dashboard ─────────────── */
export default function Dashboard() {
  const [stats, setStats] = useState({ openTickets: 0, inProgress: 0, resolvedToday: 0, activeAgents: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Admin User"}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      setApiError(null);
      const statsRes = await api.get('/dashboard/stats');
      if (statsRes.data) setStats(statsRes.data);

      const tRes = await api.get('/tickets/recent');
      if (tRes.data && Array.isArray(tRes.data)) setRecentTickets(tRes.data);
      else if (tRes.data && Array.isArray(tRes.data.data)) setRecentTickets(tRes.data.data);
      else throw new Error('Unexpected response format from API.');
    } catch (err) {
      setApiError(err.message || 'Failed to connect to the data pipeline.');
      setRecentTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategories = () => {
    const total = recentTickets.length || 1;
    const counts = { 'Network Ops': 0, 'Hardware': 0, 'Access Control': 0, 'Software / OS': 0 };
    recentTickets.forEach(t => {
      const txt = (t.title || '').toLowerCase();
      let c = 'Software / OS';
      if (t.category_id === 1 || t.category_id === 3 || txt.includes('email') || txt.includes('vpn') || txt.includes('printer')) c = 'Network Ops';
      else if (t.category_id === 4 || txt.includes('password')) c = 'Access Control';
      else if (txt.includes('hardware') || txt.includes('disk') || txt.includes('memory')) c = 'Hardware';
      if (counts[c] !== undefined) counts[c]++;
    });
    const palette = [
      { bar: 'var(--accent)',   glow: 'rgba(79,70,229,.22)',  light: 'var(--accent-light)' },
      { bar: 'var(--sky)',      glow: 'rgba(14,165,233,.22)', light: 'var(--sky-light)' },
      { bar: 'var(--amber)',    glow: 'rgba(245,158,11,.22)', light: 'var(--amber-light)' },
      { bar: 'var(--emerald)', glow: 'rgba(16,185,129,.22)',  light: 'var(--emerald-light)' },
    ];
    return Object.entries(counts).map(([name, count], i) => ({
      name, count, percentage: Math.round((count / total) * 100), ...palette[i],
    }));
  };

  const getTimeline = () => {
    const p = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    recentTickets.forEach(t => {
      const id = Number(t.priority_id);
      if (id === 4) p.Critical++;
      else if (id === 3) p.High++;
      else if (id === 2) p.Medium++;
      else p.Low++;
    });
    const max = Math.max(...Object.values(p), 1);
    const palette = {
      Critical: { bar: 'var(--rose)',    light: 'var(--rose-light)',    glow: 'rgba(244,63,94,.2)' },
      High:     { bar: 'var(--amber)',   light: 'var(--amber-light)',   glow: 'rgba(245,158,11,.2)' },
      Medium:   { bar: 'var(--accent)',  light: 'var(--accent-light)',  glow: 'rgba(79,70,229,.2)' },
      Low:      { bar: 'var(--emerald)', light: 'var(--emerald-light)', glow: 'rgba(16,185,129,.2)' },
    };
    return Object.entries(p).map(([label, volume]) => ({
      label, volume,
      h: Math.max((volume / max) * 100, volume > 0 ? 6 : 0),
      ...palette[label],
    }));
  };

  const filteredTickets = recentTickets.filter(t =>
    !searchQuery ||
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.ticket_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pStyle = (name) => ({
    Critical: { bg: '#fff1f2', bc: '#fecdd3', color: '#e11d48', dot: '#f43f5e' },
    High:     { bg: '#fffbeb', bc: '#fde68a', color: '#d97706', dot: '#f59e0b' },
    Medium:   { bg: '#eff6ff', bc: '#bfdbfe', color: '#2563eb', dot: '#3b82f6' },
    Low:      { bg: '#f0fdf4', bc: '#bbf7d0', color: '#059669', dot: '#10b981' },
  }[name] || { bg: '#f0fdf4', bc: '#bbf7d0', color: '#059669', dot: '#10b981' });

  const sStyle = (name) => ({
    'Open':        { bg: '#f5f3ff', bc: '#ddd6fe', color: '#7c3aed' },
    'In Progress': { bg: '#fffbeb', bc: '#fde68a', color: '#d97706' },
    'Resolved':    { bg: '#f0fdf4', bc: '#bbf7d0', color: '#059669' },
  }[name] || { bg: '#f5f3ff', bc: '#ddd6fe', color: '#7c3aed' });

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  const categories = getCategories();
  const timeline   = getTimeline();

  /* ── Loading ── */
  if (loading) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 8, border: '2px solid var(--border)', borderBottomColor: 'var(--sky)', borderRadius: '50%', animation: 'spin 1.1s linear infinite reverse' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase' }}>Connecting to pipeline</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)', marginTop: 4 }}>Querying PostgreSQL…</p>
        </div>
      </div>
    </>
  );

  /* ── Main Render ── */
  return (
    <>
      <GlobalStyles />
      {selectedTicket && <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>

        {/* Soft ambient shapes */}
        <div className="orb-a" style={{ position: 'fixed', top: '-8%', right: '2%', width: 640, height: 640, background: 'radial-gradient(circle, rgba(79,70,229,.07) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />
        <div className="orb-b" style={{ position: 'fixed', bottom: '-10%', left: '5%', width: 560, height: 560, background: 'radial-gradient(circle, rgba(14,165,233,.06) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'fixed', top: '45%', left: '35%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(245,158,11,.04) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

        {/* ── Sidebar ── */}
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 252,
          background: '#fff',
          borderRight: '1px solid var(--border)',
          zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '4px 0 24px rgba(15,23,42,0.04)',
        }}>
          <div>
            {/* Logo */}
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 13,
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(79,70,229,.3)',
                }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '.04em' }}>IT</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-.3px' }}>CommandCenter</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--accent)', letterSpacing: '.14em', textTransform: 'uppercase', marginTop: 2 }}>Enterprise Ops</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { emoji: '◧', label: 'Overview',         active: true  },
                { emoji: '⊟', label: 'Incident Tickets', active: false },
                { emoji: '◎', label: 'Agent Roster',     active: false },
                { emoji: '△', label: 'SLA Monitor',      active: false },
                { emoji: '⊕', label: 'Analytics',        active: false },
              ].map(({ emoji, label, active }, i) => (
                <a
                  key={i}
                  href="#"
                  className={`nav-item${active ? ' active' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px 10px 18px', borderRadius: 10,
                    textDecoration: 'none',
                    background: active ? 'var(--accent-light)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--txt-secondary)',
                    fontWeight: active ? 600 : 500, fontSize: 13,
                    animation: `fadeSlideUp .4s ease ${i * .055}s both`,
                  }}
                >
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
                  <span>{label}</span>
                  {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px rgba(79,70,229,.5)' }} />}
                </a>
              ))}
            </nav>

            {/* Quick Stats pill */}
            <div style={{ margin: '8px 12px 0', padding: '14px 16px', background: 'var(--accent-light)', borderRadius: 12, border: '1px solid #c4b5fd' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Queue Summary</p>
              {[
                { label: 'Open',        val: stats.openTickets || recentTickets.length, color: 'var(--accent)' },
                { label: 'In Progress', val: stats.inProgress || 0,  color: 'var(--amber)' },
                { label: 'Resolved',    val: stats.resolvedToday || 0, color: 'var(--emerald)' },
              ].map(({ label, val, color }, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 2 ? 7 : 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--txt-secondary)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User */}
          <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent-light), #e0e7ff)',
                  border: '1px solid #c4b5fd',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: 'var(--accent)',
                }}>
                  {user.name?.charAt(0) || 'A'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--txt-muted)', letterSpacing: '.07em' }}>Systems Lead</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost"
                title="Logout"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 7px', color: 'var(--txt-muted)', borderRadius: 8, fontSize: 14 }}
              >⏻</button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ marginLeft: 252, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <header style={{
            position: 'sticky', top: 0, zIndex: 15,
            background: 'rgba(244,246,251,.88)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 30px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 0 var(--border)',
            animation: 'fadeIn .4s ease',
          }}>
            <div style={{ position: 'relative', width: 380 }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-muted)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Search tickets, references, incidents…"
                className="input-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                  border: '1.5px solid var(--border)', borderRadius: 12,
                  background: '#fff', fontSize: 12, fontFamily: 'var(--font-body)',
                  color: 'var(--txt-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--emerald-light)', border: '1px solid #a7f3d0', borderRadius: 8, padding: '6px 12px' }}>
                <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'block' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#059669', letterSpacing: '.1em' }}>LIVE</span>
              </div>
              <button
                onClick={fetchDashboardData}
                className="btn-ghost"
                style={{
                  background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10,
                  padding: '8px 16px', cursor: 'pointer', color: 'var(--txt-secondary)',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                ↻ Refresh
              </button>
            </div>
          </header>

          {/* Content */}
          <div style={{ padding: '28px 30px', flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto' }}>

            {/* Page title */}
            <div className="fade-up" style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-.5px', margin: '0 0 4px' }}>
                System Overview
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--txt-secondary)' }}>
                Real-time analytics · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Error banner */}
            {apiError && (
              <div style={{ marginBottom: 20, padding: '13px 18px', background: 'var(--rose-light)', border: '1px solid #fecdd3', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeSlideUp .3s ease' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12, color: '#be123c', fontWeight: 500 }}>
                  <strong>Connection Error:</strong> {apiError} — Make sure your backend is running on port 8000.
                </p>
              </div>
            )}

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
              {[
                { title: 'Pipeline Total',   value: recentTickets.length,     icon: '⊟', grad: 'linear-gradient(135deg,#4f46e5,#7c73f0)', glow: 'rgba(79,70,229,.2)',  d: '0s'    },
                { title: 'In Evaluation',    value: stats.inProgress || 0,    icon: '⌛', grad: 'linear-gradient(135deg,#f59e0b,#fb923c)', glow: 'rgba(245,158,11,.2)', d: '.08s'  },
                { title: 'Resolved Today',   value: stats.resolvedToday || 0, icon: '✓',  grad: 'linear-gradient(135deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,.2)', d: '.16s'  },
                { title: 'Active Agents',    value: stats.activeAgents || 0,  icon: '◉',  grad: 'linear-gradient(135deg,#0ea5e9,#6366f1)', glow: 'rgba(14,165,233,.2)', d: '.24s'  },
              ].map((s, i) => (
                <div
                  key={i}
                  className="stat-card"
                  style={{
                    background: '#fff', border: '1.5px solid var(--border)',
                    borderRadius: 16, padding: '20px 22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    animationDelay: s.d,
                  }}
                >
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.12em', margin: '0 0 8px' }}>{s.title}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 32, fontWeight: 800, color: 'var(--txt-primary)', margin: 0, lineHeight: 1, animation: `countUp .5s ease ${s.d} both` }}>{s.value}</p>
                  </div>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', boxShadow: `0 8px 22px ${s.glow}` }}>
                    {s.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 22 }}>

              {/* Bar chart */}
              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp .5s ease .2s both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Incident Severity Density</h3>
                    <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)' }}>Live priority distribution</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--txt-secondary)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 10px' }}>
                    {recentTickets.length} total
                  </span>
                </div>

                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 16, paddingBottom: 8, borderBottom: '1.5px solid var(--border)' }}>
                  {timeline.map((d, i) => (
                    <div key={i} className="bar-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--txt-secondary)' }}>{d.volume}</span>
                      <div
                        className="bar-inner"
                        style={{
                          width: '100%', maxWidth: 52,
                          height: `${d.h}%`, minHeight: d.volume > 0 ? 4 : 0,
                          background: d.bar, borderRadius: '8px 8px 4px 4px',
                          boxShadow: `0 4px 18px ${d.glow}`,
                          transformOrigin: 'bottom',
                          animation: `barGrow .7s cubic-bezier(.34,1.56,.64,1) ${i * .09 + .3}s both`,
                          transition: 'filter .2s',
                        }}
                      />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bars */}
              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp .5s ease .3s both', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Infrastructure Impact</h3>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)' }}>Category breakdown</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
                  {categories.map((item, i) => (
                    <div key={i} style={{ animation: `fadeSlideUp .4s ease ${i * .08 + .35}s both` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: item.bar, flexShrink: 0, display: 'block' }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)' }}>{item.name}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: item.bar }}>{recentTickets.length > 0 ? `${item.percentage}%` : '0%'}</span>
                      </div>
                      <div style={{ height: 7, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden' }}>
                        <div
                          className="progress-fill"
                          style={{
                            height: '100%',
                            width: recentTickets.length > 0 ? `${item.percentage}%` : '0%',
                            background: item.bar,
                            borderRadius: 999,
                            boxShadow: `0 2px 8px ${item.glow}`,
                            animationDelay: `${i * .1 + .45}s`,
                            animationDuration: '1.1s',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--emerald)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
                    ✓ PostgreSQL Pipeline Synced
                  </span>
                </div>
              </div>
            </div>

            {/* Tickets Table */}
            <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp .5s ease .4s both' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(to right, var(--surface-2), #fff)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Active Pipeline Incidents</h2>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)' }}>
                    {searchQuery ? `${filteredTickets.length} of ${recentTickets.length} results` : `${recentTickets.length} live entries`} · Click any row to view full details
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--emerald)', display: 'block' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--txt-secondary)', letterSpacing: '.1em' }}>LIVE SYNC</span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                      {['Reference ID', 'Description', 'Severity', 'Status', 'Logged'].map((h, i) => (
                        <th key={i} style={{ padding: '11px 20px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.12em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--txt-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {searchQuery ? `No tickets matching "${searchQuery}"` : 'No active incidents found in the database.'}
                        </td>
                      </tr>
                    ) : filteredTickets.map((ticket, idx) => {
                      const pId = Number(ticket.priority_id);
                      const pName = pId === 4 ? 'Critical' : pId === 3 ? 'High' : pId === 2 ? 'Medium' : 'Low';
                      const sId = Number(ticket.status_id);
                      const sName = sId === 2 ? 'In Progress' : sId === 3 ? 'Resolved' : 'Open';
                      const ps = pStyle(pName);
                      const ss = sStyle(sName);

                      return (
                        <tr
                          key={ticket.id}
                          className="ticket-row"
                          onClick={() => setSelectedTicket(ticket)}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            animation: `fadeSlideUp .35s ease ${idx * .04 + .1}s both`,
                          }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.04em', background: 'var(--accent-light)', padding: '3px 8px', borderRadius: 5, border: '1px solid #c4b5fd' }}>
                              {ticket.ticket_number || `TKT-00${ticket.id}`}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', maxWidth: 300 }}>
                            <span className="t-title" style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', transition: 'color .18s' }}>
                              {ticket.title || 'No title provided'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="badge" style={{ background: ps.bg, borderColor: ps.bc, color: ps.color }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: ps.dot, display: 'inline-block', flexShrink: 0 }}/>
                              {pName}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="badge" style={{ background: ss.bg, borderColor: ss.bc, color: ss.color }}>
                              {sName}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--txt-muted)' }}>
                              {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}