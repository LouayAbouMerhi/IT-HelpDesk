import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GlobalStyles from '../components/GlobalStyles';
import { format } from 'date-fns';

const parseUtcDate = (dateString) => {
  if (!dateString) return new Date();
  const isoString = dateString.replace(' ', 'T') + (dateString.includes('Z') ? '' : 'Z');
  return new Date(isoString);
};

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{"name":"User"}');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await api.get('/knowledge-base');
        const list = res.data?.data || res.data || [];
        // Normalize backend fields (author_name, ticket_id) to what the UI expects
        const normalized = (Array.isArray(list) ? list : []).map(a => ({
          ...a,
          author: a.author || a.author_name || 'IT Team',
          ticket_ref: a.ticket_ref || (a.ticket_id ? `TKT-${String(a.ticket_id).padStart(5, '0')}` : '—'),
          content: a.content || '',
          category: a.category || 'General',
        }));
        setArticles(normalized);
      } catch (err) {
        console.error('Failed to fetch knowledge base', err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  const filteredArticles = articles.filter(a => {
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'All' || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <>
      <GlobalStyles />
      
      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-panel fade-up" style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ padding: '30px 40px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em' }}>{selectedArticle.category}</span>
                <button onClick={() => setSelectedArticle(null)} style={{ background: '#e2e8f0', border: 'none', width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: 'pointer', color: '#475569' }}>✕</button>
              </div>
              <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{selectedArticle.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>✍️ Written by {selectedArticle.author}</span>
                <span>•</span>
                <span>{format(parseUtcDate(selectedArticle.created_at), 'MMM dd, yyyy')}</span>
                <span>•</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>Derived from {selectedArticle.ticket_ref}</span>
              </div>
            </div>
            <div style={{ padding: '40px', overflowY: 'auto', flex: 1, fontSize: 15, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {selectedArticle.content}
            </div>
            <div style={{ padding: '20px 40px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedArticle(null)} style={{ padding: '10px 24px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>Close Article</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        
        {/* SIDEBAR (Match your existing layout) */}
        <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 252, background: '#fff', borderRight: '1px solid #e2e8f0', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(2,132,199,.3)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>IT</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>CommandCenter</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>Enterprise Ops</div>
                </div>
              </div>
            </div>
            <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: 13 }}>◧ Overview</a>
              <a href="/tickets" onClick={(e) => { e.preventDefault(); navigate('/tickets'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: 13 }}>⊟ Incident Tickets</a>
              <a href="/roster" onClick={(e) => { e.preventDefault(); navigate('/roster'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: 13 }}>◎ Agent Roster</a>
              <a href="/analytics" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: 13 }}>▤ Analytics</a>
              <a href="/activity-logs" onClick={(e) => { e.preventDefault(); navigate('/activity-logs'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: 13 }}>≣ System Audit Log</a>
            </nav>
          </div>
          <div style={{ padding: '14px 12px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 12, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-light), #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>{currentUser.name?.charAt(0) || 'A'}</div>
                <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{currentUser.name}</p></div>
              </div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}>⏻</button>
            </div>
          </div>
        </aside>

        <main style={{ marginLeft: 252, flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          <header style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0', padding: '12px 30px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <input type="text" placeholder="Search the Knowledge Base..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, maxWidth: 500, padding: '10px 16px', border: '1.5px solid #cbd5e1', borderRadius: 10, fontSize: 13, outline: 'none' }} />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '10px 16px', border: '1.5px solid #cbd5e1', borderRadius: 10, fontSize: 13, outline: 'none', cursor: 'pointer', background: '#fff' }}>
              <option value="All">All Categories</option>
              <option value="Network">Network</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Access Control">Access Control</option>
            </select>
          </header>

          <div style={{ padding: '40px 50px', flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
            
            <div style={{ marginBottom: 40, textAlign: 'center', padding: '40px 0', background: 'linear-gradient(120deg, #0284c7, #0ea5e9 55%, #38bdf8)', borderRadius: 24, color: '#fff', boxShadow: '0 20px 25px -5px rgba(2,132,199,0.3)' }}>
              <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-1px' }}>Internal Knowledge Base</h1>
              <p style={{ fontSize: 15, margin: 0, opacity: 0.9 }}>Browse verified solutions and system procedures from the IT team.</p>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>Loading articles...</p>
            ) : filteredArticles.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 16, padding: '40px 0' }}>No articles found matching your search.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                {filteredArticles.map(article => (
                  <div 
                    key={article.id} 
                    onClick={() => setSelectedArticle(article)}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em' }}>{article.category}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{format(parseUtcDate(article.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.4 }}>{article.title}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.6, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {article.content}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{article.author.charAt(0)}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{article.author}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>Read Article →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}