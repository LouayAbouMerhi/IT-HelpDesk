import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import GlobalStyles from '../components/GlobalStyles';
import TicketModal from '../components/TicketModal';

export default function AgentRoster() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Updated Initial State with new fields
  const [formData, setFormData] = useState({ 
    fullname: '', email: '', password: '', role: 'Agent', supervisor_id: '', managed_category_id: '' 
  });

  // Modals State
  const [editingUser, setEditingUser] = useState(null);
  // Updated Edit Form with new fields
  const [editForm, setEditForm] = useState({ 
    fullname: '', email: '', password: '', role: 'Agent', supervisor_id: '', managed_category_id: '' 
  });
  const [userToDelete, setUserToDelete] = useState(null); 
  const [viewingAgent, setViewingAgent] = useState(null); 
  const [agentTickets, setAgentTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [unlockingUser, setUnlockingUser] = useState(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [confirmToggleUser, setConfirmToggleUser] = useState(null);

  // Toast System
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const navigate = useNavigate();
  const location = useLocation(); 
  const currentUser = JSON.parse(localStorage.getItem('user') || '{"name":"Admin User"}');

  useEffect(() => { 
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchUsers(); 
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      
      const mappedUsers = res.data.map(user => ({
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        roleid: user.roleid,
        supervisor_id: user.supervisor_id,
        managed_category_id: user.managed_category_id,
        is_active: user.is_active === 1 || user.is_active === true,
        is_locked: user.is_locked === 1 || user.is_locked === true,
        failed_attempts: user.failed_attempts || 0,
        // --- NEW: Map the ticket count ---
        active_tickets_count: user.active_tickets_count || 0 
      }));
      
      setUsers(mappedUsers);
    } catch (err) {
      console.error("Failed to fetch users", err);
      showToast("Failed to load users", "error");
    }
  };

  const availableSupervisors = users.filter(u => u.role === 'Supervisor' || u.role === 'Admin');

  // ==========================================
  // BULLETPROOF STATUS PARSERS
  // ==========================================
  const isUserActive = (user) => {
    const val = user.isactive ?? user.is_active;
    if (val === 0 || val === '0' || val === false || val === 'false' || val === null) return false;
    return true; 
  };

  const isUserLocked = (user) => {
    const val = user.is_locked ?? user.islocked;
    if (val === 1 || val === '1' || val === true || val === 'true') return true;
    return false;
  };

  // ==========================================
  // API ACTIONS & MODAL HANDLERS
  // ==========================================
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({ 
      fullname: user.fullname || user.name || '', 
      email: user.email || '', 
      password: '', 
      role: user.role || 'Agent',
      supervisor_id: user.supervisor_id || '',
      managed_category_id: user.managed_category_id || ''
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/users', formData);
      
      setFormData({ 
        fullname: '', 
        email: '', 
        password: '', 
        role: 'Agent', 
        supervisor_id: '', 
        managed_category_id: '' 
      });
      
      await fetchUsers();
      showToast("Employee provisioned successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create user";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally { 
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); 
    try {
      const payload = { 
        name: editForm.fullname, 
        fullname: editForm.fullname, 
        email: editForm.email, 
        role: editForm.role,
        supervisor_id: editForm.supervisor_id,
        managed_category_id: editForm.managed_category_id
      };
      
      if (editForm.password && editForm.password.trim() !== '') {
        payload.password = editForm.password;
      }
      
      await api.put(`/users/${editingUser.id}`, payload);
      setEditingUser(null);
      fetchUsers(); 
      showToast("Employee profile updated successfully!");
    } catch (err) { 
      showToast(err.response?.data?.message || "Failed to update user.", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const executeDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUserToDelete(null);
      fetchUsers();
      showToast("Employee deleted permanently.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user.", "error");
    } finally {
      setLoading(false);
    }
  };

  const executeUnlock = async (e) => {
    e.preventDefault();
    if (!unlockPassword || unlockPassword.length < 6) return showToast("Password must be at least 6 characters.", "error");
    setLoading(true);
    try {
      await api.post(`/users/${unlockingUser.id}/unlock`, { new_password: unlockPassword });
      setUnlockingUser(null);
      setUnlockPassword('');
      fetchUsers();
      showToast("Account unlocked successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unlock account.", "error");
    } finally {
      setLoading(false);
    }
  };

  const executeToggleActive = async () => {
    if (!confirmToggleUser) return;
    setLoading(true);
    try {
      const res = await api.put(`/users/${confirmToggleUser.id}/toggle-active`);
      setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === confirmToggleUser.id) {
          return { ...u, isactive: res.data.new_status, is_active: res.data.new_status };
        }
        return u;
      }));
      setConfirmToggleUser(null);
      showToast(res.data.message || "Status updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change user status.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAgentProfile = async (agent) => {
    setViewingAgent(agent);
    setLoadingTickets(true);
    try {
      const res = await api.get(`/users/${agent.id}/tickets`);
      setAgentTickets(res.data || []);
    } catch (err) {
      setAgentTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return ((u.fullname || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q));
  });

  return (
    <>
      <GlobalStyles />

      {toast.show && (
        <div style={{
          position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1.5px solid ${toast.type === 'error' ? '#fecdd3' : '#bbf7d0'}`,
          color: toast.type === 'error' ? '#e11d48' : '#059669',
          padding: '14px 28px', borderRadius: '16px', zIndex: 10000,
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 12px 30px -8px rgba(0,0,0,0.15)',
          fontWeight: 800, fontSize: '14px', fontFamily: 'var(--font-body, sans-serif)'
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
        </div>
      )}
      
      {selectedTicket && (
        <div style={{ position: 'relative', zIndex: 2000 }}>
          <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onSuccess={() => { setSelectedTicket(null); if (viewingAgent) openAgentProfile(viewingAgent); }} />
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, padding: 30, boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Edit Employee Profile</h2>
              <button onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', color: '#0f172a' }}>✕</button>
            </div>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Full Name</label>
                <input type="text" value={editForm.fullname} onChange={e => setEditForm({...editForm, fullname: e.target.value})} required style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Email Address</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Access Role</label>
                <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                  <option value="Admin">Admin</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Agent">Agent</option>
                  <option value="User">User</option>
                </select>
              </div>

              {['User', 'Agent'].includes(editForm.role) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Supervisor</label>
                  <select 
                    value={editForm.supervisor_id} 
                    onChange={e => setEditForm({...editForm, supervisor_id: e.target.value})} 
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', color: '#0f172a' }}
                  >
                    <option value="">-- No Supervisor --</option>
                    {availableSupervisors.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.fullname}</option>
                    ))}
                  </select>
                </div>
              )}

              {editForm.role === 'Supervisor' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Managed Ticket Category</label>
                  <select 
                    value={editForm.managed_category_id} 
                    onChange={e => setEditForm({...editForm, managed_category_id: e.target.value})} 
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', color: '#0f172a' }}
                  >
                    <option value="">-- Select Category --</option>
                    <option value="1">Hardware</option>
                    <option value="2">Software</option>
                    <option value="3">Network</option>
                    <option value="4">Access Control</option>
                    <option value="5">Email</option>
                    <option value="6">Other</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Reset Password (Optional)</label>
                <input type="password" placeholder="Leave blank to keep current password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} minLength={6} style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '10px 20px', borderRadius: 8, background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 20, padding: '30px', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Delete Employee?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              Are you absolutely sure you want to permanently delete <strong style={{ color: '#0f172a' }}>{userToDelete.fullname}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setUserToDelete(null)} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a' }}>Cancel</button>
              <button onClick={executeDelete} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', background: '#e11d48', border: 'none', color: '#fff', boxShadow: '0 4px 14px rgba(225,29,72,0.3)' }}>
                {loading ? 'Deleting...' : 'Yes, Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmToggleUser && (() => {
        const currentlyActive = isUserActive(confirmToggleUser);
        
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 20, padding: '30px', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
              
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: currentlyActive ? '#fee2e2' : '#dcfce3', color: currentlyActive ? '#dc2626' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>
                {currentlyActive ? '🚫' : '✅'}
              </div>
              
              <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                {currentlyActive ? 'Deactivate Account?' : 'Reactivate Account?'}
              </h3>
              
              <p style={{ margin: '0 0 24px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                Are you sure you want to {currentlyActive ? 'deactivate' : 'reactivate'} <strong style={{ color: '#0f172a' }}>{confirmToggleUser.fullname}</strong>?
              </p>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setConfirmToggleUser(null)} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a' }}>Cancel</button>
                <button onClick={executeToggleActive} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', background: currentlyActive ? '#dc2626' : '#059669', border: 'none', color: '#fff', boxShadow: currentlyActive ? '0 4px 14px rgba(220,38,38,0.3)' : '0 4px 14px rgba(5,150,105,0.3)' }}>
                  {loading ? 'Processing...' : (currentlyActive ? 'Yes, Deactivate' : 'Yes, Activate')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {unlockingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 20, padding: '30px', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>🔓</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Unlock Account</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <strong style={{ color: '#0f172a' }}>{unlockingUser.fullname}</strong> has been locked out. Please provide a new temporary password.
            </p>
            <form onSubmit={executeUnlock}>
              <input type="password" placeholder="Enter new password..." value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} required minLength={6} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14, color: '#0f172a', marginBottom: 20, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button type="button" onClick={() => {setUnlockingUser(null); setUnlockPassword('');}} disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', background: '#d97706', border: 'none', color: '#fff', boxShadow: '0 4px 14px rgba(217,119,6,0.3)' }}>
                  {loading ? 'Unlocking...' : 'Unlock Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingAgent && (
        <div className="modal-overlay" onClick={() => setViewingAgent(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 650, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(15,23,42,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 30px', borderBottom: '1px solid #cbd5e1', background: 'linear-gradient(135deg, #faf9ff 0%, #f0f4ff 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
                    {viewingAgent.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{viewingAgent.fullname}</h2>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#475569' }}>{viewingAgent.email}</span>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', background: '#fff', border: '1px solid #cbd5e1', color: 'var(--accent)' }}>{viewingAgent.role}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewingAgent(null)} style={{ background: '#fff', border: '1px solid #cbd5e1', fontSize: 16, cursor: 'pointer', color: '#0f172a', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>
            <div style={{ padding: '24px 30px', overflowY: 'auto', flex: 1 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Currently Assigned Incidents</h3>
              {loadingTickets ? (
                <p style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 13 }}>Loading assigned tickets...</p>
              ) : agentTickets.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                  <p style={{ margin: 0, color: '#475569', fontSize: 13, fontWeight: 600 }}>No tickets assigned right now.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {agentTickets.map(ticket => (
                    <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #cbd5e1', borderRadius: 12, background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{ticket.title || 'Untitled Incident'}</p>
                      </div>
                      <span style={{ color: 'var(--accent)', fontSize: 18 }}>→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
        
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
              {[
                { path: '/dashboard', label: 'Overview', emoji: '◧' },
                { path: '/tickets', label: 'Incident Tickets', emoji: '⊟' },
                { path: '/roster', label: 'Agent Roster', emoji: '◎' },
                { path: '/activity-logs', label: 'System Audit Log', emoji: '⏱' },
              ].map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <a 
                    key={link.path}
                    href={link.path} 
                    onClick={(e) => { e.preventDefault(); navigate(link.path); }} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', background: isActive ? 'var(--accent-light, #e0e7ff)' : 'transparent', color: isActive ? 'var(--accent, #4f46e5)' : '#475569', fontWeight: isActive ? 700 : 500, fontSize: 13, transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{link.emoji}</span>
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          <div style={{ padding: '14px 12px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 12, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--accent-light, #e0e7ff), #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent, #4f46e5)' }}>
                  {currentUser.name?.charAt(0) || 'A'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p>
                </div>
              </div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 7px', color: '#94a3b8', borderRadius: 8, fontSize: 14 }}>⏻</button>
            </div>
          </div>
        </aside>

        <main style={{ marginLeft: 252, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
          <header style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0', padding: '12px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <input type="text" placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: 340, padding: '9px 14px', border: '1.5px solid #cbd5e1', borderRadius: 10, background: '#fff', color: '#0f172a', fontSize: 12, outline: 'none' }} />
            </div>
          </header>

          <div style={{ padding: '28px 30px', flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto' }}>
            
            <div style={{ background: '#fff', padding: '24px 28px', borderRadius: 18, border: '1.5px solid #e2e8f0', marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Provision New Employee</h3>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Full Name</label>
                    <input type="text" value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} required style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', color: '#0f172a' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', color: '#0f172a' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Password</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', color: '#0f172a' }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value, supervisor_id: '', managed_category_id: ''})} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', color: '#0f172a' }}>
                    <option value="Admin">Admin</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Agent">Agent</option>
                    <option value="User">User</option>
                  </select>
                </div>

                {['User', 'Agent'].includes(formData.role) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Supervisor</label>
                    <select 
                      value={formData.supervisor_id} 
                      onChange={e => setFormData({...formData, supervisor_id: e.target.value})} 
                      style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', color: '#0f172a' }}
                    >
                      <option value="">-- No Supervisor --</option>
                      {availableSupervisors.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.fullname}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.role === 'Supervisor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Managed Ticket Category</label>
                    <select 
                      value={formData.managed_category_id} 
                      onChange={e => setFormData({...formData, managed_category_id: e.target.value})} 
                      style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', color: '#0f172a' }}
                    >
                      <option value="">-- Select Category --</option>
                      <option value="1">Hardware</option>
                      <option value="2">Software</option>
                      <option value="3">Network</option>
                      <option value="4">Access Control</option>
                      <option value="5">Email</option>
                      <option value="6">Other</option>
                    </select>
                  </div>
                )}
                
                <button type="submit" disabled={loading} style={{ padding: '11px 24px', borderRadius: 10, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>+ Add User</button>
              </form>
            </div>

            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Employee Name</th>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Email Address</th>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>System Status</th>
                      <th style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No employees found.</td></tr>
                    ) : (
                      filteredUsers.map(u => {
                        
                        const active = isUserActive(u);
                        const locked = isUserLocked(u);
                        const hasTickets = u.active_tickets_count > 0;

                        return (
                          <tr 
                            key={u.id} 
                            onClick={() => openAgentProfile(u)}
                            style={{ 
                              borderBottom: '1px solid #e2e8f0', 
                              opacity: active ? 1 : 0.65,
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              {u.fullname}
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569' }}>
                              {u.email}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>{u.role}</span>
                                {!active && <span style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>Deactivated 🚫</span>}
                                {locked && <span style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#d97706' }}>Locked 🔒</span>}
                              </div>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                                
                                {locked && (
                                  <button onClick={(e) => { e.stopPropagation(); setUnlockingUser(u); }} style={{ padding: '7px 14px', borderRadius: 8, background: '#fef3c7', color: '#d97706', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Unlock</button>
                                )}

                                <div 
                                  onClick={(e) => { e.stopPropagation(); setConfirmToggleUser(u); }}
                                  style={{
                                    position: 'relative', width: 44, height: 24, 
                                    backgroundColor: active ? '#10b981' : '#cbd5e1', 
                                    borderRadius: 20, cursor: 'pointer', transition: 'background-color 0.3s'
                                  }}
                                >
                                  <div style={{
                                    position: 'absolute', top: 2, left: 2, width: 20, height: 20,
                                    backgroundColor: 'white', borderRadius: '50%',
                                    transition: 'transform 0.3s',
                                    transform: active ? 'translateX(20px)' : 'translateX(0px)'
                                  }} />
                                </div>

                                <button onClick={(e) => { e.stopPropagation(); openEditModal(u); }} style={{ padding: '7px 14px', borderRadius: 8, background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Edit</button>
                                
                                {/* --- THE FIX: Conditional Delete Button --- */}
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!hasTickets) setUserToDelete(u); 
                                  }} 
                                  title={hasTickets ? `Cannot delete: ${u.fullname} has ${u.active_tickets_count} active tickets.` : "Delete User"}
                                  style={{ 
                                    padding: '7px 14px', borderRadius: 8, 
                                    background: hasTickets ? '#f1f5f9' : '#fee2e2', 
                                    color: hasTickets ? '#94a3b8' : '#dc2626', 
                                    border: 'none', fontWeight: 700, fontSize: 11, 
                                    cursor: hasTickets ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  Delete
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