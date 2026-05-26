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
      --shadow-accent: 0 8px 28px rgba(79,70,229,.22);
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
      50%     { opacity:.4; transform:scale(.65); }
    }
    @keyframes floatA {
      0%,100% { transform: translateY(0)   scale(1); }
      50%     { transform: translateY(-24px) scale(1.04); }
    }
    @keyframes floatB {
      0%,100% { transform: translateY(0)   scale(1); }
      50%     { transform: translateY(20px) scale(1.03); }
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
      position: absolute; left: 0; top: 20%;
      bottom: 20%;
      width: 3px; border-radius: 2px; background: var(--accent);
      opacity: 0; transition: opacity .18s;
    }
    .nav-item.active::after { opacity: 1; }

    .bar-col { transition: filter .2s; cursor: default; }
    .bar-col:hover .bar-inner { filter: brightness(1.1); }

    .progress-fill {
      animation: progressFill 1.1s cubic-bezier(.4,0,.2,1) both;
    }

    .btn-primary { transition: transform .15s, box-shadow .15s; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: var(--shadow-accent); }
    .btn-ghost { transition: background .15s, color .15s; }
    .btn-ghost:hover { background: var(--bg-2); }

    .modal-overlay { animation: overlayIn .25s ease both; }
    .modal-panel   { animation: modalIn .35s cubic-bezier(.34,1.56,.64,1) both; }
    .live-dot { animation: pulseDot 1.6s ease-in-out infinite; }

    .input-field { transition: border-color .18s, box-shadow .18s; }
    .input-field:focus {
      outline: none; border-color: var(--accent) !important;
      box-shadow: 0 0 0 3px rgba(79,70,229,.1);
    }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent-mid); }

    .badge {
      display: inline-flex;
      align-items: center; gap: 5px;
      padding: 3px 9px; border-radius: 6px; font-size: 10px; font-weight: 700;
      font-family: var(--font-mono); letter-spacing: .04em; text-transform: uppercase;
      border: 1px solid transparent;
    }

    .orb-a { animation: floatA 9s ease-in-out infinite; pointer-events: none; }
    .orb-b { animation: floatB 12s ease-in-out infinite; pointer-events: none; }

    .detail-grid-row { transition: background .14s; }
    .detail-grid-row:hover { background: #f8f7ff; }

    /* Activity Log Specific */
    .log-item { position: relative; padding-left: 20px; padding-bottom: 16px; }
    .log-item:last-child { padding-bottom: 0; }
    .log-item::before {
      content: ''; position: absolute; left: 4px; top: 20px; bottom: 0;
      width: 1.5px; background: var(--border-2); z-index: 1;
    }
    .log-item:last-child::before { display: none; }
    .log-dot {
      position: absolute; left: 0; top: 4px; width: 10px; height: 10px;
      border-radius: 50%; background: #fff; border: 2.5px solid var(--accent);
      z-index: 2;
    }
  `}</style>
);

/* ─────────────── Create Ticket Modal ─────────────── */
function CreateTicketModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(''); 
  const [priorityId, setPriorityId] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Replaced hardcoded arrays with dynamic state
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);

  // Fetch real data from PostgreSQL on load
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res = await api.get('/tickets/lookups');
        setCategories(res.data.categories);
        setPriorities(res.data.priorities);
        
        // Auto-select the first valid item in the lists
        if (res.data.categories.length > 0) setCategoryId(res.data.categories[0].id);
        if (res.data.priorities.length > 0) setPriorityId(res.data.priorities[0].id);
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    fetchLookups();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/tickets', {
        title,
        description,
        categoryid: parseInt(categoryId),
        priorityid: parseInt(priorityId)
      });
      
      onSuccess(response.data); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 500, boxShadow: '0 32px 80px rgba(15,23,42,0.2), 0 0 0 1px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        
        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #faf9ff 0%, #f0f4ff 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 800, color: 'var(--txt-primary)' }}>Log New Incident</h2>
          <button onClick={onClose} className="btn-ghost" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--txt-secondary)', cursor: 'pointer', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '12px', background: 'var(--rose-light)', color: 'var(--rose)', borderRadius: '8px', fontSize: 13, fontWeight: 600 }}>{error}</div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-secondary)', display: 'block', marginBottom: 6 }}>Incident Title <span style={{color: 'var(--rose)'}}>*</span></label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Briefly describe the issue..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-secondary)', display: 'block', marginBottom: 6 }}>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff' }}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-secondary)', display: 'block', marginBottom: 6 }}>Priority</label>
              <select value={priorityId} onChange={(e) => setPriorityId(e.target.value)} className="input-field" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff' }}>
                {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-secondary)', display: 'block', marginBottom: 6 }}>Detailed Description <span style={{color: 'var(--rose)'}}>*</span></label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Provide steps to reproduce, error codes, etc." rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: '#fff' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-accent)' }}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────── Ticket Detail Modal ─────────────── */
function TicketModal({ ticket, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!ticket) return null;

  // DB Lowercase fixes applied here
  const pId = Number(ticket.priorityid || ticket.PriorityId);
  const pName = pId === 4 ? 'Critical' : pId === 3 ? 'High' : pId === 2 ? 'Medium' : 'Low';
  
  const sId = Number(ticket.statusid || ticket.StatusId);
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

  // Fixed referenceno targeting
  const ticketNum  = ticket.referenceno || ticket.TicketNumber || `TKT-00${ticket.id}`;
  
  const rawCreatedAt = ticket.createdat || ticket.CreatedAt || ticket.created_at;
  const createdAt = rawCreatedAt 
    ? new Date(rawCreatedAt.replace(' ', 'T')).toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
    : 'Just now';

  const rawUpdatedAt = ticket.updatedat || ticket.UpdatedAt || ticket.updated_at;
  const updatedAt = rawUpdatedAt 
    ? new Date(rawUpdatedAt.replace(' ', 'T')).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
    : '—';

  // Update the category label to look for the new name first
  const categoryLabel = ticket.category_name || (ticket.categoryid ? `Category ${ticket.categoryid}` : 'Unclassified');

  // Update the fields to look for the new creator_name and agent_name
  const fields = [
    ['Ticket ID',     `#${ticket.id}`],
    ['Reference',     ticketNum],
    ['Category',      categoryLabel],
    ['Assigned To',   ticket.agent_name || ticket.assignedto || 'Unassigned'],
    ['Reporter',      ticket.creator_name || ticket.createdby || 'System'], // This fixes the '1' issue!
    ['Department',    ticket.department || 'IT Operations'],
    ['Created',       createdAt],
    ['Last Updated',  updatedAt],
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 600, boxShadow: '0 32px 80px rgba(15,23,42,0.2), 0 0 0 1px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #faf9ff 0%, #f0f4ff 100%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.08em', background: 'var(--accent-light)', border: '1px solid #c4b5fd', padding: '3px 10px', borderRadius: 6 }}>{ticketNum}</span>
              <span className="badge" style={{ background: pStyle.bg, borderColor: pStyle.border, color: pStyle.color }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: pStyle.dot, display: 'inline-block', flexShrink: 0 }}/>{pName}
              </span>
              <span className="badge" style={{ background: sStyle.bg, borderColor: sStyle.border, color: sStyle.color }}>{sName}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 800, color: 'var(--txt-primary)', lineHeight: 1.3 }}>{ticket.title || 'Untitled Incident'}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--txt-secondary)', cursor: 'pointer', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px' }}>
          {ticket.description && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 7 }}>Description</p>
              <p style={{ fontSize: 13, color: 'var(--txt-secondary)', lineHeight: 1.75, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '13px 15px' }}>{ticket.description}</p>
            </div>
          )}

          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {fields.map(([label, value], i) => (
              <div key={i} className="detail-grid-row" style={{ display: 'grid', gridTemplateColumns: '130px 1fr', borderBottom: i < fields.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? '#fff' : 'var(--surface-2)' }}>
                <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>{label}</div>
                <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--txt-primary)', display: 'flex', alignItems: 'center' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '9px 20px', borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--txt-secondary)' }}>Close</button>
          <button className="btn-primary" style={{ padding: '9px 22px', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', background: 'var(--accent)', border: 'none', color: '#fff', boxShadow: 'var(--shadow-accent)' }}>Manage Ticket →</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Dashboard ─────────────── */
export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stats, setStats] = useState({ openTickets: 0, inProgress: 0, resolvedToday: 0, activeAgents: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]); 
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
    setApiError(null);

    try {
      try {
        const statsRes = await api.get('/dashboard/stats');
        if (statsRes.data) setStats(statsRes.data);
      } catch (statsErr) {
        console.warn("Failed to load stats, continuing...", statsErr);
        setApiError("Stats partially unavailable.");
      }

      try {
        // ADD ?t=${Date.now()} to force fresh data!
        const tRes = await api.get(`/tickets/recent?t=${Date.now()}`);
        if (tRes.data && Array.isArray(tRes.data)) {
          setRecentTickets(tRes.data);
        } else if (tRes.data?.data && Array.isArray(tRes.data.data)) {
          setRecentTickets(tRes.data.data);
        } else {
          setRecentTickets([]);
        }
      } catch (ticketErr) {
        console.error("Tickets API Error:", ticketErr);
      }

      try {
        // ADD ?t=${Date.now()} to force fresh data!
        const logRes = await api.get(`/activity-logs?t=${Date.now()}`);
        if (logRes.data && Array.isArray(logRes.data.data)) {
          setRecentLogs(logRes.data.data.slice(0, 20)); // Increased to 20!
        } else if (Array.isArray(logRes.data)) {
          setRecentLogs(logRes.data.slice(0, 20)); // Increased to 20!
        } else {
          setRecentLogs([]);
        }
      } catch (logErr) {
        console.error("Logs API Error:", logErr);
      }

    } finally {
      setLoading(false);
    }
  };

  const safeTickets = recentTickets || [];
  const filteredTickets = safeTickets.filter(t =>
    !searchQuery ||
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.referenceno || t.TicketNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) 
  );

  const getCategories = () => {
    const total = safeTickets.length || 1;
    const counts = { 'Network Ops': 0, 'Hardware': 0, 'Access Control': 0, 'Software / OS': 0 };

    safeTickets.forEach(t => {
      const txt = (t.title || '').toLowerCase();
      let c = 'Software / OS';
      
      const catId = t.categoryid || t.CategoryId;
      if (catId === 1 || catId === 3 || txt.includes('email') || txt.includes('vpn') || txt.includes('printer')) c = 'Network Ops';
      else if (catId === 4 || txt.includes('password')) c = 'Access Control';
      else if (txt.includes('hardware') || txt.includes('disk') || txt.includes('memory')) c = 'Hardware';
      
      if (counts[c] !== undefined) counts[c]++;
    });

    const palette = [
      { bar: 'var(--accent)',   glow: 'rgba(79,70,229,.22)',  light: 'var(--accent-light)' },
      { bar: 'var(--sky)',      glow: 'rgba(14,165,233,.22)', light: 'var(--sky-light)' },
      { bar: 'var(--amber)',    glow: 'rgba(245,158,11,.22)', light: 'var(--amber-light)' },
      { bar: 'var(--emerald)',  glow: 'rgba(16,185,129,.22)', light: 'var(--emerald-light)' },
    ];

    return Object.entries(counts).map(([name, count], i) => ({
      name, count, percentage: Math.round((count / total) * 100), ...palette[i],
    }));
  };

  const getTimeline = () => {
    const p = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    safeTickets.forEach(t => {
      const id = Number(t.priorityid || t.PriorityId);
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

  const formatAction = (action) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

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
      
      {/* --- ADDED RENDER BLOCK HERE --- */}
      {isCreateModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={(data) => {
            setIsCreateModalOpen(false);
            fetchDashboardData(); 
          }} 
        />
      )}

      {selectedTicket && <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>

        {/* Soft ambient shapes */}
        <div className="orb-a" style={{ position: 'fixed', top: '-8%', right: '2%', width: 640, height: 640, background: 'radial-gradient(circle, rgba(79,70,229,.07) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />
        <div className="orb-b" style={{ position: 'fixed', bottom: '-10%', left: '5%', width: 560, height: 560, background: 'radial-gradient(circle, rgba(14,165,233,.06) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'fixed', top: '45%', left: '35%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(245,158,11,.04) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

        {/* ── Sidebar ── */}
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 252,
          background: '#fff', borderRight: '1px solid var(--border)',
          zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '4px 0 24px rgba(15,23,42,0.04)',
        }}>
          <div>
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(79,70,229,.3)' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '.04em' }}>IT</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-.3px' }}>CommandCenter</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--accent)', letterSpacing: '.14em', textTransform: 'uppercase', marginTop: 2 }}>Enterprise Ops</div>
                </div>
              </div>
            </div>

            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { emoji: '◧', label: 'Overview', active: true  },
                { emoji: '⊟', label: 'Incident Tickets', active: false },
                { emoji: '◎', label: 'Agent Roster', active: false },
                { emoji: '△', label: 'SLA Monitor', active: false },
                { emoji: '⊕', label: 'Analytics', active: false },
              ].map(({ emoji, label, active }, i) => (
                <a key={i} href="#" className={`nav-item${active ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 10px 18px', borderRadius: 10, textDecoration: 'none', background: active ? 'var(--accent-light)' : 'transparent', color: active ? 'var(--accent)' : 'var(--txt-secondary)', fontWeight: active ? 600 : 500, fontSize: 13, animation: `fadeSlideUp .4s ease ${i * .055}s both` }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
                  <span>{label}</span>
                  {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px rgba(79,70,229,.5)' }} />}
                </a>
              ))}
            </nav>

            <div style={{ margin: '8px 12px 0', padding: '14px 16px', background: 'var(--accent-light)', borderRadius: 12, border: '1px solid #c4b5fd' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Queue Summary</p>
              {[
                { label: 'Open', val: stats.openTickets || safeTickets.length, color: 'var(--accent)' },
                { label: 'In Progress', val: stats.inProgress || 0, color: 'var(--amber)' },
                { label: 'Resolved', val: stats.resolvedToday || 0, color: 'var(--emerald)' },
              ].map(({ label, val, color }, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 2 ? 7 : 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--txt-secondary)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--accent-light), #e0e7ff)', border: '1px solid #c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>
                  {user.name?.charAt(0) || 'A'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--txt-muted)', letterSpacing: '.07em' }}>Systems Lead</p>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-ghost" title="Logout" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 7px', color: 'var(--txt-muted)', borderRadius: 8, fontSize: 14 }}>⏻</button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ marginLeft: 252, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
          <header style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(244,246,251,.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '12px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 var(--border)', animation: 'fadeIn .4s ease' }}>
            <div style={{ position: 'relative', width: 380 }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-muted)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
              <input type="text" placeholder="Search tickets, references, incidents…" className="input-field" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1.5px solid var(--border)', borderRadius: 12, background: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--txt-primary)', boxShadow: 'var(--shadow-sm)' }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--emerald-light)', border: '1px solid #a7f3d0', borderRadius: 8, padding: '6px 12px' }}>
                <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'block' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#059669', letterSpacing: '.1em' }}>LIVE</span>
              </div>
              <button onClick={fetchDashboardData} className="btn-ghost" style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: 'var(--txt-secondary)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', boxShadow: 'var(--shadow-sm)' }}>↻ Refresh</button>
              <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>
                + New Ticket
              </button>
            </div>
          </header>

          <div style={{ padding: '28px 30px', flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto' }}>
            <div className="fade-up" style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-.5px', margin: '0 0 4px' }}>System Overview</h1>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--txt-secondary)' }}>Real-time analytics · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>

            {apiError && (
              <div style={{ marginBottom: 20, padding: '13px 18px', background: 'var(--rose-light)', border: '1px solid #fecdd3', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeSlideUp .3s ease' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12, color: '#be123c', fontWeight: 500 }}><strong>Alert:</strong> {apiError}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
              {[
                { title: 'Pipeline Total', value: safeTickets.length, icon: '⊟', grad: 'linear-gradient(135deg,#4f46e5,#7c73f0)', glow: 'rgba(79,70,229,.2)', d: '0s' },
                { title: 'In Evaluation', value: stats.inProgress || 0, icon: '⌛', grad: 'linear-gradient(135deg,#f59e0b,#fb923c)', glow: 'rgba(245,158,11,.2)', d: '.08s' },
                { title: 'Resolved Today', value: stats.resolvedToday || 0, icon: '✓', grad: 'linear-gradient(135deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,.2)', d: '.16s' },
                { title: 'Active Agents', value: stats.activeAgents || 0, icon: '◉', grad: 'linear-gradient(135deg,#0ea5e9,#6366f1)', glow: 'rgba(14,165,233,.2)', d: '.24s' },
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)', animationDelay: s.d }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.12em', margin: '0 0 8px' }}>{s.title}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 32, fontWeight: 800, color: 'var(--txt-primary)', margin: 0, lineHeight: 1, animation: `countUp .5s ease ${s.d} both` }}>{s.value}</p>
                  </div>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', boxShadow: `0 8px 22px ${s.glow}` }}>{s.icon}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 22 }}>
              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp .5s ease .2s both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Incident Severity Density</h3>
                    <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)' }}>Live priority distribution</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--txt-secondary)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 10px' }}>{safeTickets.length} total</span>
                </div>
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 16, paddingBottom: 8, borderBottom: '1.5px solid var(--border)' }}>
                  {timeline.map((d, i) => (
                    <div key={i} className="bar-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--txt-secondary)' }}>{d.volume}</span>
                      <div className="bar-inner" style={{ width: '100%', maxWidth: 52, height: `${d.h}%`, minHeight: d.volume > 0 ? 4 : 0, background: d.bar, borderRadius: '8px 8px 4px 4px', boxShadow: `0 4px 18px ${d.glow}`, transformOrigin: 'bottom', animation: 'barGrow .65s cubic-bezier(.34,1.56,.64,1) both', animationDelay: `${i * .08}s` }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 4 }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp .5s ease .28s both' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Category Allocation</h3>
                <p style={{ margin: '0 0 20px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)' }}>Distribution profile</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  {categories.map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-secondary)' }}>{c.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--txt-primary)' }}>{c.count} ({c.percentage}%)</span>
                      </div>
                      <div style={{ height: 7, background: 'var(--bg-2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ width: `${c.percentage}%`, height: '100%', background: c.bar, boxShadow: `0 2px 8px ${c.glow}`, borderRadius: 4, animationDelay: `${i * .08}s` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Bottom Grid (Table + Activity Log) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
              {/* Ticket Table Card */}
              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', animation: 'fadeSlideUp .5s ease .35s both' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Recent Pipeline Incidents</h3>
                    <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)' }}>Latest items ingested from the system</p>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-light)', padding: '4px 12px', borderRadius: 8, border: '1px solid #c4b5fd' }}>
                    Showing {filteredTickets.length} Rows
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafbfe' }}>
                        {['Incident Reference', 'Title', 'Priority', 'Status', 'Created At'].map((h, i) => (
                          <th key={i} style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--txt-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                            No incidents match the active filter pipeline criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map((ticket) => {
                          // DB Lowercase applied to table mapping
                          const tNum = ticket.referenceno || ticket.TicketNumber || `TKT-00${ticket.id}`;
                          const pName = Number(ticket.priorityid || ticket.PriorityId) === 4 ? 'Critical' : Number(ticket.priorityid || ticket.PriorityId) === 3 ? 'High' : Number(ticket.priorityid || ticket.PriorityId) === 2 ? 'Medium' : 'Low';
                          const sName = Number(ticket.statusid || ticket.StatusId) === 2 ? 'In Progress' : Number(ticket.statusid || ticket.StatusId) === 3 ? 'Resolved' : 'Open';
                          const ps = pStyle(pName);
                          const ss = sStyle(sName);

                          const rawCreatedAt = ticket.createdat || ticket.CreatedAt || ticket.created_at;
                          const displayDate = rawCreatedAt 
                            ? new Date(rawCreatedAt.replace(' ', 'T')).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                            : 'Just now';

                          return (
                            <tr key={ticket.id} className="ticket-row" onClick={() => setSelectedTicket(ticket)} style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
                              <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{tNum}</td>
                              <td style={{ padding: '14px 20px', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span className="t-title" style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)', transition: 'color .15s' }}>{ticket.title || 'Untitled Incident'}</span>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <span className="badge" style={{ background: ps.bg, borderColor: ps.bc, color: ps.color }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: ps.dot, display: 'inline-block', flexShrink: 0 }}/>{pName}
                                </span>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <span className="badge" style={{ background: ss.bg, borderColor: ss.bc, color: ss.color }}>{sName}</span>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--txt-muted)' }}>
                                  {displayDate}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Activity Log Card */}
              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp .5s ease .40s both' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 3px' }}>Activity Log</h3>
                <p style={{ margin: '0 0 20px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--txt-muted)' }}>Latest system events</p>
                
                {/* Scrollable Container */}
                {/* Scrollable Container */}
                <div style={{ marginTop: 15, maxHeight: 420, overflowY: 'auto', paddingRight: 10 }}>
                  {recentLogs.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--txt-muted)', textAlign: 'center', margin: '20px 0' }}>No recent activity.</p>
                  ) : (
                    recentLogs.map((log, index) => {
                      // ADDED 'Z' so React knows it is UTC and converts to your local time!
                      const rawLogDate = log.createdat || log.created_at;
                      const logDate = rawLogDate ? new Date(rawLogDate.replace(' ', 'T') + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';
                      
                      let logTitle = formatAction(log.action || 'system_event');
                      let logDetails = '';

                      // Extract helpful details from the JSON
                      try {
                        if (log.new_value || log.newvalue) {
                          const parsedNew = typeof (log.new_value || log.newvalue) === 'string' ? JSON.parse(log.new_value || log.newvalue) : (log.new_value || log.newvalue);
                          if (parsedNew.referenceno) logTitle = `Ticket ${parsedNew.referenceno} Created`;
                        }
                        if (log.old_value || log.oldvalue) {
                          const parsedOld = typeof (log.old_value || log.oldvalue) === 'string' ? JSON.parse(log.old_value || log.oldvalue) : (log.old_value || log.oldvalue);
                          if (parsedOld.email && log.action === 'login_failed') logDetails = `Attempt: ${parsedOld.email}`;
                        }
                      } catch (e) { /* ignore parse errors */ }
                      
                      return (
                        <div key={log.id || index} className="log-item">
                          <div className="log-dot" />
                          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: logTitle.includes('Failed') ? 'var(--rose)' : 'var(--txt-primary)' }}>
                            {logTitle}
                          </p>
                          {logDetails && (
                            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)' }}>{logDetails}</p>
                          )}
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