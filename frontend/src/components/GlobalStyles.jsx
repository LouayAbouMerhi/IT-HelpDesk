import React from 'react';

const GlobalStyles = () => (
  <style>{`
    /* 1. Imports MUST be at the absolute top of the CSS */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

    /* 2. CSS Reset */
    *, *::before, *::after { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
    }

    html, body {
      max-width: 100vw;
      overflow-x: hidden; /* Stops horizontal scrolling entirely */
    }

    /* 3. Core Design Variables */
    :root {
      /* --- Core Backgrounds --- */
      --bg: #f8fafc;          /* Main App Background */
      --bg-2: #f1f5f9;        /* Secondary Background (Bars/Empty states) */
      --surface-2: #ffffff;   /* Inner Card Backgrounds */
      
      /* --- Borders & Lines --- */
      --border: #e2e8f0;      /* Soft borders for cards and tables */
      --border-2: #cbd5e1;    /* Darker borders/scrollbars */
      
      /* --- Typography --- */
      --txt-primary: #0f172a;   /* Dark Navy for Headings */
      --txt-secondary: #334155; /* Medium Slate for body text */
      --txt-muted: #64748b;     /* Light Slate for subtext/dates */
      
      /* --- Brand Accent (Indigo) --- */
      --accent: #4f46e5;
      --accent-mid: #6366f1;
      --accent-light: #e0e7ff;
      
      /* --- Status & Chart Colors --- */
      --sky: #0ea5e9;
      --sky-light: #e0f2fe;
      
      --amber: #f59e0b;
      --amber-light: #fef3c7;
      
      --emerald: #10b981;
      --emerald-light: #d1fae5;
      
      --rose: #e11d48;
      --rose-light: #ffe4e6;
      
      /* --- Shadows --- */
      --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --shadow-accent: 0 4px 14px 0 rgba(79, 70, 229, 0.3);
      
      /* --- Fonts --- */
      --font-body: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', monospace;
    }

    /* 4. Base Elements */
    body {
      background-color: var(--bg);
      color: var(--txt-primary);
      font-family: var(--font-body);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* 5. Animations */
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; } 
      to   { opacity: 1; }
    }
    @keyframes barGrow {
      from { transform: scaleY(0); opacity: 0; }
      to   { transform: scaleY(1); opacity: 1; }
    }
    @keyframes progressFill {
      from { width: 0%; }
    }
    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: .4; transform: scale(.65); }
    }
    @keyframes floatA {
      0%, 100% { transform: translateY(0) scale(1); }
      50%      { transform: translateY(-24px) scale(1.04); }
    }
    @keyframes floatB {
      0%, 100% { transform: translateY(0) scale(1); }
      50%      { transform: translateY(20px) scale(1.03); }
    }
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(28px) scale(.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes overlayIn {
      from { opacity: 0; } 
      to   { opacity: 1; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes countUp {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* 6. Utilities & Components */
    .fade-up { animation: fadeSlideUp .45s ease both; }
    .fade-in { animation: fadeIn .3s ease both; }

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
      position: absolute; 
      left: 0; 
      top: 20%;
      bottom: 20%;
      width: 3px; 
      border-radius: 2px; 
      background: var(--accent);
      opacity: 0; 
      transition: opacity .18s;
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
      outline: none; 
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 3px rgba(79,70,229,.1);
    }

    /* 7. Custom Scrollbar */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent-mid); }

    /* 8. Specific UI Elements */
    .badge {
      display: inline-flex;
      align-items: center; 
      gap: 5px;
      padding: 3px 9px; 
      border-radius: 6px; 
      font-size: 10px; 
      font-weight: 700;
      font-family: var(--font-mono); 
      letter-spacing: .04em; 
      text-transform: uppercase;
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
      content: ''; 
      position: absolute; 
      left: 4px; 
      top: 20px; 
      bottom: 0;
      width: 1.5px; 
      background: var(--border-2); 
      z-index: 1;
    }
    .log-item:last-child::before { display: none; }
    .log-dot {
      position: absolute; 
      left: 0; 
      top: 4px; 
      width: 10px; 
      height: 10px;
      border-radius: 50%; 
      background: #fff; 
      border: 2.5px solid var(--accent);
      z-index: 2;
    }

    /* Toggle Switches */
    .toggle-container {
      position: relative;
      width: 44px;
      height: 24px;
      background-color: #cbd5e1;
      border-radius: 20px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .toggle-container.active { background-color: #10b981; }
    .toggle-handle {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background-color: white;
      border-radius: 50%;
      transition: transform 0.3s;
    }
    .toggle-container.active .toggle-handle { transform: translateX(20px); }
  `}</style>
);

export default GlobalStyles;