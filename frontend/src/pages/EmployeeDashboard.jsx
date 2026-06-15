import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GlobalStyles from '../components/GlobalStyles';
import CreateTicketModal from '../components/CreateTicketModal';
import TicketModal from '../components/TicketModal';

export default function EmployeeDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Custom Delete Modal State
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // --- NEW: View Mode State ('mine' or 'company') ---
  const [viewMode, setViewMode] = useState('mine');

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // --- UPDATED: Dynamic Fetch based on View Mode ---
  const fetchTicketsData = async () => {
    setLoading(true);
    try {
      const endpoint = viewMode === 'mine' ? '/my-tickets' : '/company-tickets';
      const res = await api.get(`${endpoint}?t=${Date.now()}`);
      setTickets(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch tickets whenever the viewMode changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    
    if (currentUser.role === 'Admin' || currentUser.role === 'Agent' || currentUser.role === 'Supervisor') {
        navigate('/dashboard');
        return;
    }
    
    fetchTicketsData();
  }, [viewMode, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const confirmDelete = async () => {
    if (!ticketToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/tickets/${ticketToDelete.id}`);
      setTicketToDelete(null);
      fetchTicketsData(); // Refresh the list instantly
    } catch (err) {
      alert('Failed to cancel ticket.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate quick stats
  const openCount = tickets.filter(t => [1, 2, 5].includes(Number(t.statusid || t.StatusId))).length;
  const resolvedCount = tickets.filter(t => [3, 4].includes(Number(t.statusid || t.StatusId))).length;

  const sStyle = (id) => ({
    1: { bg: '#f5f3ff', color: '#7c3aed', label: 'Open' },
    2: { bg: '#fffbeb', color: '#d97706', label: 'In Progress' },
    3: { bg: '#f0fdf4', color: '#059669', label: 'Resolved' },
    4: { bg: '#f1f5f9', color: '#475569', label: 'Closed' },
    5: { bg: '#e0f2fe', color: '#0284c7', label: 'Pending' }
  }[id] || { bg: '#f1f5f9', color: '#475569', label: 'Unknown' });

  // Filter Logic
  const filteredTickets = tickets.filter(ticket => {
    const q = searchQuery.toLowerCase().trim();
    const tTitle = (ticket.title || '').toLowerCase();
    const tRef = (ticket.referenceno || `TKT-00${ticket.id}`).toLowerCase();
    const tCreator = (ticket.creator_name || '').toLowerCase();
    const sId = String(ticket.statusid || ticket.StatusId || '1');

    const matchesSearch = !q || tTitle.includes(q) || tRef.includes(q) || tCreator.includes(q);
    const matchesStatus = !statusFilter || sId === String(statusFilter);

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <GlobalStyles />
      
      {isCreateModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => { 
            setIsCreateModalOpen(false); 
            setViewMode('mine'); // Automatically switch back to 'My Requests' when a new ticket is submitted
            fetchTicketsData();
          }} 
        />
      )}

      {selectedTicket && (
        <TicketModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          onSuccess={() => { setSelectedTicket(null); fetchTicketsData(); }} 
        />
      )}

      {ticketToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 10 }}>
          <div className="fade-up" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 20, padding: '30px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>🗑️</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Cancel Request?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Are you sure you want to cancel <strong>{ticketToDelete.referenceno || `TKT-00${ticketToDelete.id}`}</strong>? This action will permanently close the ticket.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setTicketToDelete(null)} disabled={isDeleting} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}>Keep It</button>
              <button type="button" onClick={confirmDelete} disabled={isDeleting} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer', background: '#e11d48', border: 'none', color: '#ffffff', boxShadow: '0 4px 14px rgba(225,29,72,0.3)' }}>{isDeleting ? 'Cancelling...' : 'Yes, Cancel Request'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        
        {/* SIDEBAR */}
        <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 252, background: '#fff', borderRight: '1px solid #e2e8f0', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(14,165,233,.3)' }}>
                  <span style={{ fontSize: 18, color: '#fff' }}>👋</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Employee Portal</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: '#0ea5e9', textTransform: 'uppercase' }}>Self-Service</div>
                </div>
              </div>
            </div>
            
            {/* --- UPDATED: Interactive Sidebar Navigation --- */}
            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button 
                onClick={() => setViewMode('mine')} 
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', background: viewMode === 'mine' ? '#e0f2fe' : 'transparent', color: viewMode === 'mine' ? '#0284c7' : '#64748b', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              >
                <span>👤</span> My Requests
              </button>
              
              <button 
                onClick={() => setViewMode('company')} 
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', background: viewMode === 'company' ? '#e0f2fe' : 'transparent', color: viewMode === 'company' ? '#0284c7' : '#64748b', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              >
                <span>🏢</span> Company Requests
              </button>
            </nav>
          </div>

          <div style={{ padding: '14px 12px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 12, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0284c7' }}>
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p>
                </div>
              </div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 7px', color: '#94a3b8', borderRadius: 8, fontSize: 14 }}>⏻</button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ marginLeft: 252, flex: 1, padding: '40px', maxWidth: 1200 }}>
          
          <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30, flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                {viewMode === 'mine' ? `Welcome back, ${currentUser.name?.split(' ')[0]}!` : 'Company Requests'}
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                {viewMode === 'mine' ? 'Track your IT requests or submit a new issue to the team.' : 'View all active and historical tickets across the organization.'}
              </p>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              style={{ padding: '12px 24px', background: 'var(--accent, #4f46e5)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(79,70,229,.25)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              + Submit New Request
            </button>
          </div>

          <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30, animationDelay: '0.1s' }}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em' }}>Open Requests</p>
              <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#0f172a' }}>{openCount}</h2>
            </div>
            <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em' }}>Resolved / Closed</p>
              <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#0f172a' }}>{resolvedCount}</h2>
            </div>
            <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em' }}>Total Submissions</p>
              <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#0f172a' }}>{tickets.length}</h2>
            </div>
          </div>

          <div className="fade-up" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', animationDelay: '0.2s' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                {viewMode === 'mine' ? 'My Request History' : 'All Company Tickets'}
              </h3>
              
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                
                <div style={{ position: 'relative', maxWidth: '300px', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>🔍</span>
                  <input 
                    type="text" 
                    placeholder={viewMode === 'mine' ? "Search titles or ID..." : "Search titles, ID, or names..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', color: '#0f172a' }}
                  />
                </div>

                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', cursor: 'pointer', color: '#0f172a', background: '#fff' }}
                >
                  <option value="">All Statuses</option>
                  <option value="1">Open</option>
                  <option value="2">In Progress</option>
                  <option value="5">Pending</option>
                  <option value="3">Resolved</option>
                  <option value="4">Closed</option>
                </select>

                {(searchQuery || statusFilter) && (
                  <button 
                    onClick={() => { setSearchQuery(''); setStatusFilter(''); }} 
                    style={{ padding: '10px 16px', background: '#fef2f2', color: '#e11d48', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Clear Filters
                  </button>
                )}
                
                <button onClick={fetchTicketsData} style={{ padding: '10px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, cursor: 'pointer', color: '#64748b' }} title="Refresh List">
                  ↻
                </button>

              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Reference</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Subject</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    
                    {/* Only show 'Reported By' in Company View */}
                    {viewMode === 'company' && (
                      <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Reported By</th>
                    )}
                    
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned To</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Last Updated</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={viewMode === 'company' ? 7 : 6} style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>Loading requests...</td></tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={viewMode === 'company' ? 7 : 6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                        <p style={{ color: '#0f172a', fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>No tickets found</p>
                        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                          {(searchQuery || statusFilter) ? "Try clearing your filters." : "No IT requests found for this view."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map(ticket => {
                      const status = sStyle(Number(ticket.statusid || ticket.StatusId));
                      const date = ticket.updatedat || ticket.updated_at || ticket.createdat || ticket.created_at;
                      const displayDate = date ? new Date(date.replace(' ', 'T') + 'Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';
                      
                      // Check if the current user created this specific ticket
                      const isCreator = ticket.createdby === currentUser.id || ticket.userid === currentUser.id;
                      
                      return (
                        <tr 
                          key={ticket.id} 
                          onClick={() => setSelectedTicket(ticket)}
                          style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background-color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '16px 24px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent, #4f46e5)' }}>
                            {ticket.referenceno || `TKT-00${ticket.id}`}
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                            {ticket.title}
                            {ticket.category_name && <span style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 4 }}>{ticket.category_name}</span>}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ background: status.bg, color: status.color, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                              {status.label}
                            </span>
                          </td>
                          
                          {/* Only show 'Reported By' data in Company View */}
                          {viewMode === 'company' && (
                            <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                              {ticket.creator_name || 'Unknown User'}
                              {isCreator && <span style={{ display: 'inline-block', marginLeft: 6, background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>YOU</span>}
                            </td>
                          )}

                          <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: ticket.agent_name ? '#0f172a' : '#94a3b8' }}>
                            {ticket.agent_name || 'Pending Assignment'}
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569' }}>
                            {displayDate}
                          </td>
                          
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            {/* Security Check: Only show delete button if it's Open/Pending AND the current user created it */}
                            {[1, 5].includes(Number(ticket.statusid || ticket.StatusId)) && isCreator && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTicketToDelete(ticket); 
                                  }}
                                  style={{ background: '#fef2f2', color: '#e11d48', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 16, transition: 'transform 0.1s' }}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                  title="Cancel Ticket"
                                >
                                  🗑️
                                </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}