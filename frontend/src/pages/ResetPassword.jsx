import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import GlobalStyles from '../components/GlobalStyles';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);

    if (password !== passwordConfirmation) {
      setError("Passwords do not match."); setLoading(false); return;
    }

    try {
      const response = await api.post('/reset-password', {
        token: token,
        password: password,
        password_confirmation: passwordConfirmation
      });
      setMessage(response.data.message || "Password reset successfully! Redirecting...");
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired token.");
    } finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: 'var(--rose)', fontWeight: 600 }}>Invalid or missing reset token.</p>
      </div>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden', padding: '20px' }}>
        
        {/* Background Orbs to match dashboard */}
        <div style={{ position: 'absolute', top: '-10%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(79,70,229,.08) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(14,165,233,.07) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />

        {/* Card (Added modal-panel class for mobile responsiveness) */}
        <div className="modal-panel" style={{ background: '#fff', padding: '48px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#000', marginBottom: '10px' }}>Set New Password</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Secure account recovery for <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{email}</span>
            </p>
          </div>

          {message && <div style={{ padding: '12px 16px', background: '#f0fdf4', color: '#059669', borderRadius: '10px', marginBottom: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid #bbf7d0' }}>{message}</div>}
          {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#e11d48', borderRadius: '10px', marginBottom: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid #fecdd3' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>New Password</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '14px', outline: 'none', background: '#fff', color: '#000' }}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Confirm Password</label>
              <input 
                type="password" required value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '14px', outline: 'none', background: '#fff', color: '#000' }}
              />
            </div>
            <button 
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', transition: 'all 0.2s' }}
            >
              {loading ? 'Processing...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}