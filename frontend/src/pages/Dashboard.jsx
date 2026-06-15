import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

import GlobalStyles from '../components/GlobalStyles';
import CreateTicketModal from '../components/CreateTicketModal';
import TicketModal from '../components/TicketModal';
import NotificationBell from '../components/NotificationBell';
import { format, formatDistanceToNow } from 'date-fns';

// --- THE FIX: Safe UTC Date Parser ---
// This ensures raw DB queries AND Laravel Eloquent dates are both parsed 
// perfectly into your local timezone without double-appending the 'Z'.
const parseUtcDate = (dateString) => {
  if (!dateString) return new Date();
  let str = dateString.replace(' ', 'T');
  if (!str.endsWith('Z')) {
    str += 'Z';
  }
  return new Date(str);
};

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
      'var(--accent)', 'var(--sky)', 'var(--amber)', 'var(--emerald)',
      'var(--rose)', '#8b5cf6', '#ec4899', '#14b8a6'
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
      Critical: { bar: 'var(--rose)', glow: 'rgba(244,63,94,.2)' },
      High: { bar: 'var(--amber)', glow: 'rgba(245,158,11,.2)' },
      Medium: { bar: 'var(--accent)', glow: 'rgba(79,70,229,.2)' },
      Low: { bar: 'var(--emerald)', glow: 'rgba(16,185,129,.2)' },
    };
    return Object.entries(p).map(([label, volume]) => ({
      label, volume, h: Math.max((volume / max) * 100, volume > 0 ? 6 : 0), ...palette[label],
    }));
  };

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
    'Closed':      { bg: '#f1f5f9', bc: '#cbd5e1', color: '#475569' },
    'Pending':     { bg: '#e0f2fe', bc: '#bae6fd', color: '#0284c7' },
  }[name] || { bg: '#f5f3ff', bc: '#ddd6fe', color: '#7c3aed' });

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };
  const categories = getCategories();
  const timeline = getTimeline();
  const formatAction = (action) => action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (loading) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 8, border: '2px solid var(--border)', borderBottomColor: 'var(--sky)', borderRadius: '50%', animation: 'spin 1.1s linear infinite reverse' }} />
        </div>
      </div>
    </>
  );

  return (
    <>
      <GlobalStyles />
      
      {isCreateModalOpen && (
        <CreateTicketModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => { setIsCreateModalOpen(false); fetchDashboardData(); }} />
      )}

      {selectedTicket && (
        <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onSuccess={() => { setSelectedTicket(null); fetchDashboardData(); }} />
      )}

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
        <div className="orb-a" style={{ position: 'fixed', top: '-8%', right: '2%', width: 640, height: 640, background: 'radial-gradient(circle, rgba(79,70,229,.07) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />
        <div className="orb-b" style={{ position: 'fixed', bottom: '-10%', left: '5%', width: 560, height: 560, background: 'radial-gradient(circle, rgba(14,165,233,.06) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />

        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="desktop-sidebar" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 252, background: '#fff', borderRight: '1px solid var(--border)', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '4px 0 24px rgba(15,23,42,0.04)' }}>
          <div>
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(79,70,229,.3)' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '.04em' }}>IT</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: 'var(--txt-primary)' }}>CommandCenter</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--accent)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Enterprise Ops</div>
                </div>
              </div>
            </div>

            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { emoji: '◧', label: 'Overview', path: '/dashboard' },
                { emoji: '⊟', label: 'Incident Tickets', path: '/tickets' },
                { emoji: '◎', label: 'Agent Roster', path: '/roster' },
                { emoji: '⏱', label: 'System Audit Log', path: '/activity-logs' },
              ].map(({ emoji, label, path }, i) => {
                const isActive = location.pathname === path;

                return (
                  <a 
                    key={i} 
                    href={path} 
                    onClick={(e) => { e.preventDefault(); navigate(path); }}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 10px 18px', 
                      borderRadius: 10, textDecoration: 'none', 
                      background: isActive ? 'var(--accent-light, #e0e7ff)' : 'transparent', 
                      color: isActive ? 'var(--accent, #4f46e5)' : '#64748b', 
                      fontWeight: isActive ? 700 : 500, fontSize: 13, transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
                    <span>{label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--accent-light), #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>
                  {user.name?.charAt(0) || 'A'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-ghost" title="Logout" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 7px', color: 'var(--txt-muted)', borderRadius: 8, fontSize: 14 }}>⏻</button>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, marginLeft: 252 }}>
          
          <header className="dash-header" style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(244,246,251,.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '12px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              
              <div className="search-wrap" style={{ position: 'relative', width: 240 }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-muted)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Search references, assignees..." 
                  className="input-field" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1.5px solid var(--border)', borderRadius: 10, background: '#fff', fontSize: 12, color: '#000000' }} 
                />
              </div>

              <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 12, outline: 'none', background: '#fff', color: '#000000', cursor: 'pointer' }}>
                <option value="">All Assignments</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 12, outline: 'none', background: '#fff', color: '#000000', cursor: 'pointer' }}>
                <option value="">All Statuses</option>
                <option value="1">Open</option>
                <option value="2">In Progress</option>
                <option value="5">Pending</option>
                <option value="3">Resolved</option>
                <option value="4">Closed</option>
              </select>

              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 12, outline: 'none', background: '#fff', color: '#000000', cursor: 'pointer' }}>
                <option value="">All Priorities</option>
                <option value="4">Critical</option>
                <option value="3">High</option>
                <option value="2">Medium</option>
                <option value="1">Low</option>
              </select>
              
              {(searchQuery || filterStatus || filterPriority || filterAssignee) && (
                <button onClick={() => { setSearchQuery(''); setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); }} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, background: 'var(--rose-light)', color: 'var(--rose)', cursor: 'pointer' }}>
                  Clear Filters
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <NotificationBell onOpenTicket={handleOpenTicketFromNotification} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--emerald-light)', border: '1px solid #a7f3d0', borderRadius: 8, padding: '6px 12px' }}>
                <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'block' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#059669', letterSpacing: '.1em' }}>LIVE</span>
              </div>
              <button onClick={fetchDashboardData} className="btn-ghost" style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#000000', fontSize: 12, fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>↻</button>
              <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: 'var(--shadow-accent)', whiteSpace: 'nowrap' }}>+ New Ticket</button>
            </div>
          </header>

          <div className="dashboard-pad" style={{ padding: '28px 30px', flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto' }}>
            <div className="fade-up" style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-.5px', margin: '0 0 4px' }}>System Overview</h1>
            </div>

            <div className="stats-grid" style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { title: 'Pipeline Total', value: safeTickets.length, icon: '⊟', grad: 'linear-gradient(135deg,#4f46e5,#7c73f0)', glow: 'rgba(79,70,229,.2)' },
                { title: 'In Evaluation', value: stats.inProgress || 0, icon: '⌛', grad: 'linear-gradient(135deg,#f59e0b,#fb923c)', glow: 'rgba(245,158,11,.2)' },
                { title: 'Resolved Today', value: stats.resolvedToday || 0, icon: '✓', grad: 'linear-gradient(135deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,.2)' },
                { title: 'Active Agents', value: stats.activeAgents || 0, icon: '◉', grad: 'linear-gradient(135deg,#0ea5e9,#6366f1)', glow: 'rgba(14,165,233,.2)' },
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.12em', margin: '0 0 8px' }}>{s.title}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 32, fontWeight: 800, color: 'var(--txt-primary)', margin: 0, lineHeight: 1 }}>{s.value}</p>
                  </div>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', boxShadow: `0 8px 22px ${s.glow}` }}>{s.icon}</div>
                </div>
              ))}
            </div>

            <div className="charts-grid" style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Incident Severity Density</h3>
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 16, paddingBottom: 8, borderBottom: '1.5px solid var(--border)' }}>
                  {timeline.map((d, i) => (
                    <div key={i} className="bar-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--txt-secondary)' }}>{d.volume}</span>
                      <div className="bar-inner" style={{ width: '100%', maxWidth: 52, height: `${d.h}%`, minHeight: d.volume > 0 ? 4 : 0, background: d.bar, borderRadius: '8px 8px 4px 4px', boxShadow: `0 4px 18px ${d.glow}` }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase' }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Category Allocation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 20 }}>
                  {categories.map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-secondary)' }}>{c.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--txt-primary)' }}>{c.count} ({c.percentage}%)</span>
                      </div>
                      <div style={{ height: 7, background: 'var(--bg-2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ width: `${c.percentage}%`, height: '100%', background: c.bar, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="charts-grid" style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
              
              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: 0 }}>Recent Pipeline Incidents</h3>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-light)', padding: '4px 12px', borderRadius: 8, border: '1px solid #c4b5fd' }}>
                    Showing 10 Latest
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafbfe' }}>
                        {['Incident Reference', 'Title', 'Priority', 'Status', 'Assigned To', 'Created At'].map((h, i) => (
                          <th key={i} style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTickets.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--txt-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                            No incidents match the active filters.
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
                          
                          // THE FIX: Applied Safe Parser Here
                          const displayDate = rawCreatedAt 
                            ? format(parseUtcDate(rawCreatedAt), 'MMM dd, yyyy')
                            : 'Just now';

                          return (
                            <tr key={ticket.id} className="ticket-row" onClick={() => setSelectedTicket(ticket)} style={{ borderBottom: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>
                              <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{tNum}</td>
                              <td style={{ padding: '14px 20px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span className="t-title" style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)' }}>{ticket.title || 'Untitled Incident'}</span>
                              </td>
                              <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                <span className="badge" style={{ background: ps.bg, borderColor: ps.bc, color: ps.color }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: ps.dot, display: 'inline-block', flexShrink: 0 }}/>{pName}
                                </span>
                              </td>
                              <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                <span className="badge" style={{ background: ss.bg, borderColor: ss.bc, color: ss.color }}>{sName}</span>
                              </td>

                              <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {ticket.agent_name ? (
                                    <>
                                      <div style={{ width: 15, height: 20, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>
                                        {ticket.agent_name.charAt(0).toUpperCase()}
                                      </div>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-primary)' }}>{ticket.agent_name}</span>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-muted)' }}>Unassigned</span>
                                  )}
                                </div>
                              </td>

                              <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--txt-muted)' }}>{displayDate}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Activity Log</h3>
                <div style={{ marginTop: 15, maxHeight: 420, overflowY: 'auto', paddingRight: 10 }}>
                  {recentLogs.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--txt-muted)', textAlign: 'center', margin: '20px 0' }}>No recent activity.</p>
                  ) : (
                    recentLogs.slice(0, 10).map((log, index) => {
                      
                      const rawLogDate = log.createdat || log.created_at;
                      
                      // THE FIX: Applied Safe Parser Here
                      const logDate = rawLogDate 
                        ? formatDistanceToNow(parseUtcDate(rawLogDate), { addSuffix: true }) 
                        : 'Just now';
                      
                      let logTitle = formatAction(log.action || 'system_event');
                      let dotColor = 'var(--accent)'; 
                      
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
                        dotColor = 'var(--sky)'; 
                      } else if (log.action === 'ticket_updated') { 
                        logTitle = `Ticket ${refNo} Updated`; 
                        dotColor = 'var(--amber)'; 
                      } else if (log.action === 'ticket_reassigned') { 
                        logTitle = `Ticket ${refNo} Reassigned`; 
                        dotColor = '#8b5cf6'; 
                      } else if (log.action === 'comment_added') { 
                        logTitle = `Comment on ${refNo}`; 
                        dotColor = 'var(--emerald)'; 
                      } else if (log.action === 'ticket_resolved' || log.action === 'ticket_closed') { 
                        logTitle = `Ticket ${refNo} Closed`; 
                        dotColor = 'var(--emerald)'; 
                      } else if (log.action === 'user_login') { 
                        logTitle = 'Logged In'; 
                        dotColor = 'var(--emerald)'; 
                      } else if (log.action === 'user_logout') { 
                        logTitle = 'Logged Out'; 
                        dotColor = 'var(--txt-muted)'; 
                      }
                      
                      return (
                        <div key={log.id || index} className="log-item">
                          <div className="log-dot" style={{ borderColor: dotColor }} />
                          
                          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: logTitle.includes('Failed') ? 'var(--rose)' : 'var(--txt-primary)' }}>
                            {logTitle}
                          </p>
                          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)' }}>
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