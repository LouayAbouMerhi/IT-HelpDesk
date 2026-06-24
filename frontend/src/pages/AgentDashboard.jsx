import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

import GlobalStyles from '../components/GlobalStyles';
import TicketModal from '../components/TicketModal';
import NotificationBell from '../components/NotificationBell';

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ activeTickets: 0, criticalTickets: 0, resolvedToday: 0, avgResolutionTime: '2.4h' });
  const [myTickets, setMyTickets] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Support Agent"}');
  
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
      const res = await api.get(`/agent/dashboard?t=${Date.now()}`);
      
      const fetchedTickets = res.data.tickets || [];
      
      setMyTickets(fetchedTickets);
      setRecentLogs(res.data.activity_logs || []);
      
      setStats({
        activeTickets: fetchedTickets.filter(t => t.statusid === 1 || t.statusid === 2 || t.statusid === 5).length,
        criticalTickets: fetchedTickets.filter(t => t.priorityid === 4 && t.statusid !== 3 && t.statusid !== 4).length,
        resolvedToday: fetchedTickets.filter(t => t.statusid === 3).length, 
        avgResolutionTime: res.data.avg_resolution_time || '1.8h'
      });

    } catch (err) {
      console.error("Failed to load agent data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchDashboardData();
  }, [navigate]);

  const safeTickets = myTickets || [];
  
  const filteredTickets = safeTickets.filter(ticket => {
    const q = (searchQuery || '').toLowerCase().trim();
    const pId = String(ticket.priorityid || ticket.PriorityId || '1');
    const sId = String(ticket.statusid || ticket.StatusId || '1');

    const priorityNames = { '4': 'critical', '3': 'high', '2': 'medium', '1': 'low' };
    const statusNames = { '1': 'open', '2': 'in progress', '3': 'resolved', '4': 'closed', '5': 'pending' };

    const pText = priorityNames[pId] || 'low';
    const sText = statusNames[sId] || 'open';

    const searchableString = `${ticket.referenceno || ''} ${ticket.title || ''} ${ticket.category_name || ''} ${pText} ${sText}`.toLowerCase();

    const matchesSearch = !q || searchableString.includes(q);
    const matchesStatus = !filterStatus || sId === String(filterStatus);
    const matchesPriority = !filterPriority || pId === String(filterPriority);
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
  const timeline = getTimeline();

  // Human-friendly labels for the audited actions an agent performs.
  const ACTION_LABELS = {
    ticket_created: 'Created a ticket',
    ticket_updated: 'Updated a ticket',
    ticket_status_changed: 'Changed ticket status',
    ticket_resolved: 'Resolved a ticket',
    ticket_closed: 'Closed a ticket',
    ticket_reassigned: 'Reassigned a ticket',
    ticket_escalated: 'Escalated a ticket',
    ticket_assigned: 'Assigned a ticket',
    internal_note_added: 'Added an internal note',
    comment_added: 'Added a comment',
    attachment_uploaded: 'Uploaded an attachment',
    user_login: 'Signed in',
    user_logout: 'Signed out',
    password_changed: 'Changed password',
    profile_updated: 'Updated profile',
  };
  const formatAction = (action) => {
    if (!action) return 'Activity';
    return ACTION_LABELS[action] ||
      action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Laravel's query builder returns timestamps as "YYYY-MM-DD HH:MM:SS" (space,
  // no timezone) which Safari/Firefox parse as Invalid Date. Normalise first.
  const safeDateTime = (raw) => {
    if (!raw) return '—';
    const d = new Date(typeof raw === 'string' ? raw.replace(' ', 'T') : raw);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const ticketRef = (log) => {
    const id = log.entity_id ?? log.entityid;
    const type = log.entity_type ?? log.entitytype;
    if (!id || (type && type !== 'Ticket')) return null;
    return `TKT-${String(id).padStart(5, '0')}`;
  };

  if (loading) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--border)', borderTopColor: 'var(--sky)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 8, border: '2px solid var(--border)', borderBottomColor: 'var(--emerald)', borderRadius: '50%', animation: 'spin 1.1s linear infinite reverse' }} />
        </div>
      </div>
    </>
  );

  return (
    <>
      <GlobalStyles />

      {selectedTicket && (
        <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onSuccess={() => { setSelectedTicket(null); fetchDashboardData(); }} />
      )}

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
        <div className="orb-a" style={{ position: 'fixed', top: '-8%', right: '2%', width: 640, height: 640, background: 'radial-gradient(circle, rgba(14,165,233,.07) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />
        <div className="orb-b" style={{ position: 'fixed', bottom: '-10%', left: '5%', width: 560, height: 560, background: 'radial-gradient(circle, rgba(16,185,129,.06) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />

        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="desktop-sidebar" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 252, background: '#fff', borderRight: '1px solid var(--border)', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '4px 0 24px rgba(15,23,42,0.04)' }}>
          <div>
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg, var(--sky) 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(14,165,233,.3)' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '.04em' }}>IT</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: 'var(--txt-primary)' }}>Agent Workspace</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--sky)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Support Specialist</div>
                </div>
              </div>
            </div>

            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { emoji: '◧', label: 'My Overview', id: 'overview' },
                { emoji: '⊟', label: 'My Ticket Queue', id: 'tickets' },
              ].map(({ emoji, label, id }, i) => {
                const isActive = activeTab === id;

                return (
                  <button 
                    key={i} 
                    onClick={() => setActiveTab(id)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 10px 18px', 
                      borderRadius: 10, border: 'none', textAlign: 'left', cursor: 'pointer',
                      background: isActive ? 'var(--sky-light, #e0f2fe)' : 'transparent', 
                      color: isActive ? 'var(--sky, #0ea5e9)' : '#64748b', 
                      fontWeight: isActive ? 700 : 500, fontSize: 13, transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--sky-light), #bae6fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--sky)' }}>
                  {user.name?.charAt(0) || 'A'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                </div>
              </div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 7px', color: 'var(--txt-muted)', borderRadius: 8, fontSize: 14 }}>⏻</button>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, marginLeft: 252 }}>
          
          <header className="dash-header" style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(243,249,255,.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '12px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div className="search-wrap" style={{ position: 'relative', width: 240 }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-muted)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Search my tickets..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1.5px solid var(--border)', borderRadius: 10, background: '#fff', fontSize: 12, color: '#000' }} 
                />
              </div>

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 12, outline: 'none', background: '#fff', cursor: 'pointer' }}>
                <option value="">All Statuses</option>
                <option value="1">Open</option>
                <option value="2">In Progress</option>
                <option value="3">Resolved</option>
                <option value="5">Pending</option>
              </select>

              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 12, outline: 'none', background: '#fff', cursor: 'pointer' }}>
                <option value="">All Priorities</option>
                <option value="4">Critical</option>
                <option value="3">High</option>
                <option value="2">Medium</option>
                <option value="1">Low</option>
              </select>
              
              {(searchQuery || filterStatus || filterPriority) && (
                <button onClick={() => { setSearchQuery(''); setFilterStatus(''); setFilterPriority(''); }} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, background: 'var(--rose-light)', color: 'var(--rose)', cursor: 'pointer' }}>
                  Clear Filters
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
              <NotificationBell onOpenTicket={handleOpenTicketFromNotification} />
              <button onClick={fetchDashboardData} style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#000', fontSize: 12, fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>↻</button>
            </div>
          </header>

          <div className="dashboard-pad" style={{ padding: '28px 30px', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
            
            {/* ========================================= */}
            {/* TAB 1: OVERVIEW */}
            {/* ========================================= */}
            {activeTab === 'overview' && (
              <div className="fade-up">
                {/* HERO BANNER */}
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '26px 30px', marginBottom: 24, background: 'linear-gradient(120deg,#0284c7,#0ea5e9 55%,#38bdf8)', boxShadow: '0 22px 50px -26px rgba(2,132,199,.7)' }}>
                  <div style={{ position: 'absolute', top: -60, right: -30, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,.13)' }} />
                  <div style={{ position: 'absolute', bottom: -80, right: 150, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.09)' }} />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', flexShrink: 0, fontSize: 26 }}>🎧</div>
                      <div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: '.16em', textTransform: 'uppercase', margin: '0 0 5px' }}>Welcome back, {user.name.split(' ')[0]}</p>
                        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.5px', margin: 0 }}>My Workspace</h1>
                        <p style={{ color: 'rgba(255,255,255,.9)', fontSize: 13, margin: '5px 0 0' }}>Here is the current state of your ticket queue.</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 18px', backdropFilter: 'blur(6px)' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stats.activeTickets}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>Active</div>
                      </div>
                      <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 18px', backdropFilter: 'blur(6px)' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stats.resolvedToday || 0}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>Resolved</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stats-grid" style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {[
                    { title: 'My Active Tickets', value: stats.activeTickets, icon: '⊟', grad: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', glow: 'rgba(14,165,233,.2)' },
                    { title: 'Needs Attention', value: stats.criticalTickets || 0, icon: '⚠', grad: 'linear-gradient(135deg,#f43f5e,#e11d48)', glow: 'rgba(244,63,94,.2)' },
                    { title: 'Resolved Today', value: stats.resolvedToday || 0, icon: '✓', grad: 'linear-gradient(135deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,.2)' },
                    { title: 'Avg Resolution Time', value: stats.avgResolutionTime, icon: '⏱', grad: 'linear-gradient(135deg,#8b5cf6,#6366f1)', glow: 'rgba(139,92,246,.2)' },
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

                <div className="charts-grid" style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                  
                  {/* --- RECHARTS: My Queue by Severity (Bar Chart) spans full width --- */}
                  <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 16px' }}>My Queue by Severity</h3>
                    <div style={{ flex: 1, minHeight: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={60}>
                          <XAxis 
                            dataKey="label" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--txt-muted)', fontWeight: 700 }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--txt-muted)' }} 
                          />
                          <Tooltip 
                            cursor={{ fill: 'var(--bg-2)' }}
                            contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px' }}
                          />
                          <Bar dataKey="volume" radius={[6, 6, 0, 0]} animationDuration={1500}>
                            {timeline.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.bar} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                <div className="charts-grid" style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
                  <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: 0 }}>Recent Updates</h3>
                      <button onClick={() => setActiveTab('tickets')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--sky)', background: 'none', border: 'none', cursor: 'pointer' }}>View Queue →</button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafbfe' }}>
                            {['Reference', 'Title', 'Priority', 'Status'].map((h, i) => (
                              <th key={i} style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTickets.slice(0, 5).map((ticket) => {
                            const pId = Number(ticket.priorityid) || 1;
                            const pName = pId === 4 ? 'Critical' : pId === 3 ? 'High' : pId === 2 ? 'Medium' : 'Low';
                            const sId = Number(ticket.statusid) || 1;
                            const sName = sId === 2 ? 'In Progress' : sId === 3 ? 'Resolved' : sId === 4 ? 'Closed' : sId === 5 ? 'Pending' : 'Open';
                            const ps = pStyle(pName);
                            const ss = sStyle(sName);

                            return (
                              <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--sky)' }}>{ticket.referenceno || `TKT-${ticket.id}`}</td>
                                <td style={{ padding: '14px 20px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)' }}>{ticket.title}</td>
                                <td style={{ padding: '14px 20px' }}>
                                  <span style={{ background: ps.bg, borderColor: ps.bc, color: ps.color, padding: '4px 8px', borderRadius: 6, border: '1px solid', fontSize: 11, fontWeight: 700 }}>{pName}</span>
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                  <span style={{ background: ss.bg, borderColor: ss.bc, color: ss.color, padding: '4px 8px', borderRadius: 6, border: '1px solid', fontSize: 11, fontWeight: 700 }}>{sName}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>My Activity</h3>
                    <div style={{ marginTop: 15, maxHeight: 420, overflowY: 'auto' }}>
                      {recentLogs.length === 0 ? (
                         <p style={{ fontSize: 13, color: 'var(--txt-muted)', textAlign: 'center', margin: '20px 0' }}>No recent activity.</p>
                      ) : recentLogs.slice(0, 10).map((log, index) => {
                        const logDate = safeDateTime(log.created_at || log.createdat);
                        const ref = ticketRef(log);
                        return (
                          <div key={log.id ?? index} style={{ position: 'relative', paddingLeft: 16, borderLeft: '2px solid var(--border)', paddingBottom: 16 }}>
                            <div style={{ position: 'absolute', left: -5, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--sky)', border: '2px solid #fff' }} />
                            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: 'var(--txt-primary)' }}>
                              {formatAction(log.action)}
                              {ref && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--sky)' }}> · {ref}</span>}
                            </p>
                            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)' }}>{logDate}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 2: TICKET QUEUE (Full Table) */}
            {/* ========================================= */}
            {activeTab === 'tickets' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-.5px', margin: '0 0 4px' }}>My Ticket Queue</h1>
                  <p style={{ fontSize: 14, color: 'var(--txt-muted)', margin: 0 }}>Showing {filteredTickets.length} active tickets assigned to you.</p>
                </div>

                <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flex: 1 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafbfe' }}>
                          {['Reference', 'Title', 'Priority', 'Status', 'Created At'].map((h, i) => (
                            <th key={i} style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((ticket) => {
                          const pId = Number(ticket.priorityid) || 1;
                          const pName = pId === 4 ? 'Critical' : pId === 3 ? 'High' : pId === 2 ? 'Medium' : 'Low';
                          const sId = Number(ticket.statusid) || 1;
                          const sName = sId === 2 ? 'In Progress' : sId === 3 ? 'Resolved' : sId === 4 ? 'Closed' : sId === 5 ? 'Pending' : 'Open';
                          const displayDate = new Date(ticket.created_at || ticket.createdat).toLocaleString(undefined, { month: 'short', day: 'numeric' });

                          return (
                            <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                              <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--sky)', whiteSpace: 'nowrap' }}>{ticket.referenceno || `TKT-${ticket.id}`}</td>
                              <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)' }}>{ticket.title}</td>
                              <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                                <span style={{ background: pStyle(pName).bg, borderColor: pStyle(pName).bc, color: pStyle(pName).color, padding: '4px 8px', borderRadius: 6, border: '1px solid', fontSize: 11, fontWeight: 700 }}>{pName}</span>
                              </td>
                              <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                                <span style={{ background: sStyle(sName).bg, borderColor: sStyle(sName).bc, color: sStyle(sName).color, padding: '4px 8px', borderRadius: 6, border: '1px solid', fontSize: 11, fontWeight: 700 }}>{sName}</span>
                              </td>
                              <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--txt-muted)' }}>{displayDate}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}