import React from 'react';

// App-wide safety net: catches render-time exceptions in any page so a single
// bad value (e.g. a malformed date) degrades to a readable message instead of
// a blank white screen.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Render error caught by ErrorBoundary:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f3f9ff', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: 24,
      }}>
        <div style={{
          maxWidth: 480, width: '100%', background: '#fff', borderRadius: 20, padding: '34px 36px',
          border: '1px solid #e1eefc', boxShadow: '0 18px 40px -12px rgba(2,132,199,0.28)', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 18px',
            background: 'linear-gradient(135deg,#e11d48,#fb7185)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff', fontWeight: 800,
          }}>!</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#102a43' }}>
            Something went wrong on this page
          </h2>
          <p style={{ margin: '0 0 18px', fontSize: 13.5, color: '#627d98', lineHeight: 1.6 }}>
            The page hit an unexpected error while rendering. The details below can help pin it down.
          </p>
          {this.state.error && (
            <pre style={{
              textAlign: 'left', background: '#fff1f2', color: '#be123c', borderRadius: 12,
              padding: '12px 14px', fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '0 0 20px', border: '1px solid #fecdd3',
            }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700,
                fontSize: 13, color: '#fff', background: 'linear-gradient(135deg,#0284c7,#0ea5e9)',
                boxShadow: '0 10px 24px -8px rgba(2,132,199,.6)',
              }}
            >
              Reload Page
            </button>
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              style={{
                padding: '10px 22px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                color: '#102a43', background: '#fff', border: '1.5px solid #e1eefc',
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
