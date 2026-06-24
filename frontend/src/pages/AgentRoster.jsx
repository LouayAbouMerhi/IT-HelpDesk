import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import GlobalStyles from '../components/GlobalStyles';
import TicketModal from '../components/TicketModal';
import {
  Zap, LayoutDashboard, Ticket as TicketIcon, Users, History, LogOut, BarChart3,
  Search, UserPlus, X, AlertTriangle, CheckCircle2, Ban, Lock, Unlock,
  ChevronRight, Pencil, Trash2, UserX, Inbox,
} from 'lucide-react';

// --- Visual system: same embedded stylesheet/tokens used on Dashboard &
// Tickets, plus a few additions (modals, toast, switch) for this page. ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');

  .cc-wrap {
    --ink:#102a43; --ink-soft:#334e68; --muted:#627d98; --muted-dark:#9fb3c8;
    --cloud:#f3f9ff; --cloud-2:#e9f3fe; --surface:#ffffff; --border:#e1eefc; --border-2:#c5dcf6;
    --volt:#0284c7; --volt-2:#0ea5e9; --volt-3:#38bdf8; --volt-soft:#e0f2fe;
    --signal:#0891b2; --signal-soft:#cffafe;
    --ember:#d97706; --ember-soft:#fef3c7;
    --flare:#e11d48; --flare-soft:#ffe4e6;
    --pulse:#059669; --pulse-soft:#d1fae5;
    --violet:#7c3aed; --violet-soft:#f3e8ff;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  .cc-mono { font-family: 'JetBrains Mono', monospace; }
  .cc-display { font-family: 'Space Grotesk', sans-serif; }

  @keyframes cc-float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-24px) scale(1.05); } }
  @keyframes cc-float-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-16px,20px) scale(1.04); } }
  @keyframes cc-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes cc-pop { 0% { opacity:0; transform: translateY(16px) scale(.96); } 60% { opacity:1; transform: translateY(-3px) scale(1.01); } 100% { opacity:1; transform: translateY(0) scale(1); } }
  @keyframes cc-shine { 0% { transform: translateX(-130%) skewX(-18deg); } 100% { transform: translateX(280%) skewX(-18deg); } }
  @keyframes cc-icon-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @keyframes cc-modal-pop { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes cc-toast-pop { from { opacity: 0; transform: translate(-50%, -16px); } to { opacity: 1; transform: translate(-50%, 0); } }

  .cc-orb { position: fixed; border-radius: 50%; z-index: 0; animation: cc-float 16s ease-in-out infinite; pointer-events: none; filter: blur(8px); }

  .cc-nav-link { display: flex; align-items: center; gap: 11px; padding: 11px 14px; border-radius: 12px; text-decoration: none; color: var(--ink-soft); font-weight: 600; font-size: 13px; transition: background .16s, color .16s, transform .16s; }
  .cc-nav-link:hover { background: var(--cloud-2); color: var(--volt); transform: translateX(2px); }
  .cc-nav-link.active { background: linear-gradient(135deg, var(--volt) 0%, var(--volt-2) 100%); color: #fff; box-shadow: 0 10px 22px -6px rgba(2,132,199,.5); }

  .cc-icon-btn { background: #fff; border: 1.5px solid var(--border); cursor: pointer; color: var(--ink-soft); border-radius: 10px; padding: 8px; display: flex; transition: border-color .15s, color .15s, transform .15s; }
  .cc-icon-btn:hover { border-color: var(--flare); color: var(--flare); transform: translateY(-1px); }

  .cc-input { padding: 10px 14px 10px 38px; border: 1.5px solid var(--border); border-radius: 12px; background: #fff; font-size: 12.5px; color: var(--ink); outline: none; transition: border-color .15s, box-shadow .15s; }
  .cc-input:focus { border-color: var(--volt); box-shadow: 0 0 0 4px var(--volt-soft); }

  .cc-form-input, .cc-form-select { padding: 11px 14px; border-radius: 11px; border: 1.5px solid var(--border); font-size: 13px; color: var(--ink); background: #fff; outline: none; transition: border-color .15s, box-shadow .15s; width: 100%; box-sizing: border-box; }
  .cc-form-input:focus, .cc-form-select:focus { border-color: var(--volt); box-shadow: 0 0 0 4px var(--volt-soft); }
  .cc-form-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }

  .cc-btn-primary { background: linear-gradient(135deg, var(--volt) 0%, var(--volt-2) 100%); color: #fff; border: none; border-radius: 12px; cursor: pointer; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; gap: 7px; box-shadow: 0 12px 26px -8px rgba(2,132,199,.55); transition: transform .15s, box-shadow .15s; }
  .cc-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 32px -8px rgba(2,132,199,.65); }
  .cc-btn-primary:disabled { opacity: .65; cursor: not-allowed; transform: none; }

  .cc-btn-ghost { background: #fff; border: 1.5px solid var(--border); border-radius: 11px; cursor: pointer; color: var(--ink); font-size: 13px; font-weight: 600; padding: 11px 18px; transition: border-color .15s, transform .15s; }
  .cc-btn-ghost:hover { border-color: var(--volt); transform: translateY(-1px); }
  .cc-btn-ghost:disabled { opacity: .6; cursor: not-allowed; }

  .cc-btn-danger { background: var(--flare); color: #fff; border: none; border-radius: 11px; cursor: pointer; font-size: 13px; font-weight: 700; padding: 11px 18px; box-shadow: 0 8px 18px -6px rgba(225,29,72,.45); transition: filter .15s, transform .15s; }
  .cc-btn-danger:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .cc-btn-danger:disabled { opacity: .65; cursor: not-allowed; }

  .cc-btn-success { background: var(--pulse); color: #fff; border: none; border-radius: 11px; cursor: pointer; font-size: 13px; font-weight: 700; padding: 11px 18px; box-shadow: 0 8px 18px -6px rgba(5,150,105,.45); transition: filter .15s, transform .15s; }
  .cc-btn-success:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .cc-btn-success:disabled { opacity: .65; cursor: not-allowed; }

  .cc-btn-ember { background: var(--ember); color: #fff; border: none; border-radius: 11px; cursor: pointer; font-size: 13px; font-weight: 700; padding: 11px 18px; box-shadow: 0 8px 18px -6px rgba(217,119,6,.45); transition: filter .15s, transform .15s; }
  .cc-btn-ember:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .cc-btn-ember:disabled { opacity: .65; cursor: not-allowed; }

  .cc-action-btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: 10px; background: #fff; color: var(--ink); border: 1.5px solid var(--border); font-weight: 700; font-size: 11px; cursor: pointer; transition: border-color .15s, transform .15s, background .15s, color .15s; }
  .cc-action-btn:hover { border-color: var(--volt); color: var(--volt); background: var(--volt-soft); transform: translateY(-1px); }
  .cc-action-btn.danger { background: var(--flare-soft); color: var(--flare); border-color: transparent; }
  .cc-action-btn.danger:hover { border-color: var(--flare); background: var(--flare-soft); color: var(--flare); }
  .cc-action-btn.disabled-look { background: var(--cloud); color: var(--muted-dark); border-color: transparent; cursor: not-allowed; }
  .cc-action-btn.disabled-look:hover { transform: none; border-color: transparent; background: var(--cloud); color: var(--muted-dark); }
  .cc-action-btn.ember { background: var(--ember-soft); color: var(--ember); border-color: transparent; }
  .cc-action-btn.ember:hover { border-color: var(--ember); background: var(--ember-soft); color: var(--ember); }

  .cc-modal-backdrop { position: fixed; inset: 0; background: rgba(16,42,67,.45); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .cc-modal-panel { background: #fff; border-radius: 22px; box-shadow: 0 32px 80px -20px rgba(2,132,199,.45); animation: cc-modal-pop .26s cubic-bezier(.34,1.56,.64,1) both; }
  .cc-modal-close { background: #fff; border: 1.5px solid var(--border); cursor: pointer; color: var(--ink); width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: border-color .15s, color .15s; }
  .cc-modal-close:hover { border-color: var(--flare); color: var(--flare); }

  .cc-icon-circle { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }

  .cc-toast { animation: cc-toast-pop .25s ease both; }

  .cc-row { transition: background .14s, transform .14s; }

  .cc-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 800; white-space: nowrap; }

  .cc-switch { position: relative; width: 44px; height: 24px; border-radius: 20px; cursor: pointer; transition: background-color .25s; }
  .cc-switch-thumb { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform .25s; box-shadow: 0 1px 3px rgba(0,0,0,.25); }

  .cc-card { background: #fff; border: 1.5px solid var(--border); border-radius: 20px; box-shadow: 0 4px 20px -8px rgba(2,132,199,.14); }

  .cc-avatar { border-radius: 11px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; flex-shrink: 0; }

  .cc-stat { position: relative; overflow: hidden; background: #fff; border: 1.5px solid var(--border); border-radius: 18px; padding: 18px 20px; box-shadow: 0 2px 12px -4px rgba(2,132,199,.10); animation: cc-pop .55s cubic-bezier(.34,1.56,.64,1) both; transition: transform .22s, box-shadow .22s; }
  .cc-stat:hover { transform: translateY(-5px); box-shadow: 0 20px 38px -14px rgba(2,132,199,.32); }
  .cc-stat::after { content:''; position:absolute; top:0; left:0; width:40%; height:100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,.6), transparent); transform: translateX(-130%) skewX(-18deg); pointer-events:none; }
  .cc-stat:hover::after { animation: cc-shine .9s ease; }
  .cc-stat:hover .cc-stat-ico { animation: cc-icon-float 1.4s ease-in-out infinite; }
  .cc-stat:nth-child(1){ animation-delay:.04s; } .cc-stat:nth-child(2){ animation-delay:.12s; }
  .cc-stat:nth-child(3){ animation-delay:.20s; } .cc-stat:nth-child(4){ animation-delay:.28s; }

  .cc-fade-up { animation: cc-fade-up .55s ease both; }

  @media (max-width: 860px) {
    .cc-sidebar { display: none !important; }
    .cc-main { margin-left: 0 !important; }
  }
`;

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
      <style>{styles}</style>

      {toast.show && (
        <div className="cc-wrap cc-toast" style={{
          position: 'fixed', top: 40, left: '50%',
          background: toast.type === 'error' ? 'var(--flare-soft)' : 'var(--pulse-soft)',
          border: `1.5px solid ${toast.type === 'error' ? '#FFC2D2' : '#9FE8C9'}`,
          color: toast.type === 'error' ? 'var(--flare)' : 'var(--pulse)',
          padding: '14px 28px', borderRadius: '16px', zIndex: 10000,
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 16px 36px -8px rgba(21,18,58,.25)',
          fontWeight: 800, fontSize: '14px'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />} {toast.message}
        </div>
      )}
      
      {selectedTicket && (
        <div style={{ position: 'relative', zIndex: 2000 }}>
          <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onSuccess={() => { setSelectedTicket(null); if (viewingAgent) openAgentProfile(viewingAgent); }} />
        </div>
      )}

      {editingUser && (
        <div className="cc-wrap cc-modal-backdrop" onClick={() => setEditingUser(null)} style={{ position: 'fixed', zIndex: 1000 }}>
          <div className="cc-modal-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, padding: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="cc-display" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Edit Employee Profile</h2>
              <button onClick={() => setEditingUser(null)} className="cc-modal-close"><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="cc-form-label">Full Name</label>
                <input type="text" value={editForm.fullname} onChange={e => setEditForm({...editForm, fullname: e.target.value})} required className="cc-form-input" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="cc-form-label">Email Address</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required className="cc-form-input" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="cc-form-label">Access Role</label>
                <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="cc-form-select" style={{ cursor: 'pointer' }}>
                  <option value="Admin">Admin</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Agent">Agent</option>
                  <option value="User">User</option>
                </select>
              </div>

              {['User', 'Agent'].includes(editForm.role) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="cc-form-label">Assigned Supervisor</label>
                  <select 
                    value={editForm.supervisor_id} 
                    onChange={e => setEditForm({...editForm, supervisor_id: e.target.value})} 
                    className="cc-form-select"
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
                  <label className="cc-form-label">Managed Ticket Category</label>
                  <select 
                    value={editForm.managed_category_id} 
                    onChange={e => setEditForm({...editForm, managed_category_id: e.target.value})} 
                    className="cc-form-select"
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
                <label className="cc-form-label">Reset Password (Optional)</label>
                <input type="password" placeholder="Leave blank to keep current password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} minLength={6} className="cc-form-input" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setEditingUser(null)} className="cc-btn-ghost">Cancel</button>
                <button type="submit" disabled={loading} className="cc-btn-primary" style={{ padding: '10px 24px' }}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="cc-wrap cc-modal-backdrop" style={{ position: 'fixed', zIndex: 1100 }}>
          <div className="cc-modal-panel" style={{ width: '100%', maxWidth: 380, padding: 30, textAlign: 'center' }}>
            <div className="cc-icon-circle" style={{ background: 'var(--flare-soft)', color: 'var(--flare)' }}><AlertTriangle size={24} /></div>
            <h3 className="cc-display" style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Delete Employee?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Are you absolutely sure you want to permanently delete <strong style={{ color: 'var(--ink)' }}>{userToDelete.fullname}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setUserToDelete(null)} disabled={loading} className="cc-btn-ghost">Cancel</button>
              <button onClick={executeDelete} disabled={loading} className="cc-btn-danger">
                {loading ? 'Deleting...' : 'Yes, Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmToggleUser && (() => {
        const currentlyActive = isUserActive(confirmToggleUser);
        
        return (
          <div className="cc-wrap cc-modal-backdrop" style={{ position: 'fixed', zIndex: 1100 }}>
            <div className="cc-modal-panel" style={{ width: '100%', maxWidth: 380, padding: 30, textAlign: 'center' }}>
              
              <div className="cc-icon-circle" style={{ background: currentlyActive ? 'var(--flare-soft)' : 'var(--pulse-soft)', color: currentlyActive ? 'var(--flare)' : 'var(--pulse)' }}>
                {currentlyActive ? <Ban size={24} /> : <CheckCircle2 size={24} />}
              </div>
              
              <h3 className="cc-display" style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                {currentlyActive ? 'Deactivate Account?' : 'Reactivate Account?'}
              </h3>
              
              <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                Are you sure you want to {currentlyActive ? 'deactivate' : 'reactivate'} <strong style={{ color: 'var(--ink)' }}>{confirmToggleUser.fullname}</strong>?
              </p>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setConfirmToggleUser(null)} disabled={loading} className="cc-btn-ghost">Cancel</button>
                <button onClick={executeToggleActive} disabled={loading} className={currentlyActive ? 'cc-btn-danger' : 'cc-btn-success'}>
                  {loading ? 'Processing...' : (currentlyActive ? 'Yes, Deactivate' : 'Yes, Activate')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {unlockingUser && (
        <div className="cc-wrap cc-modal-backdrop" style={{ position: 'fixed', zIndex: 1100 }}>
          <div className="cc-modal-panel" style={{ width: '100%', maxWidth: 380, padding: 30, textAlign: 'center' }}>
            <div className="cc-icon-circle" style={{ background: 'var(--ember-soft)', color: 'var(--ember)' }}><Unlock size={24} /></div>
            <h3 className="cc-display" style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Unlock Account</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--ink)' }}>{unlockingUser.fullname}</strong> has been locked out. Please provide a new temporary password.
            </p>
            <form onSubmit={executeUnlock}>
              <input type="password" placeholder="Enter new password..." value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} required minLength={6} className="cc-form-input" style={{ marginBottom: 20, textAlign: 'center' }} />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button type="button" onClick={() => {setUnlockingUser(null); setUnlockPassword('');}} disabled={loading} className="cc-btn-ghost">Cancel</button>
                <button type="submit" disabled={loading} className="cc-btn-ember">
                  {loading ? 'Unlocking...' : 'Unlock Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingAgent && (
        <div className="cc-wrap cc-modal-backdrop" onClick={() => setViewingAgent(null)} style={{ position: 'fixed', zIndex: 1000 }}>
          <div className="cc-modal-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 650, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--cloud) 0%, var(--volt-soft) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, boxShadow: '0 8px 20px -6px rgba(2,132,199,.5)' }}>
                    {viewingAgent.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="cc-display" style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{viewingAgent.fullname}</h2>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{viewingAgent.email}</span>
                      <span className="cc-mono" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#fff', border: '1px solid var(--border)', color: 'var(--volt)' }}>{viewingAgent.role}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewingAgent(null)} className="cc-modal-close"><X size={16} /></button>
              </div>
            </div>
            <div style={{ padding: '24px 30px', overflowY: 'auto', flex: 1 }}>
              <h3 className="cc-display" style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Currently Assigned Incidents</h3>
              {loadingTickets ? (
                <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }} className="cc-mono">Loading assigned tickets...</p>
              ) : agentTickets.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--cloud)', borderRadius: 12, border: '1.5px dashed var(--border)' }}>
                  <Inbox size={20} style={{ color: 'var(--muted)', marginBottom: 8 }} />
                  <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 13, fontWeight: 600 }}>No tickets assigned right now.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {agentTickets.map(ticket => (
                    <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1.5px solid var(--border)', borderRadius: 14, background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.background = '#f3f9ff'; e.currentTarget.style.boxShadow = '0 8px 18px -8px rgba(2,132,199,.3)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e1eefc'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--volt-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><TicketIcon size={16} color="var(--volt)" strokeWidth={2.3} /></span>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{ticket.title || 'Untitled Incident'}</p>
                      </div>
                      <ChevronRight size={18} color="#0284c7" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="cc-wrap" style={{ display: 'flex', minHeight: '100vh', background: 'var(--cloud)', position: 'relative', overflow: 'hidden' }}>
        <div className="cc-orb" style={{ top: '-12%', right: '2%', width: 560, height: 560, background: 'radial-gradient(circle, rgba(14,165,233,.18) 0%, transparent 70%)' }} />
        <div className="cc-orb" style={{ bottom: '-14%', left: '6%', width: 520, height: 520, background: 'radial-gradient(circle, rgba(56,189,248,.16) 0%, transparent 70%)', animation: 'cc-float-b 18s ease-in-out infinite', animationDelay: '-6s' }} />

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
              {[
                { path: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
                { path: '/tickets', label: 'Incident Tickets', Icon: TicketIcon },
                { path: '/roster', label: 'Agent Roster', Icon: Users },
                { path: '/analytics', label: 'Analytics', Icon: BarChart3 },
                { path: '/activity-logs', label: 'System Audit Log', Icon: History },
              ].map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <a
                    key={link.path}
                    href={link.path}
                    onClick={(e) => { e.preventDefault(); navigate(link.path); }}
                    className={`cc-nav-link${isActive ? ' active' : ''}`}
                  >
                    <link.Icon size={17} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cloud)', borderRadius: 14, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                  {currentUser.name?.charAt(0) || 'A'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="cc-icon-btn" title="Logout" style={{ padding: 7 }}><LogOut size={15} /></button>
            </div>
          </div>
        </aside>

        <main className="cc-main" style={{ marginLeft: 252, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
          <header className="cc-header" style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(243,249,255,.82)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '12px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ position: 'relative', width: 340 }}>
                <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="cc-input" style={{ width: '100%' }} />
              </div>
            </div>
          </header>

          <div className="cc-fade-up" style={{ padding: '28px 30px', flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto' }}>

            {/* HERO BANNER */}
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: '30px 34px', marginBottom: 24, background: 'linear-gradient(120deg, #0284c7 0%, #0ea5e9 55%, #38bdf8 100%)', boxShadow: '0 22px 50px -18px rgba(2,132,199,.6)' }}>
              <div style={{ position: 'absolute', top: '-40%', right: '-4%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.22), transparent 70%)', animation: 'cc-float 12s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', bottom: '-60%', right: '22%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.16), transparent 70%)', animation: 'cc-float-b 15s ease-in-out infinite' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(6px)', padding: '5px 12px', borderRadius: 999, marginBottom: 12 }}>
                  <Users size={13} color="#fff" strokeWidth={2.4} />
                  <span className="cc-mono" style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '.16em', textTransform: 'uppercase' }}>Team Management</span>
                </div>
                <h1 className="cc-display" style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-.5px', margin: '0 0 6px' }}>Agent Roster</h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.9)', margin: 0, fontWeight: 500 }}>Provision, manage and monitor every member of your IT support organization.</p>
              </div>
            </div>

            {/* SUMMARY STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 18, marginBottom: 24 }}>
              {[
                { label: 'Total Employees', value: users.length, Icon: Users, grad: 'linear-gradient(135deg,#0ea5e9,#0284c7)', ink: '#0369a1' },
                { label: 'Agents', value: users.filter(u => u.role === 'Agent').length, Icon: UserPlus, grad: 'linear-gradient(135deg,#38bdf8,#0ea5e9)', ink: '#0369a1' },
                { label: 'Supervisors', value: users.filter(u => u.role === 'Supervisor').length, Icon: CheckCircle2, grad: 'linear-gradient(135deg,#34d399,#059669)', ink: '#047857' },
                { label: 'Locked Accounts', value: users.filter(u => isUserLocked(u)).length, Icon: Lock, grad: 'linear-gradient(135deg,#fbbf24,#d97706)', ink: '#b45309' },
              ].map((s) => (
                <div key={s.label} className="cc-stat">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <p className="cc-mono" style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{s.label}</p>
                      <p className="cc-display" style={{ margin: 0, fontSize: 32, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{s.value}</p>
                    </div>
                    <div className="cc-stat-ico" style={{ width: 46, height: 46, borderRadius: 14, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 10px 22px -8px ${s.ink}55` }}>
                      <s.Icon size={22} color="#fff" strokeWidth={2.3} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cc-card" style={{ padding: '24px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }} />
              <h3 className="cc-display" style={{ margin: '0 0 16px', fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--volt-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><UserPlus size={16} color="var(--volt)" strokeWidth={2.3} /></span>
                Provision New Employee
              </h3>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="cc-form-label">Full Name</label>
                    <input type="text" value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} required className="cc-form-input" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="cc-form-label">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="cc-form-input" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="cc-form-label">Password</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} className="cc-form-input" />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="cc-form-label">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value, supervisor_id: '', managed_category_id: ''})} className="cc-form-select" style={{ width: 'auto', minWidth: 220, cursor: 'pointer' }}>
                    <option value="Admin">Admin</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Agent">Agent</option>
                    <option value="User">User</option>
                  </select>
                </div>

                {['User', 'Agent'].includes(formData.role) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="cc-form-label">Assigned Supervisor</label>
                    <select 
                      value={formData.supervisor_id} 
                      onChange={e => setFormData({...formData, supervisor_id: e.target.value})} 
                      className="cc-form-select"
                      style={{ width: 'auto', minWidth: 220, cursor: 'pointer' }}
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
                    <label className="cc-form-label">Managed Ticket Category</label>
                    <select 
                      value={formData.managed_category_id} 
                      onChange={e => setFormData({...formData, managed_category_id: e.target.value})} 
                      className="cc-form-select"
                      style={{ width: 'auto', minWidth: 220, cursor: 'pointer' }}
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
                
                <button type="submit" disabled={loading} className="cc-btn-primary" style={{ padding: '11px 24px', alignSelf: 'flex-start' }}>
                  <UserPlus size={15} strokeWidth={2.4} /> Add User
                </button>
              </form>
            </div>

            <div className="cc-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(120deg, var(--cloud) 0%, var(--cloud-2) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px -6px rgba(2,132,199,.5)' }}>
                    <Users size={17} color="#fff" strokeWidth={2.3} />
                  </div>
                  <h3 className="cc-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Employee Directory</h3>
                </div>
                <div className="cc-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--volt)', background: 'var(--volt-soft)', padding: '5px 14px', borderRadius: 999, border: '1px solid var(--border-2)' }}>{filteredUsers.length} Members</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: '#fbfdff' }}>
                      <th className="cc-mono" style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Employee Name</th>
                      <th className="cc-mono" style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Email Address</th>
                      <th className="cc-mono" style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>System Status</th>
                      <th className="cc-mono" style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '44px', textAlign: 'center' }}>
                          <UserX size={22} style={{ color: 'var(--muted)', marginBottom: 8 }} />
                          <p className="cc-mono" style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>No employees found.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => {
                        
                        const active = isUserActive(u);
                        const locked = isUserLocked(u);
                        const hasTickets = u.active_tickets_count > 0;

                        return (
                          <tr
                            key={u.id}
                            onClick={() => openAgentProfile(u)}
                            className="cc-row"
                            style={{
                              borderBottom: '1px solid var(--border)',
                              opacity: active ? 1 : 0.55,
                              cursor: 'pointer'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '15px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                <div className="cc-avatar" style={{ width: 36, height: 36, fontSize: 14, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', boxShadow: '0 6px 14px -6px rgba(2,132,199,.5)' }}>
                                  {(u.fullname || '?').charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{u.fullname}</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--ink-soft)' }}>
                              {u.email}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="cc-badge" style={{ background: 'var(--volt-soft)', color: 'var(--volt)' }}>{u.role}</span>
                                {!active && <span className="cc-badge" style={{ background: 'var(--flare)', color: '#fff' }}><Ban size={11} /> Deactivated</span>}
                                {locked && <span className="cc-badge" style={{ background: 'var(--ember)', color: '#fff' }}><Lock size={11} /> Locked</span>}
                              </div>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                                
                                {locked && (
                                  <button onClick={(e) => { e.stopPropagation(); setUnlockingUser(u); }} className="cc-action-btn ember">
                                    <Unlock size={12} /> Unlock
                                  </button>
                                )}

                                <div 
                                  onClick={(e) => { e.stopPropagation(); setConfirmToggleUser(u); }}
                                  className="cc-switch"
                                  style={{ backgroundColor: active ? '#10b981' : '#c5dcf6' }}
                                >
                                  <div className="cc-switch-thumb" style={{ transform: active ? 'translateX(20px)' : 'translateX(0px)' }} />
                                </div>

                                <button onClick={(e) => { e.stopPropagation(); openEditModal(u); }} className="cc-action-btn">
                                  <Pencil size={12} /> Edit
                                </button>
                                
                                {/* --- THE FIX: Conditional Delete Button --- */}
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!hasTickets) setUserToDelete(u); 
                                  }} 
                                  title={hasTickets ? `Cannot delete: ${u.fullname} has ${u.active_tickets_count} active tickets.` : "Delete User"}
                                  className={`cc-action-btn ${hasTickets ? 'disabled-look' : 'danger'}`}
                                  style={{ cursor: hasTickets ? 'not-allowed' : 'pointer' }}
                                >
                                  <Trash2 size={12} /> Delete
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