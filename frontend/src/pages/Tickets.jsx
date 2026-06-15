import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GlobalStyles from '../components/GlobalStyles';
import TicketModal from '../components/TicketModal';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

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
  };

  // --- BADGE HELPERS ---
  const getPriorityDetails = (id) => {
    const pId = Number(id);
    if (pId === 4) return { label: 'Critical', bg: '#ffe4e6', color: '#e11d48', border: '#fda4af' };
    if (pId === 3) return { label: 'High', bg: '#ffedd5', color: '#be123c', border: '#fdba74' };
    if (pId === 2) return { label: 'Medium', bg: '#fef3c7', color: '#d97706', border: '#fcd34d' };
    return { label: 'Low', bg: '#f0fdf4', color: '#15803d', border: '#86efac' };
  };

  const getStatusDetails = (id) => {
    const sId = Number(id);
    if (sId === 1) return { label: 'Open', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    if (sId === 2) return { label: 'In Progress', bg: '#fdf4ff', color: '#c026d3', border: '#f5d0fe' };
    if (sId === 3) return { label: 'Resolved', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    if (sId === 4) return { label: 'Closed', bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' };
    if (sId === 5) return { label: 'Pending', bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    return { label: 'Unknown', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
  };

  // --- FILTERING LOGIC ---
  const filteredTickets = tickets.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    
    // Check multiple potential name locations for the search
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

    return matchSearch && matchStatus && matchPriority;
  });

  // Check if any filter is currently active
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'All' || priorityFilter !== 'All';

  return (
    <>
      <GlobalStyles />
      
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
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
        
        {/* SIDEBAR */}
        <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 252, background: '#fff', borderRight: '1px solid #e2e8f0', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(79,70,229,.3)' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800, color: '#fff' }}>IT</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>CommandCenter</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>Enterprise Ops</div>
                </div>
              </div>
            </div>
            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: 13 }}>◧ Overview</a>
              <a href="/tickets" onClick={(e) => { e.preventDefault(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>⊟ Incident Tickets</a>
              <a href="/roster" onClick={(e) => { e.preventDefault(); navigate('/roster'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: 13 }}>◎ Agent Roster</a>
              <a href="/activity-logs" onClick={(e) => { e.preventDefault(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none' , color: '#475569' , fontWeight: 600, fontSize: 13 }}>⏱ System Audit Log</a>

            </nav>
          </div>
          <div style={{ padding: '14px 12px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 12, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--accent-light), #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>{currentUser.name?.charAt(0) || 'A'}</div>
                <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p></div>
              </div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 7px', color: '#94a3b8', borderRadius: 8, fontSize: 14 }}>⏻</button>
            </div>
          </div>
        </aside>

        {/* MAIN PAGE CONTENT */}
        <main style={{ marginLeft: 252, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
          
          {/* HEADER / CONTROLS */}
          <header style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0', padding: '12px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <input type="text" placeholder="Search by ticket ID, subject, or requester..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: 340, padding: '9px 14px', border: '1.5px solid #cbd5e1', borderRadius: 10, background: '#fff', color: '#0f172a', fontSize: 12, outline: 'none' }} />
              
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', border: '1.5px solid #cbd5e1', borderRadius: 10, background: '#fff', color: '#0f172a', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved/Closed">Resolved / Closed</option>
              </select>

              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ padding: '9px 14px', border: '1.5px solid #cbd5e1', borderRadius: 10, background: '#fff', color: '#0f172a', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* --- CLEAR FILTER BUTTON --- */}
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  style={{ padding: '8px 14px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, background: '#fee2e2', color: '#e11d48', cursor: 'pointer', transition: '0.2s' }}
                >
                  Clear Filters ✕
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={fetchTickets} style={{ background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#0f172a', fontSize: 12, fontWeight: 700 }}>↻ Refresh</button>
              <button onClick={() => setSelectedTicket({ isNew: true })} style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>+ New Ticket</button>
            </div>
          </header>

          <div style={{ padding: '28px 30px', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
            
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-.5px', margin: '0 0 4px' }}>Incident Tickets Queue</h1>
              <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Manage, route, and resolve enterprise support requests.</p>
            </div>

            {error && <div style={{ padding: '12px 16px', background: '#ffe4e6', color: '#e11d48', borderRadius: 12, marginBottom: 20, fontWeight: 600, fontSize: 13, border: '1px solid #fda4af' }}>{error}</div>}

            {/* TICKETS TABLE */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>Active Queue</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Showing {filteredTickets.length} Tickets</div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ticket ID</th>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Subject</th>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Requester</th>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Priority</th>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned To</th>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading tickets...</td></tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>No tickets match your filters.</td></tr>
                    ) : (
                      filteredTickets.map(t => {
                        const tNum = t.referenceno || t.TicketNumber || `TKT-00${t.id}`;
                        const priority = getPriorityDetails(t.priorityid || t.PriorityId);
                        const status = getStatusDetails(t.statusid || t.StatusId);

                        // --- ROBUST NAME EXTRACTION ---
                        const requesterStr = t.creator_name || t.requester_name || t.RequesterName || t.user?.fullname || t.user?.name || t.creator?.fullname || 'Unknown';
                        const assignedStr = t.agent_name || t.assigned_to_name || t.AssignedToName || t.assigned_user?.fullname || t.assigned_user?.name || t.agent?.fullname || null;
                        
                        // --- CHECK IF ASSIGNED ---
                        const isAssigned = Boolean(assignedStr);

                        return (
                          <tr 
                            key={t.id} 
                            onClick={() => setSelectedTicket(t)}
                            style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background-color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                              {tNum}
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#0f172a', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.title || 'Untitled Ticket'}
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569' }}>
                              {requesterStr}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: priority.bg, color: priority.color, border: `1px solid ${priority.border}` }}>
                                {priority.label}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                                {status.label}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569' }}>
                              {assignedStr ? assignedStr : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                {/* VIEW BUTTON (Always active) */}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }} 
                                  style={{ padding: '7px 14px', borderRadius: 8, background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                                >
                                  View
                                </button>

                                {/* EDIT BUTTON (Disabled if assigned) */}
                                <button 
                                  disabled={isAssigned}
                                  onClick={(e) => { e.stopPropagation(); if (!isAssigned) setSelectedTicket(t); }} 
                                  style={{ 
                                    padding: '7px 14px', 
                                    borderRadius: 8, 
                                    background: isAssigned ? '#f1f5f9' : '#fff', 
                                    color: isAssigned ? '#94a3b8' : '#0f172a', 
                                    border: '1px solid #cbd5e1', 
                                    fontWeight: 700, 
                                    fontSize: 11, 
                                    cursor: isAssigned ? 'not-allowed' : 'pointer',
                                    opacity: isAssigned ? 0.6 : 1
                                  }}
                                  title={isAssigned ? "Cannot edit a ticket that is already assigned" : "Edit Ticket"}
                                >
                                  Edit
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