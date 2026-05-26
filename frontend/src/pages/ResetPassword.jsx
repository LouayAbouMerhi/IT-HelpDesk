import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api'; // Make sure this path points to your axios instance

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Grab the token and email directly from the URL your email sent!
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Send the token and the new password to your Laravel backend
      const response = await api.post('/reset-password', {
        token: token,
        password: password,
        password_confirmation: passwordConfirmation
      });

      setMessage(response.data.message || "Password reset successfully!");
      
      // Redirect to login after 3 seconds so they can use their new password
      setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The token may be expired.");
    } finally {
      setLoading(false);
    }
  };

  // If there is no token in the URL, don't even show the form
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--rose)', fontWeight: 600 }}>Invalid or missing reset token.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Set New Password</h2>
        <p style={{ fontSize: '14px', color: 'var(--txt-muted)', marginBottom: '24px' }}>
          Resetting password for: <strong>{email}</strong>
        </p>

        {message && <div style={{ padding: '12px', background: 'var(--emerald-light)', color: 'var(--emerald)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{message}</div>}
        {error && <div style={{ padding: '12px', background: 'var(--rose-light)', color: 'var(--rose)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', display: 'block', marginBottom: '6px' }}>New Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
            <input 
              type="password" 
              required 
              value={passwordConfirmation} 
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
            style={{ padding: '12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}
          >
            {loading ? 'Resetting...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}