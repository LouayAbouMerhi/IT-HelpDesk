import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  LayoutDashboard, Ticket, Users, ScrollText, BarChart3, BookOpen,
  Sparkles, FileDown, FileSpreadsheet, RefreshCw, LogOut, TrendingUp,
  TrendingDown, CheckCircle2, AlertTriangle, Activity, Gauge, Clock,
  Calendar, Layers, Inbox, Loader, FileText
} from 'lucide-react';
import GlobalStyles from '../components/GlobalStyles';
import NotificationBell from '../components/NotificationBell';

/* ---------- animated counter ---------- */
function CountUp({ value, duration = 950 }) {
  const [n, setN] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) { setN(0); ref.current = 0; return; }
    let raf; const start = performance.now(); const from = ref.current;
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick); else ref.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n}</>;
}

/* ---------- empty data shape (keeps render safe) ---------- */
const EMPTY = {
  generatedAt: '', range: { from: null, to: null },
  stats: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, pending: 0, resolveRate: 0, unassigned: 0, avgResolutionHours: 0 },
  timeline: [], breakdown: [], priorityBreakdown: [], categoryBreakdown: [],
  agentPerformance: [], tickets: []
};

/* ---------- lazy CDN script loader (cached) ---------- */
const _scriptCache = {};
function loadScript(src) {
  if (_scriptCache[src]) return _scriptCache[src];
  _scriptCache[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('load failed: ' + src));
    document.head.appendChild(s);
  });
  return _scriptCache[src];
}
function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ---------- deterministic "AI" insight engine over live data ---------- */
function buildInsights(d) {
  const s = d.stats || {};
  const tl = d.timeline || [];
  const out = [];

  if (tl.length >= 14) {
    const prev = tl.slice(0, 7).reduce((a, b) => a + (b.count || 0), 0);
    const last = tl.slice(7).reduce((a, b) => a + (b.count || 0), 0);
    const diff = last - prev;
    const pct = prev > 0 ? Math.round((diff / prev) * 100) : (last > 0 ? 100 : 0);
    if (diff > 0) out.push({ tone: 'warning', icon: TrendingUp, title: 'Ticket inflow is rising', text: `New tickets are up ${pct}% this week (${last}) versus the previous week (${prev}). Consider pre-allocating agent capacity.` });
    else if (diff < 0) out.push({ tone: 'positive', icon: TrendingDown, title: 'Ticket inflow is easing', text: `New tickets fell ${Math.abs(pct)}% this week (${last}) versus the prior week (${prev}). Volume pressure is decreasing.` });
    else out.push({ tone: 'info', icon: Activity, title: 'Ticket inflow is steady', text: `Intake held flat at ${last} tickets across both weeks.` });
  }

  const rr = s.resolveRate || 0;
  if (rr >= 70) out.push({ tone: 'positive', icon: CheckCircle2, title: 'Healthy resolution rate', text: `${rr}% of all tickets are resolved or closed — the team is keeping pace with demand.` });
  else if (rr >= 40) out.push({ tone: 'info', icon: Gauge, title: 'Moderate resolution rate', text: `${rr}% of tickets are resolved. There is room to improve throughput on open work.` });
  else out.push({ tone: 'warning', icon: AlertTriangle, title: 'Low resolution rate', text: `Only ${rr}% of tickets are resolved or closed. A backlog may be forming.` });

  if ((s.unassigned || 0) > 0) {
    const share = s.open ? Math.round((s.unassigned / Math.max(1, s.open)) * 100) : 0;
    out.push({ tone: s.unassigned > 5 ? 'warning' : 'info', icon: AlertTriangle, title: `${s.unassigned} unassigned ticket${s.unassigned === 1 ? '' : 's'}`, text: `${s.unassigned} ticket${s.unassigned === 1 ? ' is' : 's are'} waiting for an owner${share ? ` (~${share}% of open volume)` : ''}. Assign these to avoid SLA slippage.` });
  } else {
    out.push({ tone: 'positive', icon: CheckCircle2, title: 'Full coverage', text: 'Every ticket currently has an assigned owner.' });
  }

  const ar = s.avgResolutionHours || 0;
  if (ar > 0) {
    const human = ar >= 24 ? `${(ar / 24).toFixed(1)} days` : `${ar} hours`;
    out.push({ tone: ar <= 24 ? 'positive' : (ar <= 72 ? 'info' : 'warning'), icon: Clock, title: `Avg resolution: ${human}`, text: ar <= 24 ? 'Tickets are being closed within a day on average — strong responsiveness.' : (ar <= 72 ? 'Average closure time is within three days. Acceptable, with room to tighten.' : 'Tickets take over three days to close on average. Review workflow bottlenecks.') });
  }

  if (tl.length) {
    const peak = tl.reduce((m, x) => (x.count > m.count ? x : m), tl[0]);
    if (peak.count > 0) out.push({ tone: 'info', icon: Calendar, title: `Peak intake on ${peak.date}`, text: `${peak.count} tickets were created on ${peak.date}, the highest in the period.` });
  }

  const cb = d.categoryBreakdown || [];
  if (cb.length) {
    const top = [...cb].sort((a, b) => b.value - a.value)[0];
    if (top && top.value > 0) out.push({ tone: 'info', icon: Layers, title: `"${top.name}" leads volume`, text: `${top.name} accounts for the most tickets (${top.value}). It may warrant a knowledge-base article or automation.` });
  }

  const ap = d.agentPerformance || [];
  if (ap.length) {
    const top = ap[0];
    if (top && top.resolved > 0) out.push({ tone: 'positive', icon: Users, title: `Top performer: ${top.agent}`, text: `${top.agent} has resolved ${top.resolved} ticket${top.resolved === 1 ? '' : 's'}${top.avgHours ? ` at ~${top.avgHours}h average` : ''}.` });
  }

  return out;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(EMPTY);
  const [range, setRange] = useState({ from: '', to: '' });
  const [insights, setInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [exporting, setExporting] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Admin User"}');

  const fetchAnalytics = async (r = range) => {
    setLoading(true);
    try {
      const params = {};
      if (r.from) params.from = r.from;
      if (r.to) params.to = r.to;
      const res = await api.get('/analytics', { params });
      setData({ ...EMPTY, ...res.data, stats: { ...EMPTY.stats, ...(res.data.stats || {}) } });
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // regenerate AI insights whenever data changes
  useEffect(() => {
    if (loading) return;
    setAiLoading(true);
    const t = setTimeout(() => { setInsights(buildInsights(data)); setAiLoading(false); }, 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading]);

  const regenerate = () => {
    setAiLoading(true);
    setTimeout(() => { setInsights(buildInsights(data)); setAiLoading(false); }, 650);
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };
  const applyRange = () => fetchAnalytics(range);
  const resetRange = () => { const r = { from: '', to: '' }; setRange(r); fetchAnalytics(r); };

  const s = data.stats || EMPTY.stats;
  const fileStamp = new Date().toISOString().slice(0, 10);

  const execSummary = `As of ${data.generatedAt || new Date().toLocaleString()}, the service desk holds ${s.total} total ticket${s.total === 1 ? '' : 's'} — ${s.open} open, ${s.inProgress} in progress, and ${(s.resolved + s.closed)} resolved or closed (a ${s.resolveRate}% resolution rate). Average time to resolution is ${s.avgResolutionHours} hour${s.avgResolutionHours === 1 ? '' : 's'}, and ${s.unassigned} ticket${s.unassigned === 1 ? '' : 's'} ${s.unassigned === 1 ? 'remains' : 'remain'} unassigned.`;

  /* ---------------- EXPORT: EXCEL ---------------- */
  const exportExcel = async () => {
    setExporting('excel');
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      const XLSX = window.XLSX;
      const wb = XLSX.utils.book_new();

      const summary = [
        ['IT CommandCenter — Analytics Report'],
        ['Generated', data.generatedAt || new Date().toLocaleString()],
        ['Date range', `${range.from || 'all time'} → ${range.to || 'today'}`],
        [],
        ['Metric', 'Value'],
        ['Total Tickets', s.total], ['Open', s.open], ['In Progress', s.inProgress],
        ['Resolved', s.resolved], ['Closed', s.closed], ['Pending', s.pending],
        ['Resolve Rate (%)', s.resolveRate], ['Avg Resolution (hours)', s.avgResolutionHours],
        ['Unassigned', s.unassigned],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Status', 'Count'], ...data.breakdown.map(b => [b.name, b.value])]), 'By Status');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Priority', 'Count'], ...data.priorityBreakdown.map(b => [b.name, b.value])]), 'By Priority');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Category', 'Count'], ...data.categoryBreakdown.map(b => [b.name, b.value])]), 'By Category');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Agent', 'Assigned', 'Resolved', 'Avg Hours'], ...data.agentPerformance.map(a => [a.agent, a.assigned, a.resolved, a.avgHours])]), 'Agents');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.tickets.map(t => ({
        Reference: t.reference, Title: t.title, Status: t.status, Priority: t.priority,
        Category: t.category, 'Created By': t.creator, Agent: t.agent, Created: t.created, Updated: t.updated
      }))), 'Tickets');

      XLSX.writeFile(wb, `analytics-report-${fileStamp}.xlsx`);
    } catch (err) {
      console.warn('XLSX export failed, falling back to CSV', err);
      const rows = [['Reference', 'Title', 'Status', 'Priority', 'Category', 'Created By', 'Agent', 'Created', 'Updated'],
        ...data.tickets.map(t => [t.reference, t.title, t.status, t.priority, t.category, t.creator, t.agent, t.created, t.updated])];
      const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      downloadBlob(csv, `analytics-report-${fileStamp}.csv`, 'text/csv;charset=utf-8;');
    } finally {
      setExporting('');
    }
  };

  /* ---------------- EXPORT: PDF ---------------- */
  const exportPDF = async () => {
    setExporting('pdf');
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'pt', 'a4');
      const W = doc.internal.pageSize.getWidth();

      doc.setFillColor(2, 132, 199); doc.rect(0, 0, W, 92, 'F');
      doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
      doc.text('IT CommandCenter', 40, 44);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      doc.text('Analytics & Reporting', 40, 64);
      doc.setFontSize(9);
      doc.text(`Generated ${data.generatedAt || new Date().toLocaleString()}`, 40, 80);

      doc.setTextColor(40); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 40, 120);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(70);
      doc.text(doc.splitTextToSize(execSummary, W - 80), 40, 138);

      const grid = (head, body, startY) => { doc.autoTable({ head: [head], body, startY, theme: 'grid', headStyles: { fillColor: [2, 132, 199], fontSize: 9 }, bodyStyles: { fontSize: 8.5 }, margin: { left: 40, right: 40 } }); return doc.lastAutoTable.finalY; };

      let y = 190;
      y = grid(['Metric', 'Value'], [
        ['Total Tickets', s.total], ['Open', s.open], ['In Progress', s.inProgress],
        ['Resolved', s.resolved], ['Closed', s.closed], ['Resolve Rate', `${s.resolveRate}%`],
        ['Avg Resolution', `${s.avgResolutionHours} h`], ['Unassigned', s.unassigned],
      ], y) + 18;
      if (data.breakdown.length) y = grid(['Status', 'Count'], data.breakdown.map(b => [b.name, b.value]), y) + 18;
      if (data.priorityBreakdown.length) y = grid(['Priority', 'Count'], data.priorityBreakdown.map(b => [b.name, b.value]), y) + 18;
      if (data.categoryBreakdown.length) y = grid(['Category', 'Count'], data.categoryBreakdown.map(b => [b.name, b.value]), y) + 18;
      if (data.agentPerformance.length) y = grid(['Agent', 'Assigned', 'Resolved', 'Avg Hrs'], data.agentPerformance.map(a => [a.agent, a.assigned, a.resolved, a.avgHours]), y) + 18;
      if (data.tickets.length) grid(['Ref', 'Title', 'Status', 'Priority', 'Agent', 'Created'],
        data.tickets.slice(0, 120).map(t => [t.reference, (t.title || '').slice(0, 40), t.status, t.priority, t.agent, (t.created || '').slice(0, 10)]), y);

      doc.save(`analytics-report-${fileStamp}.pdf`);
    } catch (err) {
      console.warn('jsPDF export failed, falling back to print', err);
      const rows = data.tickets.slice(0, 200).map(t => `<tr><td>${t.reference}</td><td>${t.title}</td><td>${t.status}</td><td>${t.priority}</td><td>${t.agent}</td><td>${(t.created || '').slice(0, 10)}</td></tr>`).join('');
      const html = `<html><head><title>Analytics Report</title><style>body{font-family:Arial;padding:28px;color:#102a43}h1{color:#0284c7}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}th,td{border:1px solid #d8e6f7;padding:6px 8px;text-align:left}th{background:#e0f2fe}</style></head><body><h1>IT CommandCenter — Analytics Report</h1><p>${execSummary}</p><table><thead><tr><th>Ref</th><th>Title</th><th>Status</th><th>Priority</th><th>Agent</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); }
    } finally {
      setExporting('');
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/tickets', label: 'Incident Tickets', icon: Ticket },
    { to: '/roster', label: 'Agent Roster', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, active: true },
    { to: '/activity-logs', label: 'System Audit Log', icon: ScrollText },
  ];

  const kpis = [
    { label: 'Total Tickets', value: s.total, icon: Ticket, c1: '#0ea5e9', c2: '#0284c7', tint: '#e0f2fe' },
    { label: 'Open', value: s.open, icon: Inbox, c1: '#0ea5e9', c2: '#0284c7', tint: '#e0f2fe' },
    { label: 'In Progress', value: s.inProgress, icon: Loader, c1: '#f59e0b', c2: '#d97706', tint: '#fef3c7' },
    { label: 'Resolved', value: s.resolved, icon: CheckCircle2, c1: '#10b981', c2: '#059669', tint: '#d1fae5' },
    { label: 'Resolve Rate', value: s.resolveRate, suffix: '%', icon: Gauge, c1: '#10b981', c2: '#059669', tint: '#d1fae5' },
    { label: 'Avg Resolution', value: s.avgResolutionHours, suffix: 'h', decimal: true, icon: Clock, c1: '#6366f1', c2: '#4f46e5', tint: '#e0e7ff' },
    { label: 'Unassigned', value: s.unassigned, icon: AlertTriangle, c1: '#f43f5e', c2: '#e11d48', tint: '#ffe4e6' },
  ];
  const pctFor = (k) => k.label === 'Resolve Rate' ? (s.resolveRate || 0)
    : k.label === 'Avg Resolution' ? Math.min(100, Math.round((s.avgResolutionHours || 0) / 48 * 100))
    : Math.min(100, Math.round(((k.value || 0) / Math.max(1, s.total || 0)) * 100));

  const toneStyle = {
    positive: { bg: '#ecfdf5', bd: '#a7f3d0', ic: '#059669' },
    warning: { bg: '#fff7ed', bd: '#fed7aa', ic: '#ea580c' },
    info: { bg: '#eff6ff', bd: '#bfdbfe', ic: '#2563eb' },
  };

  if (loading) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f3f9ff,#e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 56, height: 56, border: '3px solid #c5dcf6', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  );

  return (
    <>
      <GlobalStyles />
      <div className="cc-wrap">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
          .cc-wrap{ --ink:#102a43; --ink-soft:#334e68; --muted:#627d98; --muted-2:#9fb3c8;
            --cloud:#f3f9ff; --cloud-2:#e9f3fe; --surface:#fff; --border:#e1eefc; --border-2:#c5dcf6;
            --volt:#0284c7; --volt-2:#0ea5e9; --volt-3:#38bdf8; --volt-soft:#e0f2fe;
            font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--ink); }
          .cc-wrap *{ box-sizing:border-box; }
          @keyframes ccFade{ from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:none;} }
          @keyframes ccShine{ 0%{transform:translateX(-120%);} 100%{transform:translateX(220%);} }
          @keyframes ccFloat{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-9px);} }
          @keyframes ccFloatB{ 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(10px) scale(1.04);} }
          @keyframes ccDot{ 0%{transform:scale(.85); opacity:.6;} 50%{transform:scale(1); opacity:1;} 100%{transform:scale(.85); opacity:.6;} }
          @keyframes ccShimmer{ 0%{background-position:-460px 0;} 100%{background-position:460px 0;} }
          @keyframes spin{ to{transform:rotate(360deg);} }
          .cc-nav-link{ display:flex; align-items:center; gap:11px; padding:10px 13px; border-radius:11px;
            text-decoration:none; color:var(--ink-soft); font-weight:600; font-size:13.5px;
            border:1px solid transparent; transition:all .18s ease; cursor:pointer; }
          .cc-nav-link:hover{ background:var(--cloud-2); color:var(--volt); transform:translateX(2px); }
          .cc-nav-link.active{ background:linear-gradient(135deg,#0ea5e9,#0284c7); color:#fff; box-shadow:0 8px 20px -7px rgba(2,132,199,.6); }
          .cc-nav-link.active svg{ color:#fff; }
          .cc-icon-btn{ display:inline-flex; align-items:center; gap:8px; background:var(--surface);
            border:1.5px solid var(--border-2); border-radius:11px; padding:9px 15px; cursor:pointer;
            color:var(--ink); font-size:12.5px; font-weight:700; font-family:inherit; transition:all .16s ease; }
          .cc-icon-btn:hover{ border-color:var(--volt-2); color:var(--volt); box-shadow:0 6px 16px -8px rgba(2,132,199,.5); transform:translateY(-1px); }
          .cc-btn{ display:inline-flex; align-items:center; gap:8px; border:none; border-radius:11px; padding:10px 16px;
            cursor:pointer; font-size:12.5px; font-weight:800; font-family:inherit; color:#fff; transition:all .16s ease; }
          .cc-btn:disabled{ opacity:.6; cursor:default; }
          .cc-btn-pdf{ background:linear-gradient(135deg,#0ea5e9,#0284c7); box-shadow:0 10px 22px -10px rgba(2,132,199,.7); }
          .cc-btn-xls{ background:linear-gradient(135deg,#10b981,#059669); box-shadow:0 10px 22px -10px rgba(5,150,105,.7); }
          .cc-btn:hover:not(:disabled){ transform:translateY(-2px); }
          .cc-input{ padding:9px 12px; border:1.5px solid var(--border-2); border-radius:10px; outline:none;
            font-size:13px; color:var(--ink); background:var(--surface); font-family:inherit; }
          .cc-input:focus{ border-color:var(--volt-2); box-shadow:0 0 0 4px rgba(14,165,233,.13); }
          .cc-stat{ position:relative; overflow:hidden; background:var(--surface); border:1px solid var(--border);
            border-radius:18px; padding:18px 18px 16px; box-shadow:0 10px 26px -18px rgba(16,42,67,.4);
            animation:ccFade .55s ease both; transition:transform .18s ease, box-shadow .18s ease; }
          .cc-stat:hover{ transform:translateY(-4px); box-shadow:0 18px 38px -20px rgba(2,132,199,.5); }
          .cc-stat .shine{ position:absolute; top:0; left:0; width:40%; height:100%;
            background:linear-gradient(110deg,transparent,rgba(255,255,255,.55),transparent); pointer-events:none; }
          .cc-stat:hover .shine{ animation:ccShine 1s ease; }
          .cc-card{ background:var(--surface); border:1px solid var(--border); border-radius:20px;
            box-shadow:0 14px 40px -26px rgba(16,42,67,.4); animation:ccFade .55s ease both; }
          .cc-insight{ border-radius:14px; padding:14px 15px; border:1px solid; animation:ccFade .5s ease both; transition:transform .16s ease; }
          .cc-insight:hover{ transform:translateY(-3px); }
          .cc-shim{ background:linear-gradient(90deg,#eef6ff 25%,#dcecfd 37%,#eef6ff 63%); background-size:920px 100%; animation:ccShimmer 1.3s linear infinite; border-radius:12px; }
          .cc-th{ font-size:10.5px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); }
          .cc-td{ font-size:13px; color:var(--ink-soft); padding:11px 12px; border-bottom:1px solid var(--cloud-2); }
          .cc-scroll::-webkit-scrollbar{ width:9px; }
          .cc-scroll::-webkit-scrollbar-thumb{ background:var(--border-2); border-radius:9px; }
        `}</style>

        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', background: 'linear-gradient(160deg,#f3f9ff 0%,#e9f3fe 60%,#e0f2fe 100%)' }}>
          <div style={{ position: 'fixed', top: -120, right: -80, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,.22),transparent 70%)', filter: 'blur(8px)', pointerEvents: 'none', animation: 'ccFloat 9s ease-in-out infinite', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: -140, left: 180, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,165,233,.16),transparent 70%)', filter: 'blur(8px)', pointerEvents: 'none', animation: 'ccFloatB 11s ease-in-out infinite', zIndex: 0 }} />

          {/* SIDEBAR */}
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 256, background: '#fff', borderRight: '1px solid var(--border)', zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 0 40px -28px rgba(16,42,67,.35)' }}>
            <div>
              <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px -8px rgba(2,132,199,.6)' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '.5px' }}>IT</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>CommandCenter</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 600, color: 'var(--volt)', textTransform: 'uppercase', letterSpacing: '1px' }}>Enterprise Ops</div>
                  </div>
                </div>
              </div>
              <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {navLinks.map(({ to, label, icon: Icon, active }) => (
                  <a key={to} href={to} className={`cc-nav-link${active ? ' active' : ''}`}
                    onClick={(e) => { e.preventDefault(); if (!active) navigate(to); }}>
                    <Icon size={17} strokeWidth={2.1} /> {label}
                  </a>
                ))}
              </nav>
            </div>
            <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cloud)', borderRadius: 13, padding: '11px 12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{user.name?.charAt(0) || 'A'}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--muted)' }}>Administrator</p>
                  </div>
                </div>
                <button onClick={handleLogout} title="Sign out" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--muted)', borderRadius: 8, display: 'flex' }}>
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
            <header style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(243,249,255,.82)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '13px 30px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              <NotificationBell />
              <button onClick={() => fetchAnalytics()} className="cc-icon-btn"><RefreshCw size={14} /> Refresh</button>
            </header>

            <div className="cc-scroll" style={{ padding: '26px 30px 56px', flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto' }}>

              {/* HERO */}
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '26px 30px', marginBottom: 20, background: 'linear-gradient(120deg,#0284c7,#0ea5e9 55%,#38bdf8)', boxShadow: '0 22px 50px -26px rgba(2,132,199,.7)', animation: 'ccFade .5s ease both' }}>
                <div style={{ position: 'absolute', top: -50, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.13)' }} />
                <div style={{ position: 'absolute', bottom: -70, right: 120, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.09)' }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', flexShrink: 0 }}>
                    <BarChart3 size={28} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h1 style={{ fontSize: 25, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-.4px' }}>Analytics &amp; Reports</h1>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.18)', padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#fff' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6ee7b7', animation: 'ccDot 1.4s ease-in-out infinite' }} /> LIVE DATA
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,.9)', fontSize: 13, margin: '5px 0 0' }}>Live ticket trends, agent performance, AI insights and exportable reports.</p>
                  </div>
                </div>
              </div>

              {/* TOOLBAR: date range + export */}
              <div className="cc-card" style={{ padding: '16px 18px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Calendar size={17} color="var(--volt)" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>Date range</span>
                  <input type="date" className="cc-input" value={range.from} max={range.to || undefined} onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))} />
                  <span style={{ color: 'var(--muted-2)' }}>→</span>
                  <input type="date" className="cc-input" value={range.to} min={range.from || undefined} onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))} />
                  <button onClick={applyRange} className="cc-icon-btn" style={{ borderColor: 'var(--volt-2)', color: 'var(--volt)' }}>Apply</button>
                  {(range.from || range.to) && <button onClick={resetRange} className="cc-icon-btn">Reset</button>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={exportPDF} disabled={!!exporting} className="cc-btn cc-btn-pdf">
                    {exporting === 'pdf' ? <Loader size={15} className="spin" style={{ animation: 'spin .8s linear infinite' }} /> : <FileDown size={15} />} Export PDF
                  </button>
                  <button onClick={exportExcel} disabled={!!exporting} className="cc-btn cc-btn-xls">
                    {exporting === 'excel' ? <Loader size={15} style={{ animation: 'spin .8s linear infinite' }} /> : <FileSpreadsheet size={15} />} Export Excel
                  </button>
                </div>
              </div>

              {/* KPI GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 22 }}>
                {kpis.map((k, i) => {
                  const Icon = k.icon;
                  return (
                    <div key={k.label} className="cc-stat" style={{ animationDelay: `${i * 0.06}s` }}>
                      <div className="shine" />
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</div>
                          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ink)', marginTop: 6, lineHeight: 1 }}>
                            {k.decimal ? k.value : <CountUp value={k.value} />}{k.suffix || ''}
                          </div>
                        </div>
                        <div style={{ width: 42, height: 42, borderRadius: 13, background: k.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={21} color={k.c2} strokeWidth={2.2} />
                        </div>
                      </div>
                      <div style={{ marginTop: 14, height: 5, borderRadius: 99, background: 'var(--cloud-2)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pctFor(k)}%`, borderRadius: 99, background: `linear-gradient(90deg,${k.c1},${k.c2})`, transition: 'width .9s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CHARTS ROW 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
                <div className="cc-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--volt-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={17} color="var(--volt)" /></div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Tickets Over Time <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 12 }}>· 14 days</span></h3>
                  </div>
                  <div style={{ flex: 1, minHeight: 300 }}>
                    {data.timeline.length ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data.timeline} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                            <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eef6ff" vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)', fontWeight: 600 }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                          <Area type="monotone" name="Created" dataKey="count" stroke="#0284c7" strokeWidth={3} fill="url(#gCount)" activeDot={{ r: 5 }} />
                          <Area type="monotone" name="Resolved" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fill="url(#gResolved)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>No timeline data.</div>}
                  </div>
                </div>

                <div className="cc-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--volt-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={17} color="var(--volt)" /></div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Status Breakdown</h3>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {data.breakdown.some(b => b.value > 0) ? (
                      <>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={data.breakdown.filter(b => b.value > 0)} cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={4} dataKey="value" stroke="none">
                              {data.breakdown.filter(b => b.value > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px', marginTop: 10 }}>
                          {data.breakdown.filter(b => b.value > 0).map((e, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: e.color }} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>{e.name}</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>{e.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <div style={{ color: 'var(--muted)', fontSize: 13, padding: '40px 0' }}>No status data.</div>}
                  </div>
                </div>
              </div>

              {/* CHARTS ROW 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                <div className="cc-card" style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Gauge size={17} color="#d97706" /></div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>By Priority</h3>
                  </div>
                  {data.priorityBreakdown.some(b => b.value > 0) ? (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={data.priorityBreakdown} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef6ff" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)', fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'rgba(2,132,199,.06)' }} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }} />
                        <Bar dataKey="value" name="Tickets" radius={[7, 7, 0, 0]} maxBarSize={54}>
                          {data.priorityBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>No priority data.</div>}
                </div>

                <div className="cc-card" style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--volt-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={17} color="var(--volt)" /></div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>By Category</h3>
                  </div>
                  {data.categoryBreakdown.some(b => b.value > 0) ? (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart layout="vertical" data={[...data.categoryBreakdown].sort((a, b) => b.value - a.value).slice(0, 7)} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef6ff" horizontal={false} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={96} tick={{ fontSize: 11, fill: 'var(--ink-soft)', fontWeight: 600 }} />
                        <Tooltip cursor={{ fill: 'rgba(2,132,199,.06)' }} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }} />
                        <Bar dataKey="value" name="Tickets" radius={[0, 7, 7, 0]} maxBarSize={26}>
                          {[...data.categoryBreakdown].sort((a, b) => b.value - a.value).slice(0, 7).map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>No category data.</div>}
                </div>
              </div>

              

              {/* AGENT PERFORMANCE + REPORT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
                <div className="cc-card" style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--volt-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={17} color="var(--volt)" /></div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Agent Performance</h3>
                  </div>
                  {data.agentPerformance.length ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                          <th className="cc-th">Agent</th>
                          <th className="cc-th" style={{ textAlign: 'center' }}>Assigned</th>
                          <th className="cc-th" style={{ textAlign: 'center' }}>Resolved</th>
                          <th className="cc-th" style={{ textAlign: 'center' }}>Avg Hrs</th>
                        </tr></thead>
                        <tbody>
                          {data.agentPerformance.map((a, i) => (
                            <tr key={i}>
                              <td className="cc-td" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{(a.agent || '?').charAt(0)}</span>
                                  {a.agent}
                                </span>
                              </td>
                              <td className="cc-td" style={{ textAlign: 'center' }}>{a.assigned}</td>
                              <td className="cc-td" style={{ textAlign: 'center' }}>
                                <span style={{ fontWeight: 800, color: '#059669' }}>{a.resolved}</span>
                              </td>
                              <td className="cc-td" style={{ textAlign: 'center', color: 'var(--muted)' }}>{a.avgHours || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No agent activity in this range.</div>}
                </div>

                <div className="cc-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={17} color="#4f46e5" /></div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Report Preview</h3>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink-soft)', margin: '0 0 16px', background: 'var(--cloud)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>{execSummary}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Layers size={13} /> {data.tickets.length} ticket rows</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Users size={13} /> {data.agentPerformance.length} agents</span>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                    <button onClick={exportPDF} disabled={!!exporting} className="cc-btn cc-btn-pdf" style={{ flex: 1, justifyContent: 'center' }}>
                      {exporting === 'pdf' ? <Loader size={15} style={{ animation: 'spin .8s linear infinite' }} /> : <FileDown size={15} />} PDF
                    </button>
                    <button onClick={exportExcel} disabled={!!exporting} className="cc-btn cc-btn-xls" style={{ flex: 1, justifyContent: 'center' }}>
                      {exporting === 'excel' ? <Loader size={15} style={{ animation: 'spin .8s linear infinite' }} /> : <FileSpreadsheet size={15} />} Excel
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
