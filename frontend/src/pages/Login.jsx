import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Reusing the exact design token injection from the dashboard to guarantee flawless design harmony
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
      --shadow-accent: 0 8px 28px rgba(79,70,229,0.22);
      --font-body:    'Plus Jakarta Sans', sans-serif;
      --font-mono:    'JetBrains Mono', monospace;
    }

    /* ── Seamless Ambient Floating Orbs ── */
    @keyframes floatA {
      0%,100% { transform: translateY(0)   scale(1); }
      50%      { transform: translateY(-24px) scale(1.04); }
    }
    @keyframes floatB {
      0%,100% { transform: translateY(0)   scale(1); }
      50%      { transform: translateY(20px) scale(1.03); }
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }

    .orb-a { animation: floatA 9s ease-in-out infinite; pointer-events: none; }
    .orb-b { animation: floatB 12s ease-in-out infinite; pointer-events: none; }
    .fade-up { animation: fadeSlideUp .45s ease both; }
    .fade-in { animation: fadeIn .3s ease both; }

    .input-field {
      transition: border-color .18s, box-shadow .18s;
    }
    .input-field:focus {
      outline: none;
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 3px rgba(79,70,229,.1);
    }

    .btn-primary {
      transition: transform .15s, box-shadow .15s, background .15s;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-accent);
    }
  `}</style>
);

function Login() {
  // Configured default hooks to point smoothly at database testing seed entries
  const [email, setEmail] = useState('admin@enterprise.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Forgot password flow handlers
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Securely transition route context states
        navigate('/dashboard');
      } else {
        setError('Invalid credentials combination response from server.');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMatrix = err.response.data.errors;
        const firstKey = Object.keys(errorMatrix)[0];
        setError(errorMatrix[firstKey][0]);
      } else {
        setError(err.response?.data?.message || 'Authentication credentials failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/forgot-password', { email: recoveryEmail });
      setSuccessMessage(response.data?.message || 'If that account exists in our system, a secure password recovery link has been dispatched.');
      setRecoveryEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while processing the reset sequence.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyles />
      
      <div 
        className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden antialiased"
        style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}
      >
        
        {/* Ambient glowing shapes */}
        <div className="orb-a" style={{ position: 'fixed', top: '-8%', right: '2%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(79,70,229,.07) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />
        <div className="orb-b" style={{ position: 'fixed', bottom: '-10%', left: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(14,165,233,.06) 0%, transparent 68%)', borderRadius: '50%', zIndex: 0 }} />

        {/* Main Card Container */}
        <div 
          className="w-full max-w-md fade-up z-10 p-8 md:p-10"
          style={{ 
            background: '#ffffff', 
            border: '1px solid var(--border)', 
            borderRadius: '22px', 
            boxShadow: '0 32px 80px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.02)' 
          }}
        >
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div 
              className="w-12 h-12 flex items-center justify-center mx-auto mb-4 transition-all duration-200"
              style={{ 
                borderRadius: '13px', 
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)',
                boxShadow: '0 6px 20px rgba(79,70,229,.3)'
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '.04em' }}>IT</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-.5px' }}>
              {isForgotPasswordMode ? 'Recover Password' : 'IT Help Desk'}
            </h1>
            <p style={{ fontSize: 12, color: 'var(--txt-secondary)', marginTop: '6px', fontWeight: 500 }}>
              {isForgotPasswordMode 
                ? 'Provide your enterprise email index to reset your access tokens' 
                : 'Sign in to access the enterprise support system'}
            </p>
          </div>

          {/* Action Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 fade-in flex items-center gap-2" style={{ background: 'var(--rose-light)', border: '1px solid #fecdd3', borderRadius: '10px', color: 'var(--rose)', fontSize: 12, fontWeight: 600 }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--rose)' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Action Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 fade-in flex flex-col gap-1" style={{ background: 'var(--emerald-light)', border: '1px solid #bbf7d0', borderRadius: '10px', color: 'var(--emerald)', fontSize: 12, fontWeight: 600 }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--emerald)' }} />
                <span>Request Processed Successfully</span>
              </div>
              <p style={{ color: 'var(--txt-secondary)', fontSize: 11, fontWeight: 500, lineHeight: 1.5, paddingLeft: '14px' }}>{successMessage}</p>
            </div>
          )}

          {/* Conditional Workflow Rendering */}
          {!isForgotPasswordMode ? (
            /* STANDARD SIGN IN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label style={{ display: 'block', color: 'var(--txt-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, tracking: '.08em', textTransform: 'uppercase', marginBottom: '6px' }}>Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 input-field text-xs"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--txt-primary)', fontWeight: 500 }}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label style={{ display: 'block', color: 'var(--txt-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, tracking: '.08em', textTransform: 'uppercase' }}>Password</label>
                  <button
                    type="button"
                    onClick={() => { setError(''); setSuccessMessage(''); setIsForgotPasswordMode(true); }}
                    style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer' }}
                    className="hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 input-field text-xs"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--txt-primary)', fontWeight: 500 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-white py-2.5 text-xs font-bold"
                  style={{ background: 'var(--accent)', borderRadius: '10px', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Verifying Credentials...' : 'Sign In'}
                </button>
              </div>
            </form>
          ) : (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={handleRecoverySubmit} className="space-y-5 fade-in">
              <div>
                <label style={{ display: 'block', color: 'var(--txt-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, tracking: '.08em', textTransform: 'uppercase', marginBottom: '6px' }}>Registered Corporate Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 input-field text-xs"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--txt-primary)', fontWeight: 500 }}
                  placeholder="yourname@company.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-white py-2.5 text-xs font-bold"
                  style={{ background: 'var(--accent)', borderRadius: '10px', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Transmitting Request...' : 'Send Recovery Link'}
                </button>

                <button
                  type="button"
                  onClick={() => { setError(''); setSuccessMessage(''); setIsForgotPasswordMode(false); }}
                  className="w-full text-xs font-bold"
                  style={{ background: 'var(--bg-2)', color: 'var(--txt-secondary)', borderRadius: '10px', border: '1px solid var(--border)', padding: '9px 0', cursor: 'pointer' }}
                >
                  Return to Login Screen
                </button>
              </div>
            </form>
          )}

          {/* Credentials Footer for Testing Environment */}
          {!isForgotPasswordMode && (
            <div className="mt-8 pt-5 text-center text-[11px]" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="mb-2 font-semibold" style={{ color: 'var(--txt-muted)' }}>Corporate Access Environment:</p>
              <div 
                className="inline-block px-3 py-1.5 text-xs tracking-wide"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--txt-secondary)', fontFamily: 'var(--font-mono)' }}
              >
                admin@enterprise.com <span style={{ color: 'var(--border-2)', margin: '0 4px' }}>|</span> password
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default Login;