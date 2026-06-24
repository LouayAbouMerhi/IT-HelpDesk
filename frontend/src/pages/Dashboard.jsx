import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

import GlobalStyles from '../components/GlobalStyles';
import CreateTicketModal from '../components/CreateTicketModal';
import TicketModal from '../components/TicketModal';
import NotificationBell from '../components/NotificationBell';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Zap, LayoutDashboard, Ticket as TicketIcon, Users, History, LogOut,
  Search, ChevronDown, RotateCw, Plus, Inbox, Hourglass, CheckCircle2,
  UserCheck, Radio, BarChart3,
} from 'lucide-react';

// --- THE FIX: Safe UTC Date Parser ---
// This ensures raw DB queries AND Laravel Eloquent dates are both parsed
// perfectly into your local timezone without double-appending the 'Z'.
const parseUtcDate = (dateString) => {
  if (!dateString) return null;
  try {
    if (dateString instanceof Date) return isNaN(dateString.getTime()) ? null : dateString;
    let str = String(dateString).replace(' ', 'T');
    if (!str.endsWith('Z')) str += 'Z';
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
};

// Safe wrappers: date-fns throws a RangeError on an invalid Date, which would
// crash the whole render. These return a fallback string instead.
const safeFormat = (raw, pattern, fallback = 'Just now') => {
  const d = parseUtcDate(raw);
  if (!d) return fallback;
  try { return format(d, pattern); } catch (e) { return fallback; }
};
const safeFromNow = (raw, fallback = 'Just now') => {
  const d = parseUtcDate(raw);
  if (!d) return fallback;
  try { return formatDistanceToNow(d, { addSuffix: true }); } catch (e) { return fallback; }
};

// --- Visual system: a single embedded stylesheet so the new look is fully
// self-contained and doesn't depend on values defined elsewhere. ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');

  .cc-wrap {
    --ink:#102a43; --ink-soft:#334e68; --muted:#627d98; --muted-dark:#486581;
    --cloud:#f3f9ff; --surface:#FFFFFF; --border:#e1eefc;
    --volt:#0284c7; --volt-soft:#e0f2fe; --volt-2:#38bdf8;
    --signal:#0F766E; --signal-soft:#D9F7F0;
    --ember:#C2410C; --ember-soft:#FFE8D9;
    --flare:#BE123C; --flare-soft:#FFE1E8;
    --pulse:#047857; --pulse-soft:#D8F7E9;
    --violet:#7E22CE; --violet-soft:#F2E2FF;
    font-family: 'Inter', sans-serif;
  }
  .cc-mono { font-family: 'JetBrains Mono', monospace; }
  .cc-display { font-family: 'Space Grotesk', sans-serif; }

  @keyframes cc-float {
    0%, 100% { transform: translate(0,0); }
    50% { transform: translate(20px,-26px); }
  }
  @keyframes cc-spin { to { transform: rotate(360deg); } }
  @keyframes cc-pulse-dot {
    0%, 100% { box-shadow: 0 0 0 0 rgba(4,120,87,.55); }
    50% { box-shadow: 0 0 0 6px rgba(4,120,87,0); }
  }
  @keyframes cc-fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes cc-pop {
    0% { opacity: 0; transform: translateY(16px) scale(.96); }
    60% { opacity: 1; transform: translateY(-4px) scale(1.01); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cc-shine {
    0% { transform: translateX(-130%) skewX(-18deg); }
    100% { transform: translateX(280%) skewX(-18deg); }
  }
  @keyframes cc-icon-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .cc-orb { position: fixed; border-radius: 50%; z-index: 0; animation: cc-float 14s ease-in-out infinite; pointer-events: none; }

  .cc-nav-link { display: flex; align-items: center; gap: 11px; padding: 10px 14px; border-radius: 11px; text-decoration: none; color: var(--muted-dark); font-weight: 600; font-size: 13px; transition: background .15s, color .15s, transform .15s; }
  .cc-nav-link:hover { background: var(--volt-soft); color: var(--volt); transform: translateX(2px); }
  .cc-nav-link.active { background: linear-gradient(135deg, var(--volt), var(--volt-2)); color: #fff; box-shadow: 0 8px 20px rgba(14,165,233,.4); }

  .cc-icon-btn { background: transparent; border: none; cursor: pointer; color: var(--muted-dark); border-radius: 9px; padding: 7px; display: flex; transition: background .15s, color .15s; }
  .cc-icon-btn:hover { background: var(--flare-soft); color: var(--flare); }

  .cc-input { width: 100%; padding: 9px 14px 9px 36px; border: 1.5px solid var(--border); border-radius: 11px; background: #fff; font-size: 12.5px; color: var(--ink); outline: none; transition: border-color .15s, box-shadow .15s; }
  .cc-input:focus { border-color: var(--volt); box-shadow: 0 0 0 3px var(--volt-soft); }

  .cc-select { appearance: none; padding: 9px 30px 9px 14px; border-radius: 11px; border: 1.5px solid var(--border); font-size: 12.5px; outline: none; background: #fff; color: var(--ink); cursor: pointer; font-weight: 600; transition: border-color .15s, box-shadow .15s; }
  .cc-select:focus { border-color: var(--volt); box-shadow: 0 0 0 3px var(--volt-soft); }

  .cc-btn-ghost { background: #fff; border: 1.5px solid var(--border); border-radius: 11px; cursor: pointer; color: var(--ink); font-size: 12.5px; font-weight: 700; transition: border-color .15s, transform .15s; display: flex; align-items: center; gap: 6px; }
  .cc-btn-ghost:hover { border-color: var(--volt); transform: translateY(-1px); }

  .cc-btn-primary { background: linear-gradient(135deg, var(--volt), var(--volt-2)); color: #fff; border: none; border-radius: 11px; cursor: pointer; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; gap: 6px; box-shadow: 0 10px 24px rgba(14,165,233,.4); transition: transform .15s, box-shadow .15s; }
  .cc-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(14,165,233,.5); }

  .cc-clear-btn { background: var(--flare-soft); color: var(--flare); border: none; border-radius: 11px; cursor: pointer; font-weight: 700; transition: filter .15s; }
  .cc-clear-btn:hover { filter: brightness(.96); }

  .cc-live-chip { display: flex; align-items: center; gap: 7px; background: var(--pulse-soft); border: 1.5px solid #9FE8C9; border-radius: 9px; padding: 6px 12px; }
  .cc-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--pulse); animation: cc-pulse-dot 1.8s infinite; }

  .cc-stat-card { background: #fff; border: 1.5px solid var(--border); border-radius: 18px; padding: 20px 22px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 12px rgba(2,132,199,.06); position: relative; overflow: hidden; transition: transform .22s, box-shadow .22s; animation: cc-pop .55s cubic-bezier(.34,1.56,.64,1) both; }
  .cc-stat-card:nth-child(1) { animation-delay: .04s; }
  .cc-stat-card:nth-child(2) { animation-delay: .12s; }
  .cc-stat-card:nth-child(3) { animation-delay: .20s; }
  .cc-stat-card:nth-child(4) { animation-delay: .28s; }
  .cc-stat-card::after { content: ''; position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,.6), transparent); transform: translateX(-130%) skewX(-18deg); pointer-events: none; }
  .cc-stat-card:hover::after { animation: cc-shine .9s ease; }
  .cc-stat-card:hover { transform: translateY(-5px); box-shadow: 0 18px 38px rgba(2,132,199,.16); }
  .cc-stat-card:hover .cc-stat-icon { animation: cc-icon-float 1.4s ease-in-out infinite; }
  .cc-stat-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; }

  .cc-chart-card, .cc-table-card, .cc-activity-card { background: #fff; border: 1.5px solid var(--border); border-radius: 18px; box-shadow: 0 2px 12px rgba(2,132,199,.06); transition: transform .22s, box-shadow .22s; }
  .cc-chart-card:hover, .cc-activity-card:hover { transform: translateY(-3px); box-shadow: 0 16px 34px rgba(2,132,199,.12); }

  .cc-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: 6px; }
  .cc-bar-inner { width: 100%; max-width: 50px; border-radius: 10px 10px 4px 4px; transition: height .4s ease, filter .2s; }
  .cc-bar-col:hover .cc-bar-inner { filter: brightness(1.08); }

  .cc-progress-track { height: 8px; background: var(--cloud); border-radius: 6px; overflow: hidden; }
  .cc-progress-fill { height: 100%; border-radius: 6px; transition: width .5s ease; }

  .cc-row { border-bottom: 1px solid var(--border); background: #fff; cursor: pointer; transition: background .12s, transform .12s; }
  .cc-row:hover { background: var(--cloud); transform: translateX(2px); }

  .cc-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; font-size: 11.5px; font-weight: 700; white-space: nowrap; }

  .cc-log-item { position: relative; padding: 0 0 18px 22px; border-left: 2px solid var(--border); margin-left: 5px; }
  .cc-log-item:last-child { border-left-color: transparent; padding-bottom: 0; }
  .cc-log-dot { position: absolute; left: -6px; top: 2px; width: 10px; height: 10px; border-radius: 50%; border: 2.5px solid #fff; box-shadow: 0 0 0 2px var(--border); }

  .cc-scroll::-webkit-scrollbar { width: 6px; }
  .cc-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 6px; }

  .cc-spin-ring { position: absolute; inset: 0; border-radius: 50%; animation: cc-spin 0.9s linear infinite; }
  .cc-fade-up { animation: cc-fade-up .5s ease both; }

  @media (max-width: 1100px) {
    .cc-charts-grid, .cc-split-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 860px) {
    .cc-sidebar { display: none !important; }
    .cc-main { margin-left: 0 !important; }
    .cc-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .cc-header { flex-wrap: wrap; gap: 10px; }
  }
`;

// Animated number counter for a lively stat reveal
function CountUp({ value, duration = 900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) { setN(0); return; }
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n}</>;
}

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stats, setStats] = useState({ openTickets: 0, inProgress: 0, resolvedToday: 0, activeAgents: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState(''); 
  
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Admin User"}');
  
  const handleOpenTicketFromNotification = async (ticketId) => {
    const existingTicket = safeTickets.find(t => Number(t.id) === Number(ticketId));
    
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, tRes, logRes, agentsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get(`/tickets?t=${Date.now()}`),
        api.get(`/activity-logs?t=${Date.now()}`),
        api.get('/agents')
      ]);

      const currentStats = statsRes.status === 'fulfilled' ? (statsRes.value.data || {}) : {};
      const ticketsData = tRes.status === 'fulfilled' ? (Array.isArray(tRes.value.data) ? tRes.value.data : (tRes.value.data?.data || [])) : [];
      const logsData = logRes.status === 'fulfilled' ? (Array.isArray(logRes.value.data?.data) ? logRes.value.data.data : (Array.isArray(logRes.value.data) ? logRes.value.data : [])) : [];
      const agentCount = agentsRes.status === 'fulfilled' ? (agentsRes.value.data?.length || 0) : 0;

      setRecentTickets(ticketsData);
      setRecentLogs(logsData.slice(0, 20));
      setStats({
        openTickets: currentStats.openTickets || ticketsData.filter(t => t.statusid === 1).length,
        inProgress: currentStats.inProgress || ticketsData.filter(t => t.statusid === 2).length,
        resolvedToday: currentStats.resolvedToday || ticketsData.filter(t => t.statusid === 3).length,
        activeAgents: agentCount
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchDashboardData();
  }, [navigate]);

  const safeTickets = recentTickets || [];
  
  const filteredTickets = safeTickets.filter(ticket => {
    const q = (searchQuery || '').toLowerCase().trim();
    const pId = String(ticket.priorityid || ticket.PriorityId || '1');
    const sId = String(ticket.statusid || ticket.StatusId || '1');

    const priorityNames = { '4': 'critical', '3': 'high', '2': 'medium', '1': 'low' };
    const statusNames = { '1': 'open', '2': 'in progress', '3': 'resolved', '4': 'closed', '5': 'pending' };

    const pText = priorityNames[pId] || 'low';
    const sText = statusNames[sId] || 'open';
    const agentName = ticket.agent_name || 'unassigned';

    const searchableString = `${ticket.referenceno || ''} ${ticket.title || ''} ${ticket.category_name || ''} ${agentName} ${pText} ${sText}`.toLowerCase();

    const matchesSearch = !q || searchableString.includes(q);
    const matchesStatus = !filterStatus || sId === String(filterStatus);
    const matchesPriority = !filterPriority || pId === String(filterPriority);
    
    let matchesAssignee = true;
    if (filterAssignee === 'assigned') matchesAssignee = !!ticket.agent_name; 
    else if (filterAssignee === 'unassigned') matchesAssignee = !ticket.agent_name; 
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const displayedTickets = filteredTickets.slice(0, 10);

  const getCategories = () => {
    const counts = {};
    let totalTickets = 0;

    safeTickets.forEach(t => {
      const catName = t.category_name || t.CategoryName || 'Uncategorized';
      if (!counts[catName]) counts[catName] = 0;
      counts[catName]++;
      totalTickets++;
    });

    if (totalTickets === 0) totalTickets = 1;

    const palette = [
      '#4338CA', '#0F766E', '#C2410C', '#BE123C',
      '#047857', '#7E22CE', '#B45309', '#A21CAF'
    ];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name: name,
        value: value,
        count: value,
        percentage: Math.round((value / totalTickets) * 100),
        fill: palette[i % palette.length],
        bar: palette[i % palette.length]
      }));
  };

  const getTimeline = () => {
    const p = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    safeTickets.forEach(t => {
      const id = Number(t.priorityid || t.PriorityId);
      if (id === 4) p.Critical++; else if (id === 3) p.High++; else if (id === 2) p.Medium++; else if (id === 1) p.Low++;
    });
    const max = Math.max(...Object.values(p), 1);
    const palette = {
      Critical: { bar: '#BE123C', glow: 'rgba(190,18,60,.35)' },
      High: { bar: '#C2410C', glow: 'rgba(194,65,12,.35)' },
      Medium: { bar: '#0284c7', glow: 'rgba(2,132,199,.35)' },
      Low: { bar: '#10b981', glow: 'rgba(16,185,129,.35)' },
    };
    return Object.entries(p).map(([label, volume]) => ({
      label, volume, h: Math.max((volume / max) * 100, volume > 0 ? 6 : 0), ...palette[label],
    }));
  };

  const pStyle = (name) => ({
    Critical: { bg: '#BE123C', bc: '#BE123C', color: '#fff', dot: '#FF9DB8' },
    High:     { bg: '#C2410C', bc: '#C2410C', color: '#fff', dot: '#FFC089' },
    Medium:   { bg: '#0284c7', bc: '#0284c7', color: '#fff', dot: '#9FD7F5' },
    Low:      { bg: '#10b981', bc: '#10b981', color: '#fff', dot: '#7DEFC0' },
  }[name] || { bg: '#10b981', bc: '#10b981', color: '#fff', dot: '#7DEFC0' });

  const sStyle = (name) => ({
    'Open':        { bg: '#0F766E', bc: '#0F766E', color: '#fff' },
    'In Progress': { bg: '#C2410C', bc: '#C2410C', color: '#fff' },
    'Resolved':    { bg: '#047857', bc: '#047857', color: '#fff' },
    'Closed':      { bg: '#475569', bc: '#475569', color: '#fff' },
    'Pending':     { bg: '#7E22CE', bc: '#7E22CE', color: '#fff' },
  }[name] || { bg: '#0F766E', bc: '#0F766E', color: '#fff' });

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };
  const categories = getCategories();
  const timeline = getTimeline();
  const formatAction = (action) => action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (loading) return (
    <>
      <GlobalStyles />
      <style>{styles}</style>
      <div className="cc-wrap" style={{ minHeight: '100vh', background: 'var(--cloud)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <div className="cc-spin-ring" style={{ border: '3.5px solid var(--border)', borderTopColor: 'var(--volt)' }} />
          <div className="cc-spin-ring" style={{ inset: 9, borderWidth: 3, border: '3px solid var(--border)', borderBottomColor: '#38bdf8', animationDirection: 'reverse', animationDuration: '1.2s' }} />
        </div>
        <p className="cc-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Initializing command center</p>
      </div>
    </>
  );

  return (
    <>
      <GlobalStyles />
      <style>{styles}</style>
      
      {isCreateModalOpen && (
        <CreateTicketModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => { setIsCreateModalOpen(false); fetchDashboardData(); }} />
      )}

      {selectedTicket && (
        <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onSuccess={() => { setSelectedTicket(null); fetchDashboardData(); }} />
      )}

      <div className="cc-wrap" style={{ display: 'flex', minHeight: '100vh', background: 'var(--cloud)', position: 'relative', overflow: 'hidden' }}>
        <div className="cc-orb" style={{ top: '-10%', right: '0%', width: 620, height: 620, background: 'radial-gradient(circle, rgba(14,165,233,.16) 0%, transparent 70%)' }} />
        <div className="cc-orb" style={{ bottom: '-12%', left: '4%', width: 560, height: 560, background: 'radial-gradient(circle, rgba(56,189,248,.14) 0%, transparent 70%)', animationDelay: '-7s' }} />

        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="cc-sidebar" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 252, background: '#ffffff', borderRight: '1px solid var(--border)', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '4px 0 30px rgba(2,132,199,0.08)' }}>
          <div>
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(14,165,233,.35)' }}>
                  <Zap size={19} color="#fff" strokeWidth={2.4} />
                </div>
                <div>
                  <div className="cc-display" style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>CommandCenter</div>
                  <div className="cc-mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--volt)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Enterprise Ops</div>
                </div>
              </div>
            </div>

            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { Icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
                { Icon: TicketIcon, label: 'Incident Tickets', path: '/tickets' },
                { Icon: Users, label: 'Agent Roster', path: '/roster' },
                { Icon: BarChart3, label: 'Analytics', path: '/analytics' },
                { Icon: History, label: 'System Audit Log', path: '/activity-logs' },
              ].map(({ Icon, label, path }, i) => {
                const isActive = location.pathname === path;

                return (
                  <a
                    key={i}
                    href={path}
                    onClick={(e) => { e.preventDefault(); navigate(path); }}
                    className={`cc-nav-link${isActive ? ' active' : ''}`}
                  >
                    <Icon size={17} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                    <span>{label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cloud)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, #0284c7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                  {user.name?.charAt(0) || 'A'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="cc-icon-btn" title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="cc-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, marginLeft: 252 }}>
          
          <header className="cc-header" style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(243,249,255,.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '12px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              
              <div style={{ position: 'relative', width: 240 }}>
                <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                <input 
                  type="text" 
                  placeholder="Search references, assignees..." 
                  className="cc-input"
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
              </div>

              <div style={{ position: 'relative' }}>
                <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="cc-select">
                  <option value="">All Assignments</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="cc-select">
                  <option value="">All Statuses</option>
                  <option value="1">Open</option>
                  <option value="2">In Progress</option>
                  <option value="5">Pending</option>
                  <option value="3">Resolved</option>
                  <option value="4">Closed</option>
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="cc-select">
                  <option value="">All Priorities</option>
                  <option value="4">Critical</option>
                  <option value="3">High</option>
                  <option value="2">Medium</option>
                  <option value="1">Low</option>
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
              </div>
              
              {(searchQuery || filterStatus || filterPriority || filterAssignee) && (
                <button onClick={() => { setSearchQuery(''); setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); }} className="cc-clear-btn" style={{ padding: '9px 14px', fontSize: 12 }}>
                  Clear Filters
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <NotificationBell onOpenTicket={handleOpenTicketFromNotification} />

              <div className="cc-live-chip">
                <span className="cc-live-dot" />
                <Radio size={11} color="#047857" />
                <span className="cc-mono" style={{ fontSize: 10, fontWeight: 700, color: '#047857', letterSpacing: '.1em' }}>LIVE</span>
              </div>
              <button onClick={fetchDashboardData} className="cc-btn-ghost" style={{ padding: '9px 14px' }}>
                <RotateCw size={14} />
              </button>
              <button onClick={() => setIsCreateModalOpen(true)} className="cc-btn-primary" style={{ padding: '9px 18px' }}>
                <Plus size={15} strokeWidth={2.6} /> New Ticket
              </button>
            </div>
          </header>

          <div className="cc-fade-up" style={{ padding: '28px 30px', flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto' }}>
            {/* HERO BANNER */}
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '26px 30px', marginBottom: 24, background: 'linear-gradient(120deg,#0284c7,#0ea5e9 55%,#38bdf8)', boxShadow: '0 22px 50px -26px rgba(2,132,199,.7)' }}>
              <div style={{ position: 'absolute', top: -60, right: -30, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,.13)' }} />
              <div style={{ position: 'absolute', bottom: -80, right: 150, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.09)' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', flexShrink: 0 }}>
                    <LayoutDashboard size={28} color="#fff" strokeWidth={2.1} />
                  </div>
                  <div>
                    <p className="cc-mono" style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: '.16em', textTransform: 'uppercase', margin: '0 0 5px' }}>Welcome back, {(user.name || 'Admin').split(' ')[0]}</p>
                    <h1 className="cc-display" style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-.5px', margin: 0 }}>System Overview</h1>
                    <p style={{ color: 'rgba(255,255,255,.9)', fontSize: 13, margin: '5px 0 0' }}>Real-time incident feed across the entire CommandCenter.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 18px', backdropFilter: 'blur(6px)' }}>
                    <div className="cc-display" style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1 }}><CountUp value={stats.openTickets || safeTickets.filter(t => Number(t.statusid) === 1).length} /></div>
                    <div className="cc-mono" style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>Open</div>
                  </div>
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 18px', backdropFilter: 'blur(6px)' }}>
                    <div className="cc-display" style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1 }}><CountUp value={safeTickets.length} /></div>
                    <div className="cc-mono" style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>Total</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cc-stats-grid" style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { title: 'Pipeline Total', value: safeTickets.length, Icon: Inbox, bar: '#0284c7', grad: 'linear-gradient(135deg,#0284c7,#38bdf8)', glow: 'rgba(14,165,233,.32)' },
                { title: 'In Evaluation', value: stats.inProgress || 0, Icon: Hourglass, bar: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)', glow: 'rgba(245,158,11,.3)' },
                { title: 'Resolved Today', value: stats.resolvedToday || 0, Icon: CheckCircle2, bar: '#10b981', grad: 'linear-gradient(135deg,#10b981,#34D399)', glow: 'rgba(16,185,129,.3)' },
                { title: 'Active Agents', value: stats.activeAgents || 0, Icon: UserCheck, bar: '#6366f1', grad: 'linear-gradient(135deg,#6366f1,#818cf8)', glow: 'rgba(99,102,241,.3)' },
              ].map((s, i) => (
                <div key={i} className="cc-stat-card">
                  <div className="cc-stat-bar" style={{ background: s.bar }} />
                  <div>
                    <p className="cc-mono" style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', margin: '0 0 8px' }}>{s.title}</p>
                    <p className="cc-display" style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1 }}><CountUp value={s.value} /></p>
                  </div>
                  <div className="cc-stat-icon" style={{ width: 46, height: 46, borderRadius: 14, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 22px ${s.glow}` }}>
                    <s.Icon size={20} color="#fff" strokeWidth={2.2} />
                  </div>
                </div>
              ))}
            </div>

            <div className="cc-charts-grid" style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <div className="cc-chart-card" style={{ padding: 24 }}>
                <h3 className="cc-display" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', margin: '0 0 3px' }}>Incident Severity Density</h3>
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 16, paddingBottom: 8, marginTop: 20, borderBottom: '1.5px solid var(--border)' }}>
                  {timeline.map((d, i) => (
                    <div key={i} className="cc-bar-col">
                      <span className="cc-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)' }}>{d.volume}</span>
                      <div className="cc-bar-inner" style={{ height: `${d.h}%`, minHeight: d.volume > 0 ? 4 : 0, background: d.bar, boxShadow: `0 6px 18px ${d.glow}` }} />
                      <span className="cc-mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cc-chart-card" style={{ padding: 24 }}>
                <h3 className="cc-display" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', margin: '0 0 3px' }}>Category Allocation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 20 }}>
                  {categories.map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>{c.name}</span>
                        <span className="cc-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{c.count} ({c.percentage}%)</span>
                      </div>
                      <div className="cc-progress-track">
                        <div className="cc-progress-fill" style={{ width: `${c.percentage}%`, background: c.bar }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="cc-split-grid" style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
              
              <div className="cc-table-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--cloud)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="cc-display" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Recent Pipeline Incidents</h3>
                  <div className="cc-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--volt)', background: 'var(--volt-soft)', padding: '4px 12px', borderRadius: 8 }}>
                    Showing 10 Latest
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafafe' }}>
                        {['Incident Reference', 'Title', 'Priority', 'Status', 'Assigned To', 'Created At'].map((h, i) => (
                          <th key={i} className="cc-mono" style={{ padding: '12px 20px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTickets.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '44px 20px', textAlign: 'center' }}>
                            <Inbox size={22} style={{ color: 'var(--muted)', marginBottom: 8 }} />
                            <p className="cc-mono" style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>No incidents match the active filters.</p>
                          </td>
                        </tr>
                      ) : (
                        displayedTickets.map((ticket) => {
                          const tNum = ticket.referenceno || ticket.TicketNumber || `TKT-00${ticket.id}`;
                          const pId = Number(ticket.priorityid || ticket.PriorityId) || 1;
                          const pName = pId === 4 ? 'Critical' : pId === 3 ? 'High' : pId === 2 ? 'Medium' : 'Low';
                          
                          const sId = Number(ticket.statusid || ticket.StatusId) || 1;
                          const sName = sId === 2 ? 'In Progress' : sId === 3 ? 'Resolved' : sId === 4 ? 'Closed' : sId === 5 ? 'Pending' : 'Open';
                          
                          const ps = pStyle(pName);
                          const ss = sStyle(sName);

                          const rawCreatedAt = ticket.createdat || ticket.CreatedAt || ticket.created_at;

                          // THE FIX: Safe formatter never throws on bad dates
                          const displayDate = safeFormat(rawCreatedAt, 'MMM dd, yyyy');

                          return (
                            <tr key={ticket.id} className="cc-row" onClick={() => setSelectedTicket(ticket)} style={{ borderLeft: `4px solid ${ps.bg}` }}>
                              <td className="cc-mono" style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: 'var(--volt)', whiteSpace: 'nowrap' }}>{tNum}</td>
                              <td style={{ padding: '14px 20px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{ticket.title || 'Untitled Incident'}</span>
                              </td>
                              <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                <span className="cc-badge" style={{ background: ps.bg, color: ps.color }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: ps.dot, display: 'inline-block', flexShrink: 0 }}/>{pName}
                                </span>
                              </td>
                              <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                <span className="cc-badge" style={{ background: ss.bg, color: ss.color }}>{sName}</span>
                              </td>

                              <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {ticket.agent_name ? (
                                    <>
                                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--volt-soft)', color: 'var(--volt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>
                                        {ticket.agent_name.charAt(0).toUpperCase()}
                                      </div>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{ticket.agent_name}</span>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Unassigned</span>
                                  )}
                                </div>
                              </td>

                              <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                <span className="cc-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{displayDate}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="cc-activity-card" style={{ padding: 24 }}>
                <h3 className="cc-display" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', margin: '0 0 3px' }}>Activity Log</h3>
                <div className="cc-scroll" style={{ marginTop: 17, maxHeight: 420, overflowY: 'auto', paddingRight: 10 }}>
                  {recentLogs.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', margin: '20px 0' }}>No recent activity.</p>
                  ) : (
                    recentLogs.slice(0, 10).map((log, index) => {
                      
                      const rawLogDate = log.createdat || log.created_at;

                      // THE FIX: Safe formatter never throws on bad dates
                      const logDate = safeFromNow(rawLogDate);
                      
                      let logTitle = formatAction(log.action || 'system_event');
                      let dotColor = '#4338CA'; 
                      
                      let refNo = `TKT-${String(log.entity_id).padStart(5, '0')}`; 
                      try {
                        const val = log.new_value || log.newvalue || log.old_value || log.oldvalue;
                        if (val) {
                          const parsed = typeof val === 'string' ? JSON.parse(val) : val;
                          if (parsed.referenceno) refNo = parsed.referenceno;
                        }
                      } catch (e) {}

                      if (log.action === 'ticket_created') { 
                        logTitle = `Ticket ${refNo} Created`; 
                        dotColor = '#0F766E'; 
                      } else if (log.action === 'ticket_updated') { 
                        logTitle = `Ticket ${refNo} Updated`; 
                        dotColor = '#C2410C'; 
                      } else if (log.action === 'ticket_reassigned') { 
                        logTitle = `Ticket ${refNo} Reassigned`; 
                        dotColor = '#7E22CE'; 
                      } else if (log.action === 'comment_added') { 
                        logTitle = `Comment on ${refNo}`; 
                        dotColor = '#047857'; 
                      } else if (log.action === 'ticket_resolved' || log.action === 'ticket_closed') { 
                        logTitle = `Ticket ${refNo} Closed`; 
                        dotColor = '#047857'; 
                      } else if (log.action === 'user_login') { 
                        logTitle = 'Logged In'; 
                        dotColor = '#047857'; 
                      } else if (log.action === 'user_logout') { 
                        logTitle = 'Logged Out'; 
                        dotColor = '#8B86B5'; 
                      }
                      
                      return (
                        <div key={log.id || index} className="cc-log-item">
                          <div className="cc-log-dot" style={{ background: dotColor }} />
                          
                          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: logTitle.includes('Failed') ? '#BE123C' : 'var(--ink)' }}>
                            {logTitle}
                          </p>
                          <p className="cc-mono" style={{ margin: 0, fontSize: 10, color: 'var(--muted)' }}>
                            {logDate}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </>
  );
}