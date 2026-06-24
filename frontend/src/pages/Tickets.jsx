import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GlobalStyles from '../components/GlobalStyles';
import TicketModal from '../components/TicketModal';
import NotificationBell from '../components/NotificationBell';
import { format } from 'date-fns';
import {
  Zap, LayoutDashboard, Ticket as TicketIcon, Users, BarChart3, BookOpen,
  History, LogOut, Search, ChevronDown, X, RotateCw, Plus, Eye, Pencil,
  AlertCircle, Inbox, Layers, FolderOpen, Loader, Flame,
} from 'lucide-react';

// --- BULLETPROOF UTC DATE PARSER ---
const parseUtcDate = (dateString) => {
  if (!dateString) return new Date();
  const isoString = dateString.replace(' ', 'T') + (dateString.includes('Z') ? '' : 'Z');
  return new Date(isoString);
};

// --- Animated number counter for the summary cards ---
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
      const cur = Math.round(from + (target - from) * eased);
      setN(cur);
      if (p < 1) raf = requestAnimationFrame(tick); else ref.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n}</>;
}

// --- Premium light "Sky" visual system, shared identity across pages ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');

  .cc-wrap {
    --ink:#102a43; --ink-soft:#334e68; --muted:#627d98; --muted-2:#9fb3c8;
    --cloud:#f3f9ff; --cloud-2:#e9f3fe; --surface:#ffffff; --border:#e1eefc; --border-2:#c5dcf6;
    --volt:#0284c7; --volt-2:#0ea5e9; --volt-3:#38bdf8; --volt-soft:#e0f2fe;
    --amber:#d97706; --amber-soft:#fef3c7;
    --emerald:#059669; --emerald-soft:#d1fae5;
    --rose:#e11d48; --rose-soft:#ffe4e6;
    --violet:#7c3aed; --violet-soft:#f3e8ff;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  .cc-mono { font-family: 'JetBrains Mono', monospace; }
  .cc-display { font-family: 'Space Grotesk', sans-serif; }

  @keyframes cc-float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-24px) scale(1.05); } }
  @keyframes cc-float-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-16px,20px) scale(1.04); } }
  @keyframes cc-fade-up { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
  @keyframes cc-pop { 0% { opacity:0; transform: translateY(16px) scale(.96); } 60% { opacity:1; transform: translateY(-3px) scale(1.01); } 100% { opacity:1; transform: translateY(0) scale(1); } }
  @keyframes cc-shine { 0% { transform: translateX(-130%) skewX(-18deg); } 100% { transform: translateX(280%) skewX(-18deg); } }
  @keyframes cc-pulse { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:.35; transform: scale(.7); } }
  @keyframes cc-icon-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

  .cc-orb { position: fixed; border-radius: 50%; z-index: 0; animation: cc-float 16s ease-in-out infinite; pointer-events: none; filter: blur(8px); }

  .cc-nav-link { display:flex; align-items:center; gap:11px; padding:11px 14px; border-radius:12px; text-decoration:none; color:var(--ink-soft); font-weight:600; font-size:13px; transition: background .16s, color .16s, transform .16s; position:relative; }
  .cc-nav-link:hover { background: var(--cloud-2); color: var(--volt); transform: translateX(2px); }
  .cc-nav-link.active { background: linear-gradient(135deg, var(--volt) 0%, var(--volt-2) 100%); color:#fff; box-shadow: 0 10px 22px -6px rgba(2,132,199,.5); }

  .cc-icon-btn { background:#fff; border:1.5px solid var(--border); cursor:pointer; color:var(--ink-soft); border-radius:10px; padding:8px; display:flex; transition: border-color .15s, color .15s, transform .15s; }
  .cc-icon-btn:hover { border-color: var(--volt); color: var(--volt); transform: translateY(-1px); }

  .cc-input { padding:10px 14px 10px 38px; border:1.5px solid var(--border); border-radius:12px; background:#fff; font-size:12.5px; color:var(--ink); outline:none; transition: border-color .15s, box-shadow .15s; }
  .cc-input:focus { border-color: var(--volt); box-shadow: 0 0 0 4px var(--volt-soft); }

  .cc-select { appearance:none; padding:10px 30px 10px 14px; border-radius:12px; border:1.5px solid var(--border); font-size:12.5px; outline:none; background:#fff; color:var(--ink); cursor:pointer; font-weight:600; transition: border-color .15s, box-shadow .15s; }
  .cc-select:focus { border-color: var(--volt); box-shadow: 0 0 0 4px var(--volt-soft); }

  .cc-date-input { padding:9px 14px; border:1.5px solid var(--border); border-radius:12px; background:#fff; color:var(--ink); font-size:12px; outline:none; cursor:pointer; font-weight:600; transition: border-color .15s, box-shadow .15s; }
  .cc-date-input:focus { border-color: var(--volt); box-shadow: 0 0 0 4px var(--volt-soft); }

  .cc-btn-ghost { background:#fff; border:1.5px solid var(--border); border-radius:12px; cursor:pointer; color:var(--ink); font-size:12.5px; font-weight:700; transition: border-color .15s, transform .15s, box-shadow .15s; display:flex; align-items:center; gap:6px; }
  .cc-btn-ghost:hover { border-color: var(--volt); transform: translateY(-1px); box-shadow: 0 6px 16px -8px rgba(2,132,199,.4); }

  .cc-btn-primary { background: linear-gradient(135deg, var(--volt) 0%, var(--volt-2) 100%); color:#fff; border:none; border-radius:12px; cursor:pointer; font-size:12.5px; font-weight:700; display:flex; align-items:center; gap:6px; box-shadow: 0 12px 26px -8px rgba(2,132,199,.55); transition: transform .15s, box-shadow .15s; }
  .cc-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 32px -8px rgba(2,132,199,.65); }

  .cc-clear-btn { background: var(--rose-soft); color: var(--rose); border:none; border-radius:12px; cursor:pointer; font-weight:700; display:flex; align-items:center; gap:6px; transition: filter .15s, transform .15s; }
  .cc-clear-btn:hover { filter: brightness(.97); transform: translateY(-1px); }

  .cc-action-btn { display:inline-flex; align-items:center; gap:5px; padding:7px 13px; border-radius:10px; background:#fff; color:var(--ink); border:1.5px solid var(--border); font-weight:700; font-size:11px; cursor:pointer; transition: border-color .15s, transform .15s, background .15s, color .15s; }
  .cc-action-btn:hover:not(:disabled) { border-color: var(--volt); color: var(--volt); background: var(--volt-soft); transform: translateY(-1px); }
  .cc-action-btn:disabled { background: var(--cloud); color: var(--muted-2); cursor:not-allowed; opacity:.75; }

  .cc-stat { position:relative; overflow:hidden; background:#fff; border:1.5px solid var(--border); border-radius:18px; padding:18px 20px; box-shadow: 0 2px 12px -4px rgba(2,132,199,.10); animation: cc-pop .55s cubic-bezier(.34,1.56,.64,1) both; transition: transform .22s, box-shadow .22s; }
  .cc-stat:hover { transform: translateY(-5px); box-shadow: 0 20px 38px -14px rgba(2,132,199,.32); }
  .cc-stat::after { content:''; position:absolute; top:0; left:0; width:40%; height:100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,.6), transparent); transform: translateX(-130%) skewX(-18deg); pointer-events:none; }
  .cc-stat:hover::after { animation: cc-shine .9s ease; }
  .cc-stat:hover .cc-stat-ico { animation: cc-icon-float 1.4s ease-in-out infinite; }
  .cc-stat:nth-child(1){ animation-delay:.04s; } .cc-stat:nth-child(2){ animation-delay:.12s; }
  .cc-stat:nth-child(3){ animation-delay:.20s; } .cc-stat:nth-child(4){ animation-delay:.28s; }

  .cc-table-card { background:#fff; border:1.5px solid var(--border); border-radius:20px; box-shadow: 0 4px 20px -8px rgba(2,132,199,.14); overflow:hidden; }

  .cc-row { border-bottom:1px solid var(--border); cursor:pointer; transition: background .14s, transform .14s; }
  .cc-row:hover { background: var(--volt-soft); transform: translateX(2px); }
  .cc-row:hover .cc-row-title { color: var(--volt); }

  .cc-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 11px; border-radius:999px; font-size:11px; font-weight:800; white-space:nowrap; }

  .cc-avatar { width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#fff; flex-shrink:0; }

  .cc-fade-up { animation: cc-fade-up .55s ease both; }

  @media (max-width: 860px) {
    .cc-sidebar { display: none !important; }
    .cc-main { margin-left: 0 !important; }
    .cc-header { flex-wrap: wrap; gap: 10px; }
  }
`;

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Date Range Filter States
  const [dateFilter, setDateFilter] = useState('All');
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });

  // Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{"name":"Admin User"}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchTickets();
  }, [navigate]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
      setError("Failed to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setDateFilter('All');
    setCustomDateRange({ from: '', to: '' });
  };

  // --- NOTIFICATION HANDLER ---
  const handleOpenTicketFromNotification = async (ticketId) => {
    const existingTicket = tickets.find(t => Number(t.id) === Number(ticketId));
    if (existingTicket) {
      setSelectedTicket(existingTicket);
    } else {
      try {
        const res = await api.get(`/tickets/${ticketId}`);
        setSelectedTicket(res.data.data || res.data);
      } catch (err) {
        alert("Could not load ticket details.");
      }
    }
  };

  // --- BADGE HELPERS (light premium palette) ---
  const getPriorityDetails = (id) => {
    const pId = Number(id);
    if (pId === 4) return { label: 'Critical', bg: '#fff1f2', color: '#e11d48', border: '#fecdd3', dot: '#f43f5e', bar: '#f43f5e' };
    if (pId === 3) return { label: 'High', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', dot: '#f97316', bar: '#fb923c' };
    if (pId === 2) return { label: 'Medium', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', dot: '#3b82f6', bar: '#3b82f6' };
    return { label: 'Low', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', dot: '#10b981', bar: '#34d399' };
  };

  const getStatusDetails = (id) => {
    const sId = Number(id);
    if (sId === 1) return { label: 'Open', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
    if (sId === 2) return { label: 'In Progress', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
    if (sId === 3) return { label: 'Resolved', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
    if (sId === 4) return { label: 'Closed', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    if (sId === 5) return { label: 'Pending', bg: '#f3e8ff', color: '#7c3aed', border: '#e9d5ff' };
    return { label: 'Unknown', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  };

  // Deterministic avatar color from a name
  const avatarBg = (name) => {
    const palette = [
      'linear-gradient(135deg,#0ea5e9,#0284c7)', 'linear-gradient(135deg,#6366f1,#4f46e5)',
      'linear-gradient(135deg,#f59e0b,#d97706)', 'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#ec4899,#db2777)', 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    ];
    let h = 0; const s = String(name || '?');
    for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  };

  // --- FILTERING LOGIC ---
  const filteredTickets = tickets.filter(t => {
    const q = searchQuery.toLowerCase().trim();

    const requesterName = t.requester_name || t.RequesterName || t.user?.fullname || t.user?.name || '';
    const assignedName = t.assigned_to_name || t.AssignedToName || t.assigned_user?.fullname || t.assigned_user?.name || '';

    const matchSearch = !q ||
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.referenceno && t.referenceno.toLowerCase().includes(q)) ||
      requesterName.toLowerCase().includes(q) ||
      assignedName.toLowerCase().includes(q);

    const sId = Number(t.statusid || t.StatusId);
    const pId = Number(t.priorityid || t.PriorityId);

    const matchStatus = statusFilter === 'All' ||
      (statusFilter === 'Open' && sId === 1) ||
      (statusFilter === 'In Progress' && sId === 2) ||
      (statusFilter === 'Pending' && sId === 5) ||
      (statusFilter === 'Resolved/Closed' && (sId === 3 || sId === 4));

    const matchPriority = priorityFilter === 'All' ||
      (priorityFilter === 'Critical' && pId === 4) ||
      (priorityFilter === 'High' && pId === 3) ||
      (priorityFilter === 'Medium' && pId === 2) ||
      (priorityFilter === 'Low' && pId === 1);

    const checkDateMatch = () => {
      if (dateFilter === 'All') return true;

      const rawDate = t.created_at || t.createdat;
      if (!rawDate) return false;

      const ticketDate = parseUtcDate(rawDate);
      const now = new Date();

      if (dateFilter === 'Today') {
        return ticketDate.toDateString() === now.toDateString();
      }
      if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return ticketDate >= sevenDaysAgo;
      }
      if (dateFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return ticketDate >= thirtyDaysAgo;
      }
      if (dateFilter === 'Custom') {
        if (!customDateRange.from && !customDateRange.to) return true;

        let fromDate = null;
        let toDate = null;

        if (customDateRange.from) {
          const [y, m, d] = customDateRange.from.split('-');
          fromDate = new Date(y, m - 1, d);
          fromDate.setHours(0, 0, 0, 0);
        }

        if (customDateRange.to) {
          const [y, m, d] = customDateRange.to.split('-');
          toDate = new Date(y, m - 1, d);
          toDate.setHours(23, 59, 59, 999);
        }

        if (fromDate && toDate) return ticketDate >= fromDate && ticketDate <= toDate;
        if (fromDate) return ticketDate >= fromDate;
        if (toDate) return ticketDate <= toDate;
      }

      return true;
    };

    return matchSearch && matchStatus && matchPriority && checkDateMatch();
  });

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'All' || priorityFilter !== 'All' || dateFilter !== 'All';

  // --- SUMMARY STATS (derived from full ticket list) ---
  const countByStatus = (sid) => tickets.filter(t => Number(t.statusid || t.StatusId) === sid).length;
  const summary = [
    { label: 'Total Tickets', value: tickets.length, icon: Layers, grad: 'linear-gradient(135deg,#0ea5e9,#0284c7)', soft: '#e0f2fe', ink: '#0369a1' },
    { label: 'Open', value: countByStatus(1), icon: FolderOpen, grad: 'linear-gradient(135deg,#38bdf8,#0ea5e9)', soft: '#e0f2fe', ink: '#0369a1' },
    { label: 'In Progress', value: countByStatus(2), icon: Loader, grad: 'linear-gradient(135deg,#fbbf24,#d97706)', soft: '#fef3c7', ink: '#b45309' },
    { label: 'Critical', value: tickets.filter(t => Number(t.priorityid || t.PriorityId) === 4).length, icon: Flame, grad: 'linear-gradient(135deg,#fb7185,#e11d48)', soft: '#ffe4e6', ink: '#be123c' },
  ];

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/tickets', icon: TicketIcon, label: 'Incident Tickets', active: true },
    { to: '/roster', icon: Users, label: 'Agent Roster' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/activity-logs', icon: History, label: 'System Audit Log' },
  ];

  return (
    <>
      <GlobalStyles />
      <style>{styles}</style>

      {/* TICKET MODAL OVERLAY */}
      {selectedTicket && (
        <div style={{ position: 'relative', zIndex: 2000 }}>
          <TicketModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onSuccess={() => { setSelectedTicket(null); fetchTickets(); }}
          />
        </div>
      )}

      {/* --- MAIN PAGE WRAPPER --- */}
      <div className="cc-wrap" style={{ display: 'flex', minHeight: '100vh', background: 'var(--cloud)', position: 'relative', overflow: 'hidden' }}>
        <div className="cc-orb" style={{ top: '-12%', right: '2%', width: 560, height: 560, background: 'radial-gradient(circle, rgba(14,165,233,.18) 0%, transparent 70%)' }} />
        <div className="cc-orb" style={{ bottom: '-14%', left: '6%', width: 520, height: 520, background: 'radial-gradient(circle, rgba(56,189,248,.16) 0%, transparent 70%)', animation: 'cc-float-b 18s ease-in-out infinite', animationDelay: '-6s' }} />

        {/* SIDEBAR */}
        <aside className="cc-sidebar" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 252, background: '#fff', borderRight: '1px solid var(--border)', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '4px 0 30px -18px rgba(2,132,199,0.4)' }}>
          <div>
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 22px rgba(2,132,199,.4)' }}>
                  <Zap size={20} color="#fff" strokeWidth={2.4} />
                </div>
                <div>
                  <div className="cc-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>CommandCenter</div>
                  <div className="cc-mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--volt)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Enterprise Ops</div>
                </div>
              </div>
            </div>

            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map(link => (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => { e.preventDefault(); if (!link.active) navigate(link.to); }}
                  className={`cc-nav-link${link.active ? ' active' : ''}`}
                >
                  <link.icon size={17} strokeWidth={2.2} style={{ flexShrink: 0 }} /><span>{link.label}</span>
                </a>
              ))}
            </nav>
          </div>
          <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cloud)', borderRadius: 14, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>{currentUser.name?.charAt(0) || 'A'}</div>
                <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p></div>
              </div>
              <button onClick={handleLogout} className="cc-icon-btn" title="Logout" style={{ padding: 7 }}>
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN PAGE CONTENT */}
        <main className="cc-main" style={{ marginLeft: 252, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

          {/* HEADER / CONTROLS */}
          <header className="cc-header" style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(243,249,255,.82)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '12px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 280 }}>
                <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Search ID, subject, or requester..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="cc-input" style={{ width: '100%' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="cc-select">
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Resolved/Closed">Resolved / Closed</option>
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="cc-select">
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCustomDateRange({ from: '', to: '' }); }} className="cc-select">
                  <option value="All">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Custom">Custom Range...</option>
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
              </div>

              {dateFilter === 'Custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="date"
                    value={customDateRange.from}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                    className="cc-date-input"
                    title="From Date"
                  />
                  <span className="cc-mono" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>to</span>
                  <input
                    type="date"
                    value={customDateRange.to}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                    className="cc-date-input"
                    title="To Date"
                  />
                </div>
              )}

              {hasActiveFilters && (
                <button onClick={clearFilters} className="cc-clear-btn" style={{ padding: '9px 14px', fontSize: 12 }}>
                  <X size={13} strokeWidth={2.6} /> Clear Filters
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <NotificationBell onOpenTicket={handleOpenTicketFromNotification} />

              <button onClick={fetchTickets} className="cc-btn-ghost" style={{ padding: '9px 14px' }}>
                <RotateCw size={14} />
              </button>
              <button onClick={() => navigate('/create-ticket')} className="cc-btn-primary" style={{ padding: '10px 20px' }}>
                <Plus size={15} strokeWidth={2.6} /> New Ticket
              </button>
            </div>
          </header>

          <div className="cc-fade-up" style={{ padding: '28px 30px', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto' }}>

            {/* HERO BANNER */}
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: '30px 34px', marginBottom: 24, background: 'linear-gradient(120deg, #0284c7 0%, #0ea5e9 55%, #38bdf8 100%)', boxShadow: '0 22px 50px -18px rgba(2,132,199,.6)' }}>
              <div style={{ position: 'absolute', top: '-40%', right: '-4%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.22), transparent 70%)', animation: 'cc-float 12s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', bottom: '-60%', right: '22%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.16), transparent 70%)', animation: 'cc-float-b 15s ease-in-out infinite' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(6px)', padding: '5px 12px', borderRadius: 999, marginBottom: 12 }}>
                  <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                  <span className="cc-mono" style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '.16em', textTransform: 'uppercase' }}>Live Queue</span>
                </div>
                <h1 className="cc-display" style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-.5px', margin: '0 0 6px' }}>Incident Tickets Queue</h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.9)', margin: 0, fontWeight: 500 }}>Manage, triage and route all support requests across the organization.</p>
              </div>
            </div>

            {/* SUMMARY STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 18, marginBottom: 24 }}>
              {summary.map((s) => (
                <div key={s.label} className="cc-stat">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <p className="cc-mono" style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{s.label}</p>
                      <p className="cc-display" style={{ margin: 0, fontSize: 32, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
                        <CountUp value={s.value} />
                      </p>
                    </div>
                    <div className="cc-stat-ico" style={{ width: 46, height: 46, borderRadius: 14, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 10px 22px -8px ${s.ink}55` }}>
                      <s.icon size={22} color="#fff" strokeWidth={2.3} />
                    </div>
                  </div>
                  <div style={{ marginTop: 14, height: 5, borderRadius: 999, background: s.soft, overflow: 'hidden' }}>
                    <div className="progress-fill" style={{ height: '100%', borderRadius: 999, background: s.grad, width: `${tickets.length ? Math.max(6, Math.round((s.value / tickets.length) * 100)) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--rose-soft)', color: 'var(--rose)', borderRadius: 14, marginBottom: 20, fontWeight: 600, fontSize: 13 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* TICKETS TABLE */}
            <div className="cc-table-card">
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(120deg, var(--cloud) 0%, var(--cloud-2) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px -6px rgba(2,132,199,.5)' }}>
                    <TicketIcon size={17} color="#fff" strokeWidth={2.3} />
                  </div>
                  <h3 className="cc-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Active Queue</h3>
                </div>
                <div className="cc-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--volt)', background: 'var(--volt-soft)', padding: '5px 14px', borderRadius: 999, border: '1px solid var(--border-2)' }}>Showing {filteredTickets.length} Tickets</div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: '#fbfdff' }}>
                      <th className="cc-mono" style={{ padding: '13px 18px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '.06em' }}>Ticket ID</th>
                      <th className="cc-mono" style={{ padding: '13px 18px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '.06em' }}>Subject</th>
                      <th className="cc-mono" style={{ padding: '13px 18px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '.06em' }}>Requester</th>
                      <th className="cc-mono" style={{ padding: '13px 18px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '.06em' }}>Priority</th>
                      <th className="cc-mono" style={{ padding: '13px 18px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '.06em' }}>Status</th>
                      <th className="cc-mono" style={{ padding: '13px 18px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '.06em' }}>Assigned To</th>
                      <th className="cc-mono" style={{ padding: '13px 18px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '.06em' }}>Created At</th>
                      <th className="cc-mono" style={{ padding: '13px 18px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap', letterSpacing: '.06em' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ padding: '44px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }} className="cc-mono">Loading tickets...</td></tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '54px', textAlign: 'center' }}>
                          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--cloud-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <Inbox size={24} style={{ color: 'var(--muted)' }} />
                          </div>
                          <p className="cc-mono" style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>No tickets match your filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map(t => {
                        const tNum = t.referenceno || t.TicketNumber || `TKT-00${t.id}`;
                        const priority = getPriorityDetails(t.priorityid || t.PriorityId);
                        const status = getStatusDetails(t.statusid || t.StatusId);

                        const requesterStr = t.creator_name || t.requester_name || t.RequesterName || t.user?.fullname || t.user?.name || t.creator?.fullname || 'Unknown';
                        const assignedStr = t.agent_name || t.assigned_to_name || t.AssignedToName || t.assigned_user?.fullname || t.assigned_user?.name || t.agent?.fullname || null;

                        const isAssigned = Boolean(assignedStr);

                        const rawDate = t.created_at || t.createdat;
                        const displayDate = rawDate ? format(parseUtcDate(rawDate), 'MMM dd, yyyy HH:mm') : 'Unknown';

                        return (
                          <tr
                            key={t.id}
                            onClick={() => setSelectedTicket(t)}
                            className="cc-row"
                            style={{ borderLeft: `4px solid ${priority.bar}` }}
                          >
                            <td className="cc-mono" style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: 'var(--volt)', whiteSpace: 'nowrap' }}>
                              {tNum}
                            </td>
                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                              <span className="cc-row-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', maxWidth: '240px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', transition: 'color .14s' }}>
                                {t.title || 'Untitled Ticket'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div className="cc-avatar" style={{ background: avatarBg(requesterStr) }}>{(requesterStr || '?').charAt(0).toUpperCase()}</div>
                                <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>{requesterStr}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                              <span className="cc-badge" style={{ background: priority.bg, color: priority.color, border: `1px solid ${priority.border}` }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: priority.dot, display: 'inline-block', flexShrink: 0 }} />{priority.label}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                              <span className="cc-badge" style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                                {status.label}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                              {assignedStr ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                  <div className="cc-avatar" style={{ width: 26, height: 26, fontSize: 11, background: avatarBg(assignedStr) }}>{assignedStr.charAt(0).toUpperCase()}</div>
                                  <span style={{ fontWeight: 600 }}>{assignedStr}</span>
                                </div>
                              ) : <span style={{ color: 'var(--muted-2)', fontStyle: 'italic' }}>Unassigned</span>}
                            </td>
                            <td className="cc-mono" style={{ padding: '14px 18px', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                              {displayDate}
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}
                                  className="cc-action-btn"
                                >
                                  <Eye size={12} /> View
                                </button>
                                <button
                                  disabled={isAssigned}
                                  onClick={(e) => { e.stopPropagation(); if (!isAssigned) setSelectedTicket(t); }}
                                  className="cc-action-btn"
                                  title={isAssigned ? "Cannot edit a ticket that is already assigned" : "Edit Ticket"}
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
