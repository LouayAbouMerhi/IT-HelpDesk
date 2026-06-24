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

    /* 3. Core Design Variables  —  Soft White & Sky Blue */
    :root {
      /* --- Core Backgrounds --- */
      --bg: #f3f9ff;          /* Main App Background (soft sky white) */
      --bg-2: #e9f3fe;        /* Secondary Background (Bars/Empty states) */
      --surface-2: #ffffff;   /* Inner Card Backgrounds */

      /* --- Borders & Lines --- */
      --border: #e1eefc;      /* Soft sky borders for cards and tables */
      --border-2: #c5dcf6;    /* Darker borders/scrollbars */

      /* --- Typography --- */
      --txt-primary: #102a43;   /* Deep navy-blue for Headings */
      --txt-secondary: #334e68; /* Medium slate-blue for body text */
      --txt-muted: #627d98;     /* Soft slate-blue for subtext/dates */

      /* --- Brand Accent (Sky Blue) --- */
      --accent: #0284c7;
      --accent-mid: #0ea5e9;
      --accent-light: #e0f2fe;

      /* --- Status & Chart Colors --- */
      --sky: #0ea5e9;
      --sky-light: #e0f2fe;

      --amber: #f59e0b;
      --amber-light: #fef3c7;

      --emerald: #10b981;
      --emerald-light: #d1fae5;

      --rose: #e11d48;
      --rose-light: #ffe4e6;

      /* --- Shadows (soft sky-tinted) --- */
      --shadow-sm: 0 2px 8px -2px rgba(2,132,199,0.12), 0 1px 3px rgba(16,42,67,0.06);
      --shadow-lg: 0 18px 40px -12px rgba(2,132,199,0.28), 0 8px 16px -8px rgba(16,42,67,0.12);
      --shadow-accent: 0 8px 22px 0 rgba(14,165,233,0.38);

      /* --- Fonts --- */
      --font-body: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', monospace;
    }

    /* 4. Base Elements — animated soft sky-blue aurora background */
    body {
      background-color: var(--bg);
      background-image:
        radial-gradient(900px circle at 8% -5%, rgba(14,165,233,0.10), transparent 45%),
        radial-gradient(800px circle at 98% 0%, rgba(56,189,248,0.10), transparent 42%),
        radial-gradient(900px circle at 50% 110%, rgba(125,211,252,0.12), transparent 48%);
      background-attachment: fixed;
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
    @keyframes popIn {
      0%   { opacity: 0; transform: translateY(14px) scale(.96); }
      60%  { opacity: 1; transform: translateY(-3px) scale(1.01); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
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
    @keyframes shine {
      0%   { transform: translateX(-120%) skewX(-18deg); }
      100% { transform: translateX(260%) skewX(-18deg); }
    }
    @keyframes iconFloat {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-4px); }
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(14,165,233,0.45); }
      50%      { box-shadow: 0 0 0 8px rgba(14,165,233,0); }
    }

    /* 6. Utilities & Components */
    .fade-up { animation: fadeSlideUp .5s ease both; }
    .fade-in { animation: fadeIn .3s ease both; }

    /* Lively staggered card entrance + animated icon + shine sweep */
    .stat-card {
      animation: popIn .55s cubic-bezier(.34,1.56,.64,1) both;
      transition: transform .25s ease, box-shadow .25s ease;
      cursor: default;
      position: relative;
      overflow: hidden;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 40%; height: 100%;
      background: linear-gradient(120deg, transparent, rgba(255,255,255,.55), transparent);
      transform: translateX(-120%) skewX(-18deg);
      pointer-events: none;
    }
    .stat-card:hover::after { animation: shine .9s ease; }
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-lg);
    }
    .stat-card:hover > div:last-child { animation: iconFloat 1.4s ease-in-out infinite; }

    /* Stagger the cards as they appear */
    .stats-grid .stat-card:nth-child(1) { animation-delay: .04s; }
    .stats-grid .stat-card:nth-child(2) { animation-delay: .12s; }
    .stats-grid .stat-card:nth-child(3) { animation-delay: .20s; }
    .stats-grid .stat-card:nth-child(4) { animation-delay: .28s; }
    .stats-grid .stat-card:nth-child(5) { animation-delay: .36s; }
    .stats-grid .stat-card:nth-child(6) { animation-delay: .44s; }

    .ticket-row {
      transition: background .18s, transform .18s;
      cursor: pointer;
    }
    .ticket-row:hover {
      background: var(--sky-light) !important;
      transform: translateX(2px);
    }
    .ticket-row:hover .t-title { color: var(--accent) !important; }

    .nav-item {
      transition: background .18s, color .18s, transform .18s;
      position: relative;
    }
    .nav-item:hover { transform: translateX(2px); }
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
      box-shadow: 0 0 0 3px rgba(14,165,233,.14);
    }

    /* 7. Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 4px; }
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
    .detail-grid-row:hover { background: var(--sky-light); }

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
