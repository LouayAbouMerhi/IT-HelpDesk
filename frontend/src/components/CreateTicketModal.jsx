import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';

export default function CreateTicketModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(''); 
  const [priorityId, setPriorityId] = useState(''); 
  const [attachments, setAttachments] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);

  // Fetch Lookup Data
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res = await api.get('/tickets/lookups');
        setCategories(res.data.categories);
        setPriorities(res.data.priorities);
        
        if (res.data.categories.length > 0) setCategoryId(res.data.categories[0].id);
        if (res.data.priorities.length > 0) setPriorityId(res.data.priorities[0].id);
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    fetchLookups();
  }, []);

  // --- REACT DROPZONE LOGIC ---
  const onDrop = useCallback(acceptedFiles => {
    setAttachments(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5242880 // 5MB limit
  });

  const removeAttachment = (indexToRemove) => {
    setAttachments(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    
    // Safely fallback to 1 instead of crashing with NaN
    formData.append('categoryid', categoryId || 1);
    formData.append('priorityid', priorityId || 1);
    
    attachments.forEach((file) => {
      formData.append('attachments[]', file);
    });

    try {
      const response = await api.post('/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess(response.data); 
    } catch (err) {
      // Displays the EXACT SQL error if the database crashes
      const dbError = err.response?.data?.error;
      const genericMsg = err.response?.data?.message;
      
      // If validation fails, Laravel returns 'errors' object
      let validationMsg = '';
      if (err.response?.data?.errors) {
         const firstKey = Object.keys(err.response.data.errors)[0];
         validationMsg = err.response.data.errors[firstKey][0];
      }

      setError(validationMsg || dbError || genericMsg || 'Failed to create ticket. Check server logs.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 500, boxShadow: '0 32px 80px rgba(15,23,42,0.2), 0 0 0 1px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        
        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #faf9ff 0%, #f0f4ff 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 800, color: '#000000' }}>Log New Incident</h2>
          <button onClick={onClose} className="btn-ghost" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: '#000000', cursor: 'pointer', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ padding: '12px', background: 'var(--rose-light)', color: 'var(--rose)', borderRadius: '8px', fontSize: 13, fontWeight: 600 }}>{error}</div>}

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Incident Title <span style={{color: 'var(--rose)'}}>*</span></label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Briefly describe the issue..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', color: '#000000', backgroundColor: '#ffffff' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', color: '#000000', backgroundColor: '#ffffff' }}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Priority</label>
              <select value={priorityId} onChange={(e) => setPriorityId(e.target.value)} className="input-field" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', color: '#000000', backgroundColor: '#ffffff' }}>
                {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Detailed Description <span style={{color: 'var(--rose)'}}>*</span></label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Provide steps to reproduce, error codes, etc." rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', resize: 'vertical', fontFamily: 'inherit', color: '#000000', backgroundColor: '#ffffff' }} />
          </div>

          {/* DRAG AND DROP AREA */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Attachments (Optional)</label>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              
              <div 
                {...getRootProps()} 
                style={{ 
                  padding: '24px 20px', 
                  border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`, 
                  borderRadius: 12, 
                  background: isDragActive ? 'var(--accent-light)' : 'var(--surface-2)', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input {...getInputProps()} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isDragActive ? 'var(--accent)' : 'var(--txt-muted)' }}>
                  {isDragActive ? "Drop the files here..." : "Drag & drop files here, or click to browse"}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--txt-muted)' }}>Supports JPG, PNG, PDF (Max 5MB)</p>
              </div>
              
              {/* FILE PREVIEW LIST */}
              {attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {attachments.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--txt-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                        📎 {file.name} <span style={{ color: 'var(--txt-muted)', fontWeight: 500 }}>({(file.size/1024).toFixed(0)} KB)</span>
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(idx)} 
                        style={{ background: 'var(--rose-light)', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 14, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6 }}
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: '#ffffff', color: '#000000' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-accent)', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}