import React, { useState } from 'react';
import api from '../services/api';

export default function ProfileModal({ onClose }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [fullname, setFullname] = useState(user.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/profile/${user.id}`, { fullname, password });
      
      // Update local storage with new name
      user.name = fullname;
      localStorage.setItem('user', JSON.stringify(user));
      
      alert("Profile updated successfully!");
      onClose();
      window.location.reload(); // Refresh to show new name in sidebar
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', padding: 30, borderRadius: 16, width: 400 }}>
        <h2 style={{ marginTop: 0 }}>My Profile</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label>Full Name</label>
            <input type="text" value={fullname} onChange={e => setFullname(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 5, borderRadius: 6, border: '1px solid #ccc' }} />
          </div>
          <div>
            <label>New Password (Optional)</label>
            <input type="password" placeholder="Leave blank to keep current" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 5, borderRadius: 6, border: '1px solid #ccc' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}