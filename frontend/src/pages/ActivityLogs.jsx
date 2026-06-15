import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GlobalStyles from '../components/GlobalStyles';

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

  return (
    <>
      <GlobalStyles />
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        
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
              <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 500, fontSize: 13 }}>◧ Overview</a>
              <a href="/tickets" onClick={(e) => { e.preventDefault(); navigate('/tickets'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 500, fontSize: 13 }}>⊟ Incident Tickets</a>
              <a href="/roster" onClick={(e) => { e.preventDefault(); navigate('/roster'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 500, fontSize: 13 }}>◎ Agent Roster</a>
              <a href="/activity-logs" onClick={(e) => { e.preventDefault(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>⏱ System Audit Log</a>
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

        {/* MAIN CONTENT */}
        <main style={{ marginLeft: 252, flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* HEADER */}
          <header style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0', padding: '12px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <input type="text" placeholder="Search logs by user, action, or entity..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: 340, padding: '9px 14px', border: '1.5px solid #cbd5e1', borderRadius: 10, outline: 'none', fontSize: 12, color: '#0f172a' }} />
            <button onClick={fetchLogs} style={{ background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#0f172a', fontSize: 12, fontWeight: 700 }}>↻ Refresh Data</button>
          </header>

          <div style={{ padding: '28px 30px', flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto' }}>
            <div style={{ marginBottom: 30 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>System Audit Log</h1>
              <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Comprehensive timeline of all actions performed within the CommandCenter.</p>
            </div>

            {/* TIMELINE VIEW */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0', padding: '30px 40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>Loading security logs...</p>
              ) : filteredLogs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>No activity found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredLogs.map((log, index) => {
                    const ui = formatAction(log.action);
                    const details = parseDetails(log.new_value) || parseDetails(log.old_value);
                    const isLast = index === filteredLogs.length - 1;

                    return (
                      <div key={log.id} style={{ display: 'flex', gap: 24, position: 'relative', paddingBottom: isLast ? 0 : 32 }}>
                        
                        {/* THE TIMELINE LINE */}
                        {!isLast && <div style={{ position: 'absolute', top: 40, left: 19, bottom: 0, width: 2, background: '#e2e8f0' }} />}
                        
                        {/* ICON */}
                        <div style={{ position: 'relative', zIndex: 2, width: 40, height: 40, borderRadius: '50%', background: ui.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: `1px solid ${ui.color}30`, flexShrink: 0 }}>
                          {ui.icon}
                        </div>

                        {/* CONTENT */}
                        <div style={{ flex: 1, paddingTop: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                            <div>
                              <p style={{ margin: '0 0 4px', fontSize: 14, color: '#0f172a' }}>
                                <strong style={{ fontWeight: 800 }}>{log.user_name || 'System'}</strong> {ui.text.toLowerCase()}
                                <span style={{ color: '#475569', fontWeight: 600 }}> ({log.entity_type} #{log.entity_id})</span>
                              </p>
                              {details && (
                                <p style={{ margin: 0, fontSize: 12, color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, display: 'inline-block', border: '1px dashed #cbd5e1' }}>
                                  {details}
                                </p>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>{formatDate(log.created_at)}</p>
                              <p style={{ margin: 0, fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: '#94a3b8' }}>IP: {log.ip_address || 'Internal'}</p>
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
    </>
  );
}