/**
 * ⚡ Arpit | core.js — Pro Edition
 * Theme, Sidebar, Progress, Scroll-Spy, Search, Bookmarks, Keyboard, State, A11y
 * 25+ Features Integrated | Local-First Architecture
 */
'use strict';

/* ── ARPIT BRAND ─────────────────────────────────────────────────── */
console.log(
  '%c⚡ Arpit\'s OS MiniBook%c\nUniversity of Delhi · B.Tech CSE Sem IV · 2026\nBuilt with 💜 for OS mastery. Pro Edition loaded.',
  'color:#a855f7;font-size:20px;font-weight:900;letter-spacing:1px;',
  'color:#94a3b8;font-size:12px;'
);

/* ── UTILITIES (Debounce, rAF, A11y) ─────────────────────────────── */
const Utils = (() => {
  /** @param {Function} func @param {number} wait */
  const debounce = (func, wait = 300) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const safeScrollTo = (top) => window.scrollTo({ top, behavior: isReducedMotion() ? 'auto' : 'smooth' });
  return { debounce, isReducedMotion, safeScrollTo };
})();

/* StateManager now provided by assets/js/state.js - keep global alias */
const StateManager = window.StateManager;

/* ── THEME (System Sync) ───────────────────────────────────────────── */
const ThemeManager = (() => {
  const root = document.documentElement;

  function apply(themeMode) {
    let actualTheme = themeMode;
    if (themeMode === 'auto') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', actualTheme);
    StateManager.set('theme', themeMode);
    
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = actualTheme === 'dark'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
      btn.setAttribute('aria-label', `Switch theme (Current: ${actualTheme})`);
    }
  }

  function toggle() {
    const current = StateManager.get('theme');
    apply(current === 'dark' ? 'light' : 'dark'); 
  }

  function init() {
    apply(StateManager.get('theme'));
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (StateManager.get('theme') === 'auto') apply('auto');
    });
  }
  return { init, toggle, apply };
})();

/* ── SIDEBAR ───────────────────────────────────────────────────────── */
const SidebarManager = (() => {
  function apply() {
    const isOpen = StateManager.get('sidebarOpen');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('main-content');
    const overlay = document.getElementById('sidebar-overlay');
    const isMobile = window.innerWidth <= 768;
    
    if (!sidebar) return;
    sidebar.setAttribute('aria-expanded', isOpen);

    if (isMobile) {
      sidebar.classList.toggle('open', isOpen);
      if (overlay) overlay.classList.toggle('show', isOpen);
    } else {
      sidebar.classList.toggle('collapsed', !isOpen);
      if (content) content.classList.toggle('sidebar-collapsed', !isOpen);
    }
  }

  function toggle() { 
    StateManager.set('sidebarOpen', !StateManager.get('sidebarOpen')); 
    apply(); 
  }

  function init() {
    apply();
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      StateManager.set('sidebarOpen', false); apply();
    });
    
    // Debounced Resize
    window.addEventListener('resize', Utils.debounce(() => {
      if (window.innerWidth > 768 && StateManager.get('sidebarOpen') === false) {
        StateManager.set('sidebarOpen', true);
      }
      apply();
    }, 150));
  }
  return { init, toggle };
})();

/* ── PROGRESS BAR (rAF Optimized) ──────────────────────────────────── */
const ProgressBar = (() => {
  let ticking = false;
  function update() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    const el = document.documentElement;
    const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
    bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    ticking = false;
  }
  function init() {
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }
  return { init };
})();

/* ── SCROLL SPY ────────────────────────────────────────────────────── */
const ScrollSpy = (() => {
  function init() {
    const links = document.querySelectorAll('.sidebar-link[href^="#"]');
    const sections = [...links].map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
    if (!sections.length) return;

    const obs = new IntersectionObserver((entries) => {
      // Use rAF for class manipulations to avoid layout thrashing
      window.requestAnimationFrame(() => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            links.forEach(l => l.classList.remove('active'));
            const active = document.querySelector(`.sidebar-link[href="#${e.target.id}"]`);
            if (active) { active.classList.add('active'); active.scrollIntoView({ block: 'nearest' }); }
            const hdr = document.querySelector('.header-chapter-title');
            if (hdr) { hdr.textContent = e.target.querySelector('h2,h3')?.textContent || ''; hdr.classList.add('visible'); }
          }
        });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(s => obs.observe(s));
  }
  return { init };
})();

/* ── CHAPTER CHECKLIST & PROGRESS DASHBOARD ────────────────────────── */
const ChecklistManager = (() => {
  function updateDashboard() {
    const cbs = document.querySelectorAll('.chapter-checklist input[type=checkbox]');
    if (!cbs.length) return;
    const checked = Array.from(cbs).filter(cb => cb.checked).length;
    const pct = Math.round((checked / cbs.length) * 100);
    
    let dash = document.getElementById('syllabus-dashboard');
    if (!dash) {
      dash = document.createElement('div');
      dash.id = 'syllabus-dashboard';
      dash.style.cssText = 'padding:15px; margin: 10px; background:var(--bg-card); border-radius:8px; text-align:center; font-size:12px; font-weight:bold; color:var(--tx-main);';
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.insertBefore(dash, sidebar.firstChild);
    }
    dash.innerHTML = `🏆 OS Mastery: <span style="color:var(--primary)">${pct}%</span> (${checked}/${cbs.length})`;
  }

  function init() {
    const clData = StateManager.get('checklist') || {};
    document.querySelectorAll('.chapter-checklist input[type=checkbox]').forEach(cb => {
      if (clData[cb.id]) cb.checked = true;
      cb.closest('label')?.classList.toggle('done', cb.checked);
      
      cb.addEventListener('change', () => {
        clData[cb.id] = cb.checked;
        StateManager.set('checklist', clData);
        cb.closest('label')?.classList.toggle('done', cb.checked);
        Toast.show(cb.checked ? '✅ Section marked complete!' : '↩ Marked incomplete', 'success');
        updateDashboard();
      });
    });
    updateDashboard();
  }
  return { init };
})();

/* ── BOOKMARKS ─────────────────────────────────────────────────────── */
const BookmarkManager = (() => {
  function toggle(id, label) {
    let bms = StateManager.get('bookmarks');
    const idx = bms.findIndex(b => b.id === id);
    const btn = document.querySelector(`.bookmark-btn[data-id="${id}"]`);
    
    if (idx >= 0) {
      bms.splice(idx, 1);
      if (btn) { btn.classList.remove('bookmarked'); btn.title = 'Bookmark'; }
      Toast.show('🔖 Bookmark removed');
    } else {
      bms.push({ id, label, url: location.href.split('#')[0] + '#' + id, ts: Date.now() });
      if (btn) { btn.classList.add('bookmarked'); btn.title = 'Bookmarked!'; }
      Toast.show('🔖 Bookmarked!', 'success');
    }
    StateManager.set('bookmarks', bms);
    renderPanel();
  }

  function renderPanel() {
    const panel = document.getElementById('bookmarks-list');
    if (!panel) return;
    const bms = StateManager.get('bookmarks');
    panel.innerHTML = bms.length
      ? bms.map(b => `<a href="${b.url}" class="sidebar-link"><span class="link-icon">🔖</span>${b.label}</a>`).join('')
      : '<p class="text-xs text-muted" style="padding:8px 12px">No bookmarks yet.</p>';
  }

  function init() {
    const bms = StateManager.get('bookmarks');
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      const id = btn.dataset.id;
      if (bms.find(b => b.id === id)) btn.classList.add('bookmarked');
    });
    renderPanel();

    // Auto-resume via sessionStorage
    const urlKey = 'os-scroll-' + location.pathname;
    const saved = sessionStorage.getItem(urlKey);
    if (saved) setTimeout(() => Utils.safeScrollTo(+saved), 50);
    window.addEventListener('scroll', Utils.debounce(() => {
      sessionStorage.setItem(urlKey, window.scrollY);
    }, 200), { passive: true });
  }
  return { init, toggle };
})();

/* ── SEARCH & COMMAND PALETTE ──────────────────────────────────────── */
const SearchManager = (() => {
  let index = [];
  let modal, input, results;

  function buildIndex() {
    if (index.length) return; // Lazy load once
    document.querySelectorAll('[data-search-section]').forEach(section => {
      const id = section.id || '';
      const title = section.querySelector('h2,h3,h4')?.textContent || section.dataset.searchSection;
      const body = section.textContent.replace(/\s+/g, ' ');
      index.push({ id, title, body });
    });
  }

  function executeCommand(cmd) {
    const commands = {
      'toggle theme': ThemeManager.toggle,
      'toggle sidebar': SidebarManager.toggle,
      'export data': StateManager.exportData,
      'import data': StateManager.importData,
      'clear storage': () => { localStorage.clear(); location.reload(); }
    };
    
    results.innerHTML = Object.keys(commands)
      .filter(k => k.includes(cmd))
      .map(k => `<div class="search-result-item" tabindex="0" data-cmd="${k}">
        <div class="search-result-title">⚡ Run: ${k}</div>
      </div>`).join('');
  }

  function handleSearch(q) {
    if (!q.trim()) { results.innerHTML = ''; return; }
    
    // Command Palette Mode
    if (q.startsWith('>')) { return executeCommand(q.slice(1).trim().toLowerCase()); }

    const hits = index.filter(item =>
      item.title.toLowerCase().includes(q.toLowerCase()) ||
      item.body.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 12);

    results.innerHTML = hits.length ? hits.map(h => {
      const idx = h.body.toLowerCase().indexOf(q.toLowerCase());
      const snippet = idx >= 0 ? h.body.slice(Math.max(0, idx - 60), idx + 80) : h.body.slice(0, 120);
      return `<div class="search-result-item" tabindex="0" onclick="location.href='#${h.id}';SearchManager.close()">
        <div class="search-result-title">${h.title}</div>
        <div class="search-result-snippet">${snippet}…</div>
      </div>`;
    }).join('') : '<div style="padding:16px;color:var(--tx-muted);font-size:14px">No results found.</div>';
  }

  function open() { 
    modal?.classList.add('open'); 
    modal?.setAttribute('aria-hidden', 'false');
    input?.focus(); 
    buildIndex(); 
  }
  
  function close() { 
    modal?.classList.remove('open'); 
    modal?.setAttribute('aria-hidden', 'true');
    if (input) input.value = ''; 
    if (results) results.innerHTML = ''; 
  }

  function init() {
    modal = document.getElementById('search-modal');
    input = document.getElementById('search-input');
    results = document.getElementById('search-results');
    
    // Accessibility roles
    modal?.setAttribute('role', 'dialog');
    modal?.setAttribute('aria-modal', 'true');

    document.getElementById('search-btn')?.addEventListener('click', open);
    input?.addEventListener('input', Utils.debounce(e => handleSearch(e.target.value), 250));
    
    modal?.addEventListener('click', e => { if (e.target === modal) close(); });

    // Keyboard Nav inside Search
    input?.addEventListener('keydown', e => {
      const items = results.querySelectorAll('.search-result-item');
      if (!items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); items[0].focus(); }
    });

    results?.addEventListener('keydown', e => {
      if (e.target.classList.contains('search-result-item')) {
        if (e.key === 'Enter') {
          if (e.target.dataset.cmd) {
            const cmdMap = {
              'toggle theme': ThemeManager.toggle, 'toggle sidebar': SidebarManager.toggle,
              'export data': StateManager.exportData, 'import data': StateManager.importData,
            };
            cmdMap[e.target.dataset.cmd]?.(); close();
          } else { e.target.click(); }
        }
        if (e.key === 'ArrowDown') e.target.nextElementSibling?.focus();
        if (e.key === 'ArrowUp') e.target.previousElementSibling ? e.target.previousElementSibling.focus() : input.focus();
      }
    });
  }
  return { init, open, close };
})();
window.SearchManager = SearchManager;

/* ── KEYBOARD SHORTCUTS ────────────────────────────────────────────── */
const KeyboardManager = (() => {
  function init() {
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') { e.preventDefault(); SearchManager.open(); return; }
        if (e.key === 'p') { e.preventDefault(); window.PrintManager?.print(); return; }
      }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case 't': ThemeManager.toggle(); break;
        case 's': SidebarManager.toggle(); break;
        case 'f': ReadingModeManager?.toggle(); break;
        case 'escape':
          SearchManager.close();
          LightboxManager.close();
          ReadingModeManager?.toggle && document.body.classList.contains('reading-mode') && ReadingModeManager.toggle();
          break;
      }
    });
  }
  return { init };
})();

/* ── TOAST NOTIFICATIONS (A11y Friendly) ───────────────────────────── */
const Toast = (() => {
  function show(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite'); // Screen reader announcement
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='all 0.3s ease'; }, 2200);
    setTimeout(() => t.remove(), 2600);
  }
  return { show };
})();
window.Toast = Toast;

/* ── EVENT DELEGATION (Copy & Bookmarks) ───────────────────────────── */
function initDelegatedEvents() {
  document.body.addEventListener('click', e => {
    // 1. Copy Buttons
    const copyBtn = e.target.closest('.code-copy');
    if (copyBtn) {
      const pre = copyBtn.closest('.code-block')?.querySelector('pre');
      if (pre) {
        navigator.clipboard.writeText(pre.textContent).then(() => {
          copyBtn.textContent = '✓ Copied!'; copyBtn.style.color = 'var(--success)';
          setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.style.color = ''; }, 1800);
        });
      }
    }
    // 2. Bookmark Buttons
    const bmBtn = e.target.closest('.bookmark-btn');
    if (bmBtn) { BookmarkManager.toggle(bmBtn.dataset.id, bmBtn.dataset.label || bmBtn.dataset.id); }
    
    // 3. Image Zoom (Lightbox)
    const img = e.target.closest('img:not(.no-zoom)');
    if (img && !e.target.closest('#sidebar')) { LightboxManager.open(img.src, img.alt); }
  });
}

/* ── LIGHTBOX (Image Zoom) ─────────────────────────────────────────── */
const LightboxManager = (() => {
  let overlay;
  function open(src, alt) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lightbox-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;pointer-events:none;';
      overlay.innerHTML = `<img style="max-width:90%;max-height:90%;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.5);" src="" alt="">`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', close);
    }
    overlay.querySelector('img').src = src;
    overlay.querySelector('img').alt = alt;
    overlay.style.pointerEvents = 'all';
    window.requestAnimationFrame(() => overlay.style.opacity = '1');
  }
  function close() {
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
  }
  return { open, close };
})();

/* ── READING TIME ESTIMATOR ────────────────────────────────────────── */
const ReadingTimeManager = (() => {
  function init() {
    const content = document.getElementById('main-content');
    const header = document.querySelector('.header-title-area');
    if (!content || !header) return;
    
    const text = content.innerText || '';
    const wordCount = text.split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(wordCount / 220)); // Avg 220 wpm
    
    const badge = document.createElement('span');
    badge.style.cssText = 'font-size:12px; color:var(--tx-muted); margin-left: 10px; background:var(--bg-card); padding:2px 8px; border-radius:12px;';
    badge.innerHTML = `⏱️ ~${mins} min read`;
    header.appendChild(badge);
  }
  return { init };
})();

/* ── FLOATING ACTION BUTTON (Scroll to Top) ────────────────────────── */
const FABManager = (() => {
  function init() {
    const fab = document.createElement('button');
    fab.innerHTML = '↑';
    fab.setAttribute('aria-label', 'Scroll to top');
    fab.style.cssText = 'position:fixed;bottom:30px;right:90px;width:42px;height:42px;border-radius:50%;background:var(--accent);color:#fff;border:none;box-shadow:0 4px 14px rgba(124,58,237,0.4);cursor:pointer;opacity:0;transform:translateY(20px);transition:all 0.3s ease;z-index:900;pointer-events:none;font-size:18px;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(fab);

    fab.addEventListener('click', () => Utils.safeScrollTo(0));

    window.addEventListener('scroll', Utils.debounce(() => {
      if (window.scrollY > 500) {
        fab.style.opacity = '1'; fab.style.transform = 'translateY(0)'; fab.style.pointerEvents = 'all';
      } else {
        fab.style.opacity = '0'; fab.style.transform = 'translateY(20px)'; fab.style.pointerEvents = 'none';
      }
    }, 150));
  }
  return { init };
})();

/* ── FONT SIZE & HIGHLIGHTING (Basic Pro Hooks) ────────────────────── */
const DocumentEnhancer = (() => {
  function init() {
    // Apply saved Font Size
    const size = StateManager.get('fontSize');
    if (size !== 16) document.documentElement.style.setProperty('--base-font-size', `${size}px`);

    // Basic Syntax Highlighting Wrapper (Checks for PRISM/HLJS globally)
    if (window.Prism) { document.querySelectorAll('pre code').forEach(el => Prism.highlightElement(el)); }
    else if (window.hljs) { document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el)); }
  }
  return { init };
})();

/* ── SCROLL REVEAL ─────────────────────────────────────────────────── */
function initScrollReveal() {
  if (Utils.isReducedMotion()) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── OFFLINE CAPABILITY (Service Worker) ───────────────────────────── */
function initOfflineWorker() {
  if ('serviceWorker' in navigator) {
    // Resolve SW path relative to the root (works on GitHub Pages subdirs)
    const swPath = location.pathname.includes('/chapters/') || location.pathname.includes('/exams/')
      ? '../sw.js' : './sw.js';
    navigator.serviceWorker.register(swPath)
      .then(reg => {
        // Check for updates in background
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw?.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              Toast.show('🔄 MiniBook updated! Reload to get latest version.', 'info');
            }
          });
        });
      })
      .catch(e => console.warn('SW registration failed:', e));
  }
}

/* ── READING MODE ───────────────────────────────────────────────────── */
const ReadingModeManager = (() => {
  let isReading = false;

  function createExitBar() {
    if (document.getElementById('reading-exit-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'reading-exit-bar';
    bar.textContent = '📖 Reading Mode  —  Press F or click here to exit';
    bar.setAttribute('role', 'status');
    bar.addEventListener('click', toggle);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function toggle() {
    isReading = !isReading;
    document.body.classList.toggle('reading-mode', isReading);
    StateManager.set('readingMode', isReading);
    const btn = document.getElementById('reading-mode-btn');
    if (btn) btn.title = isReading ? 'Exit Reading Mode (F)' : 'Reading Mode (F)';
    if (btn) btn.setAttribute('aria-pressed', String(isReading));
    Toast.show(isReading ? '📖 Reading Mode ON — press F to exit' : '↩ Reading Mode OFF', 'info');
  }

  function init() {
    createExitBar();
    // Restore reading mode state
    if (StateManager.get('readingMode')) {
      isReading = true;
      document.body.classList.add('reading-mode');
    }
    document.getElementById('reading-mode-btn')?.addEventListener('click', toggle);
  }

  return { init, toggle };
})();
window.ReadingModeManager = ReadingModeManager;

/* ── SCROLL DEPTH TRACKER ───────────────────────────────────────────── */
function initScrollDepthTracker() {
  const page = location.pathname.split('/').pop() || 'index.html';
  window.addEventListener('scroll', Utils.debounce(() => {
    const el  = document.documentElement;
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    if (pct > 5) StateManager.setReadProgress(page, pct);
  }, 1000), { passive: true });
}

/* ── ARPIT HIDDEN MARKS (every ~12 lines via data attrs) ───────────── */
function embedArpitMarks() {
  const sections = document.querySelectorAll('section, .mode-uni, .mode-gate, .mode-adv, .prose');
  sections.forEach((el, i) => { if (i % 3 === 0) el.setAttribute('data-a', '⚡arpit-pro'); });
}

/* ── INIT SEQUENCE ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  StateManager.init();
  ThemeManager.init();
  SidebarManager.init();
  ProgressBar.init();
  ScrollSpy.init();
  SearchManager.init();
  KeyboardManager.init();
  ChecklistManager.init();
  BookmarkManager.init();
  ReadingModeManager.init();
  initDelegatedEvents();
  initScrollReveal();
  initScrollDepthTracker();
  ReadingTimeManager.init();
  FABManager.init();
  DocumentEnhancer.init();
  embedArpitMarks();
  initOfflineWorker();

  // Button hooks
  document.getElementById('sidebar-toggle')?.addEventListener('click', SidebarManager.toggle);
  document.getElementById('theme-toggle')?.addEventListener('click', ThemeManager.toggle);

  // Export/Import from search command palette
  window._stateExport = () => StateManager.exportData();
  window._stateImport = () => StateManager.importData();
});