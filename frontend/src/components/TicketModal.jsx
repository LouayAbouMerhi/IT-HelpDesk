import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';

// --- THE FIX: Safe UTC Date Parser ---
const parseUtcDate = (dateString) => {
  if (!dateString) return new Date();
  const isoString = dateString.replace(' ', 'T') + (dateString.includes('Z') ? '' : 'Z');
  return new Date(isoString);
};

export default function TicketModal({ ticket, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('details');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [localTicket, setLocalTicket] = useState(ticket);

  const [isLoggingTime, setIsLoggingTime] = useState(false);
  const [timeInput, setTimeInput] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: ticket.title || '',
    description: ticket.description || '',
    categoryid: ticket.categoryid || 1,
    priorityid: ticket.priorityid || 1,
    statusid: ticket.statusid || 1,
  });

  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(ticket.agentid || ticket.assignedto || ticket.agent_id || '');
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentFiles, setCommentFiles] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = Number(currentUser.id);

  // =========================================================================
  // --- ROLE CHECKS ---
  // =========================================================================
  const isStandardUser = ['User', 'user', 'employee'].includes(currentUser.role) || String(currentUser.roleid) === '3';
  const isAgent = ['Agent', 'agent'].includes(currentUser.role) || String(currentUser.roleid) === '2';
  
  const isSuperAdmin = ['Admin', 'admin'].includes(currentUser.role) || String(currentUser.roleid) === '1';
  const isSupervisor = ['Supervisor', 'supervisor'].includes(currentUser.role) || String(currentUser.roleid) === '4';
  
  const isManager = isSuperAdmin || isSupervisor;
  const isCreator = Number(localTicket.createdby) === currentUserId || Number(localTicket.userid) === currentUserId;

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => { setLocalTicket(ticket); }, [ticket]);

  useEffect(() => {
    if (activeTab === 'workflow') {
      if (isManager) fetchAgents(); 
      fetchComments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'history') {
      if (isManager) fetchAgents();
      fetchTicketHistory();
    }
  }, [activeTab]);

  const fetchAgents = async () => {
    try {
      const endpoint = isSupervisor ? '/supervisor/agents' : '/agents';
      const res = await api.get(endpoint);
      let fetchedAgents = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAgents(fetchedAgents);
    } catch (err) {
      console.error("DEBUG AGENT ERROR:", err.response ? err.response.data : err);
      setAgents([]);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/tickets/${ticket.id}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchTicketHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/tickets/${ticket.id}/history`);
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- REACT DROPZONE FOR COMMENTS ---
  const onDrop = useCallback(acceptedFiles => {
    setCommentFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif'], 'application/pdf': ['.pdf'] },
    maxSize: 5242880 // 5MB limit
  });

  const removeCommentFile = (indexToRemove) => {
    setCommentFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const parseTimeToMinutes = (timeStr) => {
    let totalMinutes = 0;
    const regex = /(\d+(?:\.\d+)?)\s*(h|m)/gi;
    let match;
    let found = false;
    
    while ((match = regex.exec(timeStr)) !== null) {
      found = true;
      const val = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'h') totalMinutes += val * 60;
      if (unit === 'm') totalMinutes += val;
    }
    
    if (!found && !isNaN(parseFloat(timeStr))) {
      totalMinutes = parseFloat(timeStr) * 60;
    }
    return totalMinutes;
  };

  const formatMinutes = (totalMinutes) => {
    if (totalMinutes === 0) return '0m';
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const timeSummary = useMemo(() => {
    const summary = {};
    let total = 0;
    
    comments.forEach(c => {
      if (c.isinternal && c.content && c.content.includes('⏱️ Time Logged:')) {
        const timeStr = c.content.replace('⏱️ Time Logged:', '').trim();
        const mins = parseTimeToMinutes(timeStr);
        if (mins > 0) {
          summary[c.author_name] = (summary[c.author_name] || 0) + mins;
          total += mins;
        }
      }
    });
    
    return { breakdown: summary, total };
  }, [comments]);

  const handleStatusChange = async (newStatusId) => {
    setIsUpdating(true);
    try {
      await api.put(`/tickets/${ticket.id}`, { statusid: newStatusId });
      showToast(`Ticket marked as ${newStatusId === 3 ? 'Resolved' : 'Closed'}!`);
      setLocalTicket({ ...localTicket, statusid: newStatusId });
      if (onSuccess) onSuccess(); 
    } catch (err) {
      showToast("Failed to update status.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const submitTimeLog = async () => {
    if (!timeInput.trim()) return;
    setIsUpdating(true);
    try {
      const payload = new FormData();
      payload.append('content', `⏱️ Time Logged: ${timeInput}`);
      payload.append('isinternal', '1'); 
      
      await api.post(`/tickets/${ticket.id}/comments`, payload);
      
      setIsLoggingTime(false);
      setTimeInput('');
      showToast("Time logged successfully!");
      fetchComments(); 
    } catch (err) {
      showToast("Failed to log time.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async () => {
    setIsUpdating(true);
    try {
      await api.put(`/tickets/${ticket.id}`, { agentid: selectedAgent });
      showToast("Ticket assigned successfully!");
      onSuccess();
    } catch (err) {
      showToast("Failed to assign ticket.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const executeEscalate = async () => {
    setIsUpdating(true);
    try {
      await api.post(`/tickets/${ticket.id}/escalate`);
      setShowEscalateConfirm(false);
      showToast("Ticket escalated to CRITICAL!");
      onSuccess();
    } catch (err) {
      showToast("Failed to escalate ticket.", "error");
      setShowEscalateConfirm(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() && commentFiles.length === 0) return;
    setIsUpdating(true);
    
    try {
      const payload = new FormData();
      
      let messageText = newComment.trim();
      if (commentFiles.length > 0) {
        const fileList = Array.from(commentFiles).map(f => `[ATTACHMENT] ${f.name}`).join('\n');
        messageText = messageText ? `${messageText}\n\n${fileList}` : fileList;
      }

      payload.append('content', messageText);
      payload.append('isinternal', isInternal ? '1' : '0');
      
      if (commentFiles.length > 0) {
        Array.from(commentFiles).forEach(file => {
          payload.append('attachments[]', file);
        });
      }

      await api.post(`/tickets/${ticket.id}/comments`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setNewComment('');
      setIsInternal(false);
      setCommentFiles([]); 

      showToast("Reply sent successfully!");
      
      try {
        const tRes = await api.get(`/tickets/${ticket.id}`);
        setLocalTicket(tRes.data.data || tRes.data);
      } catch (e) { console.error("Failed to refresh ticket data", e); }
      
      fetchComments();
    } catch (err) {
      showToast("Failed to post comment. Check server logs.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const executeCancel = async () => {
    setIsCancelling(true);
    try {
      await api.delete(`/tickets/${ticket.id}`);
      setShowCancelConfirm(false);
      showToast("Ticket cancelled successfully!");
      onSuccess(); 
    } catch (err) {
      showToast("Failed to cancel ticket.", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSaveEdit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const form = document.getElementById('edit-form');
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setIsUpdating(true);
    try {
      await api.put(`/tickets/${ticket.id}`, editForm);
      setIsEditing(false);
      showToast("Ticket details updated!");
      onSuccess(); 
    } catch (err) {
      showToast("Failed to save changes.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const tNum = localTicket.referenceno || localTicket.TicketNumber || `TKT-00${localTicket.id}`;
  const reporterName = localTicket.reporter_name || localTicket.creator_name || 'System User';
  
  let assignedName = localTicket.agent_name || localTicket.assigned_to_name || localTicket.AssignedToName || localTicket.assigned_user?.fullname || localTicket.assigned_user?.name || localTicket.agent?.fullname || 'Unassigned';
  if (assignedName === 'Unassigned' && Number(localTicket.assignedto) === currentUserId) {
    assignedName = currentUser.name;
  }
  const isAssigned = assignedName !== 'Unassigned';

  const pId = Number(localTicket.priorityid || localTicket.PriorityId) || 1;
  const pName = pId === 4 ? 'CRITICAL' : pId === 3 ? 'HIGH' : pId === 2 ? 'MEDIUM' : 'LOW';
  
  const sId = Number(localTicket.statusid || localTicket.StatusId) || 1;
  const sName = sId === 2 ? 'IN PROGRESS' : sId === 3 ? 'RESOLVED' : sId === 4 ? 'CLOSED' : sId === 5 ? 'PENDING' : 'OPEN';

  const pStyle = (id) => ({
    4: { bg: '#fff1f2', color: '#e11d48', dot: '#f43f5e' },
    3: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
    2: { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
    1: { bg: '#f0fdf4', color: '#059669', dot: '#10b981' },
  }[id] || { bg: '#f0fdf4', color: '#059669', dot: '#10b981' });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return parseUtcDate(dateStr).toLocaleString(undefined, { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const ps = pStyle(pId);

  const renderCommentContent = (text, isMe) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('[ATTACHMENT] ')) {
        const fileName = line.replace('[ATTACHMENT] ', '');
        const foundAtt = localTicket.attachments?.find(a => a.filename === fileName);
        const fileUrl = foundAtt ? `http://localhost:8000/storage/${foundAtt.filepath}` : '#';
        return (
          <a key={i} href={fileUrl} target={foundAtt ? "_blank" : "_self"} rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, background: isMe ? 'rgba(255,255,255,0.15)' : '#f8fafc', padding: '8px 12px', borderRadius: 8, marginTop: 6, marginBottom: 6, fontSize: 13, border: `1px solid ${isMe ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}`, color: isMe ? '#ffffff' : '#0f172a', textDecoration: 'none', cursor: foundAtt ? 'pointer' : 'default', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 16 }}>📎</span> <span style={{ fontWeight: 700 }}>{fileName}</span>
          </a>
        );
      }
      const parts = line.split(/(@\w+)/g);
      const formattedLine = parts.map((part, wIdx) => {
        if (part.startsWith('@') && part.length > 1) {
          return (
            <strong key={wIdx} style={{ color: isMe ? '#fde047' : 'var(--accent, #4f46e5)', background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(79,70,229,0.1)', padding: '2px 6px', borderRadius: 6, margin: '0 2px' }}>{part}</strong>
          );
        }
        return part;
      });
      return <div key={i} style={{ minHeight: '1em', wordBreak: 'break-word', lineHeight: 1.5 }}>{formattedLine}</div>;
    });
  };

  const visibleComments = comments.filter(c => {
    if (isStandardUser && c.isinternal) return false;
    return true;
  });

  return (
    <>
      {toast.show && (
        <div style={{ position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1.5px solid ${toast.type === 'error' ? '#fecdd3' : '#bbf7d0'}`, color: toast.type === 'error' ? '#e11d48' : '#059669', padding: '14px 28px', borderRadius: '16px', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 12px 30px -8px rgba(0,0,0,0.15)', fontWeight: 800, fontSize: '14px', fontFamily: 'var(--font-body, sans-serif)' }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
        </div>
      )}

      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 10 }}>
          
          <div className="modal-panel" style={{ position: 'relative', background: '#f8fafc', borderRadius: 20, width: '100%', maxWidth: isEditing ? 500 : 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', transition: 'max-width 0.3s ease' }}>
          
          <div style={{ padding: '24px 30px', background: '#fff', borderBottom: '1px solid var(--border, #e2e8f0)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', padding: '6px 12px', borderRadius: 8, fontFamily: 'var(--font-mono, monospace)', fontSize: 13, fontWeight: 700, letterSpacing: '.05em' }}>
                  {tNum}
                </div>
                {!isEditing && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: ps.bg, color: ps.color, padding: '6px 12px', borderRadius: 8, fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 800 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: ps.dot }} /> {pName}
                    </div>
                    <div className="hide-on-mobile" style={{ border: '1px solid var(--border, #e2e8f0)', background: '#fff', color: '#475569', padding: '6px 12px', borderRadius: 8, fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 800 }}>
                      {sName}
                    </div>
                  </>
                )}
              </div>
              <button type="button" onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>✕</button>
            </div>
            
            {isEditing ? (
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--accent, #4f46e5)' }}>Edit Ticket Details</h2>
            ) : (
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{localTicket.title || 'Untitled Incident'}</h2>
            )}
          </div>

          {isEditing ? (
            <form id="edit-form" onSubmit={handleSaveEdit} style={{ padding: '30px', overflowY: 'auto', flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Incident Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} required style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14, outline: 'none', color: '#0f172a', backgroundColor: '#ffffff', fontWeight: 600 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Detailed Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} required style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14, outline: 'none', minHeight: 120, resize: 'vertical', color: '#0f172a', backgroundColor: '#ffffff', fontWeight: 500 }} />
              </div>
              
              {!isStandardUser && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Category</label>
                    <select value={editForm.categoryid} onChange={e => setEditForm({...editForm, categoryid: e.target.value})} style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14, outline: 'none', cursor: 'pointer', color: '#0f172a', backgroundColor: '#ffffff', fontWeight: 600 }}>
                      <option value="1">Hardware</option><option value="2">Software</option><option value="3">Network</option><option value="4">Access Control</option><option value="5">Email</option><option value="6">Other</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Priority Level</label>
                    <select value={editForm.priorityid} onChange={e => setEditForm({...editForm, priorityid: e.target.value})} style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14, outline: 'none', cursor: 'pointer', color: '#0f172a', backgroundColor: '#ffffff', fontWeight: 600 }}>
                      <option value="1">Low</option><option value="2">Medium</option><option value="3">High</option><option value="4">Critical</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</label>
                    <select value={editForm.statusid} onChange={e => setEditForm({...editForm, statusid: e.target.value})} style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14, outline: 'none', cursor: 'pointer', color: '#0f172a', backgroundColor: '#ffffff', fontWeight: 600 }}>
                      <option value="1">Open</option><option value="2">In Progress</option><option value="5">Pending</option><option value="3">Resolved</option><option value="4">Closed</option>
                    </select>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', padding: '0 30px', background: '#fff', borderBottom: '1px solid var(--border, #e2e8f0)', overflowX: 'auto', flexShrink: 0, minHeight: '54px' }}>
                {['details', 'workflow', 'history'].map(tab => {
                  return (
                    <button 
                      key={tab} 
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      style={{ padding: '16px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '3px solid var(--accent, #4f46e5)' : '3px solid transparent', color: activeTab === tab ? 'var(--accent, #4f46e5)' : '#64748b', fontWeight: activeTab === tab ? 800 : 600, fontSize: 14, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}
                    >
                      {tab === 'workflow' ? 'Workflow & Chat' : tab === 'history' ? 'History Tracking' : 'Details'}
                    </button>
                  )
                })}
              </div>

              <div style={{ padding: '30px', overflowY: 'auto', flex: 1, background: '#fff' }}>
                {activeTab === 'details' && (
                  <div className="fade-up">
                    <h4 style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em' }}>Description</h4>
                    <div style={{ background: '#f8fafc', border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, padding: 20, marginBottom: 24, fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {localTicket.description || 'No description provided.'}
                    </div>

                    <div style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, overflow: 'hidden' }}>
                      {[
                        { label: 'Category', value: localTicket.category_name || `Category ${localTicket.categoryid || 'Unknown'}` },
                        { label: 'Reporter', value: reporterName },
                        { label: 'Assigned Agent', value: assignedName },
                        { label: 'Created', value: formatDate(localTicket.createdat || localTicket.created_at) },
                        { label: 'Last Updated', value: formatDate(localTicket.updatedat || localTicket.updated_at) }
                      ].map((row, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'row', padding: '16px 20px', borderBottom: i === 4 ? 'none' : '1px solid var(--border, #e2e8f0)', background: i % 2 === 0 ? '#fff' : '#f8fafc', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ width: 140, fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{row.label}</div>
                          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1 }}>{row.value}</div>
                        </div>
                      ))}
                    </div>

                    {localTicket.attachments && localTicket.attachments.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <h4 style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em' }}>Attachments</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                          {localTicket.attachments.map((att, i) => (
                            <a key={i} href={`http://localhost:8000/storage/${att.filepath}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📎</div>
                              <div style={{ flex: 1, overflow: 'hidden' }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.filename}</p>
                                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{att.filesizekb ? `${att.filesizekb} KB` : 'Attached File'}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'workflow' && (
                  <div className="fade-up">
                    
                    {isManager && sId !== 4 && (
                      <>
                        <h4 style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em' }}>Ticket Routing</h4>
                        <div style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <select 
                              value={selectedAgent} 
                              onChange={e => setSelectedAgent(e.target.value)} 
                              style={{ flex: 1, minWidth: '150px', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none', cursor: 'pointer', color: '#0f172a', backgroundColor: '#ffffff', fontWeight: 600 }}
                            >
                              <option value="">-- Unassigned --</option>
                              {Array.isArray(agents) && agents.length > 0 ? (
                                agents.map(a => (
                                  <option key={a.id} value={a.id}>
                                    {a.fullname || a.name || `User #${a.id}`} ({a.role}) 
                                    {a.active_tickets_count ? ` — ${a.active_tickets_count} Active` : ''}
                                  </option>
                                ))
                              ) : (
                                <option disabled>No agents found</option>
                              )}
                            </select>
                            <button type="button" onClick={handleAssign} disabled={isUpdating} style={{ padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: isUpdating ? 'not-allowed' : 'pointer' }}>Assign</button>
                            <button type="button" onClick={() => setShowEscalateConfirm(true)} disabled={isUpdating} style={{ padding: '10px 20px', background: '#fef2f2', color: '#e11d48', border: 'none', borderRadius: 8, fontWeight: 700, cursor: isUpdating ? 'not-allowed' : 'pointer' }}>Escalate ⚠️</button>
                          </div>
                        </div>
                      </>
                    )}

                    <h4 style={{ margin: isStandardUser ? '0 0 10px' : '30px 0 10px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em' }}>Communication Hub</h4>
                    
                    <div style={{ background: '#f8fafc', border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, padding: 20, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                      {loadingComments ? <p style={{ fontSize: 12, color: '#64748b' }}>Loading conversation...</p> : 
                        visibleComments.length === 0 ? <p style={{ fontSize: 12, color: '#64748b' }}>No comments yet.</p> :
                        visibleComments.map(c => {
                          const isMe = Number(c.userid) === currentUserId;
                          return (
                            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                              <span style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                                {c.author_name} {c.isinternal && <span style={{ color: '#d97706' }}>(Internal Note)</span>} • {formatDistanceToNow(parseUtcDate(c.createdat), { addSuffix: true })}
                              </span>
                              
                              <div style={{ background: isMe ? 'var(--accent, #4f46e5)' : '#ffffff', color: isMe ? '#ffffff' : '#0f172a', padding: '12px 16px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', border: isMe ? 'none' : '1px solid #cbd5e1', fontSize: 13, maxWidth: '85%', fontWeight: 500 }}>
                                {renderCommentContent(c.content, isMe)}
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>

                    {sId !== 4 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <textarea 
                          placeholder="Type a reply... Use @Name to mention someone." 
                          value={newComment} 
                          onChange={e => setNewComment(e.target.value)} 
                          style={{ width: '100%', height: 80, padding: 16, borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', resize: 'vertical', color: '#0f172a', backgroundColor: '#ffffff', fontWeight: 500 }} 
                        />
                        
                        {/* --- THE FIX: NEW DROPZONE UPLOAD FOR COMMENTS --- */}
                        <div style={{ marginBottom: 4 }}>
                          <div 
                            {...getRootProps()} 
                            style={{ 
                              padding: '16px', 
                              border: `2px dashed ${isDragActive ? 'var(--accent)' : '#cbd5e1'}`, 
                              borderRadius: 12, 
                              background: isDragActive ? 'var(--accent-light)' : '#f8fafc', 
                              textAlign: 'center', 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <input {...getInputProps()} />
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isDragActive ? 'var(--accent)' : '#64748b' }}>
                              {isDragActive ? "Drop files to attach..." : "Drag & drop files here, or click to browse"}
                            </p>
                          </div>
                          
                          {commentFiles.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                              {commentFiles.map((file, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 8 }}>
                                  <span style={{ fontSize: 11, color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                                    📎 {file.name} <span style={{ color: '#64748b', fontWeight: 500 }}>({(file.size/1024).toFixed(0)} KB)</span>
                                  </span>
                                  <button 
                                    type="button" 
                                    onClick={() => removeCommentFile(idx)} 
                                    style={{ background: '#fef2f2', border: 'none', color: '#e11d48', cursor: 'pointer', fontSize: 14, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4 }}
                                    title="Remove file"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          {isStandardUser ? <div /> : (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
                              <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                              Mark as Internal Note (Hidden from Reporter)
                            </label>
                          )}
                          <button type="button" onClick={handlePostComment} disabled={isUpdating || (!newComment.trim() && commentFiles.length === 0)} style={{ padding: '10px 20px', background: 'var(--emerald, #10b981)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: (isUpdating || (!newComment.trim() && commentFiles.length === 0)) ? 'not-allowed' : 'pointer' }}>
                            {isUpdating ? 'Sending...' : 'Send Reply ↗'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: 12, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600 }}>🔒 This ticket is closed. Further communication is disabled.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="fade-up">
                    {loadingHistory ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>Loading audit log...</p>
                    ) : history.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>No history recorded for this ticket.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {history.map((h, i) => {
                          const actionName = h.action ? h.action.replace(/_/g, ' ').toUpperCase() : 'UPDATED';
                          const author = h.user_name || h.fullname || h.author_name || 'System User';
                          let detailText = '';
                          
                          try {
                            const valToParse = h.new_value || h.newvalue;
                            if (valToParse) {
                              const parsed = typeof valToParse === 'string' ? JSON.parse(valToParse) : valToParse;
                              if (parsed.agentid || parsed.agent_id || parsed.assignedto) {
                                const aId = parsed.agentid || parsed.agent_id || parsed.assignedto;
                                const assignedAgent = agents.find(a => Number(a.id) === Number(aId));
                                detailText = `Assigned to ${assignedAgent ? assignedAgent.fullname : `Agent #${aId}`}`;
                              } else if (parsed.statusid) {
                                const sNum = Number(parsed.statusid);
                                const sText = sNum === 2 ? 'In Progress' : sNum === 3 ? 'Resolved' : sNum === 4 ? 'Closed' : sNum === 5 ? 'Pending' : 'Open';
                                detailText = `Status changed to ${sText}`;
                              } else if (parsed.priorityid) {
                                const pNum = Number(parsed.priorityid);
                                const pText = pNum === 4 ? 'CRITICAL' : pNum === 3 ? 'HIGH' : pNum === 2 ? 'MEDIUM' : 'LOW';
                                detailText = `Priority changed to ${pText}`;
                              } else if (parsed.title) {
                                detailText = `Updated ticket title`;
                              }
                            }
                          } catch (e) {}

                          return (
                            <div key={h.id || i} style={{ display: 'flex', gap: 16 }}>
                              <div style={{ width: 2, background: 'var(--border, #e2e8f0)', position: 'relative', marginTop: 6 }}><div style={{ position: 'absolute', top: 0, left: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent, #4f46e5)', border: '2px solid #fff' }} /></div>
                              <div>
                                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{actionName}</p>
                                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#334155' }}><span style={{ fontWeight: 600 }}>{author}</span> {detailText ? `— ${detailText}` : ''}</p>
                                <p style={{ margin: 0, fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: '#64748b' }}>{formatDate(h.created_at || h.createdat)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* DYNAMIC ROLE-AWARE FOOTER */}
          <div style={{ padding: '20px 30px', background: '#f8fafc', borderTop: '1px solid var(--border, #e2e8f0)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            {isEditing ? (
               <>
                 <div />
                 <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                   <button type="button" onClick={() => setIsEditing(false)} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel Edit</button>
                   <button type="button" onClick={handleSaveEdit} disabled={isUpdating} style={{ background: 'var(--accent, #4f46e5)', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: isUpdating ? 'not-allowed' : 'pointer', boxShadow: 'var(--shadow-accent)' }}>{isUpdating ? 'Saving...' : 'Save Changes'}</button>
                 </div>
               </>
            ) : (
               <>
                 <div style={{ position: 'relative' }}>
                   {(!isStandardUser) && (sId !== 4 || timeSummary.total > 0) && (
                     <button 
                       type="button" 
                       onClick={() => setIsLoggingTime(!isLoggingTime)} 
                       style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                     >
                       ⏱️ {timeSummary.total > 0 ? `Time Sheet (${formatMinutes(timeSummary.total)})` : 'Log Time'}
                     </button>
                   )}

                   {isLoggingTime && (
                     <div className="fade-up" style={{ position: 'absolute', bottom: '120%', left: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, padding: 20, width: 280, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', zIndex: 100 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Time Sheet</h4>
                          <button onClick={() => setIsLoggingTime(false)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                        </div>
                        
                        {Object.keys(timeSummary.breakdown).length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                            {Object.entries(timeSummary.breakdown).map(([author, mins]) => (
                              <div key={author} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>{author}</span>
                                <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatMinutes(mins)}</span>
                              </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: 'var(--accent)', paddingTop: 10, marginTop: 4, borderTop: '1px dashed #cbd5e1' }}>
                              <span>Total Invested</span>
                              <span>{formatMinutes(timeSummary.total)}</span>
                            </div>
                          </div>
                        ) : (
                          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>No time logged on this ticket yet.</p>
                        )}

                        {sId !== 4 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* --- THE FIX: ADDED COLOR AND BACKGROUND COLOR TO INPUT --- */}
                            <input type="text" placeholder="e.g., 1h 30m or 45m" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', color: '#0f172a', backgroundColor: '#ffffff' }} />
                            <button onClick={submitTimeLog} disabled={isUpdating || !timeInput.trim()} style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: isUpdating || !timeInput.trim() ? 'not-allowed' : 'pointer' }}>
                              {isUpdating ? 'Saving...' : 'Add Time Record'}
                            </button>
                          </div>
                        )}
                     </div>
                   )}
                 </div>

                 <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                   {(isManager || isAgent) && sId !== 3 && sId !== 4 && (
                     <button type="button" onClick={() => setShowResolveConfirm(true)} disabled={isUpdating} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: isUpdating ? 'not-allowed' : 'pointer' }}>
                       ✓ Resolve Ticket
                     </button>
                   )}
                   {(isManager || isAgent) && sId !== 4 && (
                     <button type="button" onClick={() => setShowCloseConfirm(true)} disabled={isUpdating} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: isUpdating ? 'not-allowed' : 'pointer' }}>
                       Close Ticket
                     </button>
                   )}

                   {(isManager || (isStandardUser && isCreator)) && sId !== 4 && (
                     <button type="button" onClick={() => setShowCancelConfirm(true)} style={{ background: '#fef2f2', color: '#e11d48', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel Ticket</button>
                   )}

                   <button type="button" onClick={onClose} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Close Window</button>
                   
                   {(isManager) && sId !== 4 && (
                     <button type="button" onClick={() => { if (!isAssigned) setIsEditing(true); }} disabled={isAssigned} title={isAssigned ? "Cannot edit a ticket that is already assigned" : "Edit Ticket Details"} style={{ background: isAssigned ? '#f1f5f9' : 'var(--accent, #4f46e5)', color: isAssigned ? '#94a3b8' : '#ffffff', border: isAssigned ? '1px solid #cbd5e1' : 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: isAssigned ? 'not-allowed' : 'pointer', boxShadow: isAssigned ? 'none' : 'var(--shadow-accent)' }}>
                       Edit Ticket ✎
                     </button>
                   )}
                 </div>
               </>
            )}
          </div>
        </div>
      </div>

      {/* --- CONFIRMATION OVERLAYS --- */}
      {showCancelConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 10 }}>
          <div className="modal-panel fade-up" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 20, padding: '30px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>🛑</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Cancel & Close Ticket?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Are you sure you want to cancel <strong>{localTicket.referenceno || `TKT-00${localTicket.id}`}</strong>?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setShowCancelConfirm(false)} disabled={isCancelling} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}>Keep Open</button>
              <button type="button" onClick={executeCancel} disabled={isCancelling} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isCancelling ? 'not-allowed' : 'pointer', background: '#e11d48', border: 'none', color: '#ffffff', boxShadow: '0 4px 14px rgba(225,29,72,0.3)' }}>{isCancelling ? 'Cancelling...' : 'Yes, Cancel Ticket'}</button>
            </div>
          </div>
        </div>
      )}

      {showEscalateConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 10 }}>
          <div className="modal-panel fade-up" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 20, padding: '30px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Escalate Ticket?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Are you sure you want to escalate <strong>{localTicket.referenceno || `TKT-00${localTicket.id}`}</strong> to CRITICAL priority?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setShowEscalateConfirm(false)} disabled={isUpdating} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}>Cancel</button>
              <button type="button" onClick={executeEscalate} disabled={isUpdating} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isUpdating ? 'not-allowed' : 'pointer', background: '#ea580c', border: 'none', color: '#ffffff', boxShadow: '0 4px 14px rgba(234,88,12,0.3)' }}>{isUpdating ? 'Escalating...' : 'Yes, Escalate'}</button>
            </div>
          </div>
        </div>
      )}

      {showResolveConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 10 }}>
          <div className="modal-panel fade-up" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 20, padding: '30px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>✓</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Resolve Ticket?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Are you sure you want to mark <strong>{localTicket.referenceno || `TKT-00${localTicket.id}`}</strong> as resolved?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setShowResolveConfirm(false)} disabled={isUpdating} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}>Cancel</button>
              <button type="button" onClick={() => { setShowResolveConfirm(false); handleStatusChange(3); }} disabled={isUpdating} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isUpdating ? 'not-allowed' : 'pointer', background: '#16a34a', border: 'none', color: '#ffffff', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>{isUpdating ? 'Updating...' : 'Yes, Resolve'}</button>
            </div>
          </div>
        </div>
      )}

      {showCloseConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 10 }}>
          <div className="modal-panel fade-up" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 20, padding: '30px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>🔒</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Close Ticket?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Are you sure you want to officially close <strong>{localTicket.referenceno || `TKT-00${localTicket.id}`}</strong>? This action signifies the issue is completely finished.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setShowCloseConfirm(false)} disabled={isUpdating} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}>Cancel</button>
              <button type="button" onClick={() => { setShowCloseConfirm(false); handleStatusChange(4); }} disabled={isUpdating} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isUpdating ? 'not-allowed' : 'pointer', background: '#475569', border: 'none', color: '#ffffff', boxShadow: '0 4px 14px rgba(71,85,105,0.3)' }}>{isUpdating ? 'Updating...' : 'Yes, Close'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}