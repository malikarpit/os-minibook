// ⚡ Arpit | timer-ui.js — Complete UI Layer
// SVG Ring · Modals · Toasts · Goal Bar · Analytics · Settings · ARIA
// Enhanced: idempotent init, safer bindings, error resilience
'use strict';

window.PomoUI = (() => {
  const CIRCUMFERENCE = 2 * Math.PI * 88; // r=88 → ≈552.92
  let _initialized = false;

  // ── Utilities ─────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const fmt = sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── SVG Ring ──────────────────────────────────────────────────────────────
  function _initRing() {
    const ring = $('ring-progress');
    if (ring) ring.style.strokeDasharray = CIRCUMFERENCE;
  }

  function _setRingProgress(fraction, phase) {
    const ring = $('ring-progress');
    if (!ring) return;
    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, fraction)));
    const color = phase === 'work' ? 'var(--accent)'
                : phase === 'short_break' ? 'var(--green)'
                : 'var(--teal)';
    ring.style.stroke = color;
  }

  // ── Phase helpers ─────────────────────────────────────────────────────────
  function _phaseLabel(phase, sessions) {
    if (phase === 'work')        return `⏰ FOCUS · #${sessions + 1}`;
    if (phase === 'short_break') return '☕ SHORT BREAK';
    return '🌿 LONG BREAK';
  }

  // ── Session dots (progress toward long break) ─────────────────────────────
  function _renderDots(sessions, limit) {
    const filled = sessions % limit;
    for (let i = 0; i < 4; i++) {
      const dot = $(`dot-${i}`);
      if (!dot) continue;
      dot.classList.toggle('dot-filled', i < filled);
    }
  }

  // ── Main render ───────────────────────────────────────────────────────────
  function _render(state) {
    const settings  = window.PomoSettings.get();
    const duration  = state.phase === 'work'        ? settings.workDuration
                    : state.phase === 'short_break' ? settings.shortBreak
                    :                                 settings.longBreak;
    const fraction  = state.remaining / duration;

    // Time display
    const timeEl = $('pomo-time');
    if (timeEl) timeEl.textContent = fmt(state.remaining);

    // Phase label
    const labelEl = $('pomo-label');
    if (labelEl) {
      labelEl.textContent = _phaseLabel(state.phase, state.sessions);
      labelEl.dataset.phase = state.phase;
    }

    // Ring
    _setRingProgress(fraction, state.phase);

    // Start/pause button
    const btn = $('pomo-start');
    if (btn) {
      btn.textContent = state.running ? '⏸ Pause' : '▶ Start';
      btn.setAttribute('aria-label', state.running ? 'Pause timer' : 'Start timer');
      btn.dataset.running = state.running ? '1' : '';
    }

    // Session dots
    _renderDots(state.sessions, settings.sessionsBeforeLongBreak);

    // Body class for theme shift
    document.body.dataset.phase = state.phase;

    // Tab / document title
    const icon  = state.phase === 'work' ? '⏰' : '☕';
    const pause = state.running ? '' : '⏸ ';
    document.title = `${pause}${fmt(state.remaining)} ${icon} Pomodoro`;

    // ARIA live timer (update every 60s to avoid spam)
    const liveEl = $('pomo-time-live');
    if (liveEl && state.remaining % 60 === 0) {
      liveEl.textContent = `${Math.floor(state.remaining / 60)} minutes remaining`;
    }
  }

  // ── Goal bar ──────────────────────────────────────────────────────────────
  function _renderGoal(stats) {
    const goalText = $('pomo-goal-text');
    const goalFill = $('pomo-goal-fill');
    const streakEl = $('pomo-streak');
    if (goalText) goalText.textContent = `${stats.today} / ${stats.goal} sessions`;
    if (goalFill) goalFill.style.width = `${stats.goalProgress * 100}%`;
    if (streakEl) streakEl.textContent = `🔥 ${stats.streak.current}`;
  }

  // ── Toast system ──────────────────────────────────────────────────────────
  function showToast(message, type = 'info') {
    const container = $('pomo-toasts');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  // ── Distraction modal ─────────────────────────────────────────────────────
  function _showDistractionModal(onConfirm) {
    const modal = $('pomo-distraction-modal');
    if (!modal) { onConfirm(); return; }
    modal.hidden = false;
    const okBtn = modal.querySelector('#distraction-ok');
    const skipBtn = modal.querySelector('#distraction-skip');
    if (okBtn) okBtn.onclick = () => { modal.hidden = true; onConfirm(); };
    if (skipBtn) skipBtn.onclick = () => { modal.hidden = true; onConfirm(); };
  }

  // ── Settings modal ────────────────────────────────────────────────────────
  function _openSettings() {
    _populateSettings();
    const modal = $('pomo-settings-modal');
    if (modal) modal.hidden = false;
  }

  function _closeSettings() {
    const modal = $('pomo-settings-modal');
    if (modal) modal.hidden = true;
  }

  function _populateSettings() {
    const s = window.PomoSettings.get();
    _setRange('set-work',          s.workDuration / 60,       'val-work',         v => v);
    _setRange('set-short',         s.shortBreak   / 60,       'val-short',        v => v);
    _setRange('set-long',          s.longBreak    / 60,       'val-long',         v => v);
    _setRange('set-sessions-long', s.sessionsBeforeLongBreak, 'val-sessions-long',v => v);
    _setRange('set-goal',          s.sessionGoal,             'val-goal',         v => v);
    _setRange('set-volume',        s.volume,                  'val-volume',       v => Math.round(v * 100));

    const cb = (id, val) => { const el = $(id); if (el) el.checked = val; };
    cb('set-autostart',   s.autoStart);
    cb('set-distraction', s.distractionPrompt);

    document.querySelectorAll('.sound-opt').forEach(b =>
      b.classList.toggle('active', b.dataset.sound === s.sound)
    );
  }

  function _setRange(inputId, value, labelId, displayFn) {
    const input = $(inputId), label = $(labelId);
    if (input) input.value = value;
    if (label) label.textContent = displayFn(value);
  }

  function _bindSettings() {
    // Range sliders
    const ranges = [
      { id: 'set-work',          label: 'val-work',          key: 'workDuration',            mul: 60, fmt: v => v },
      { id: 'set-short',         label: 'val-short',         key: 'shortBreak',              mul: 60, fmt: v => v },
      { id: 'set-long',          label: 'val-long',          key: 'longBreak',               mul: 60, fmt: v => v },
      { id: 'set-sessions-long', label: 'val-sessions-long', key: 'sessionsBeforeLongBreak', mul: 1,  fmt: v => v },
      { id: 'set-goal',          label: 'val-goal',          key: 'sessionGoal',             mul: 1,  fmt: v => v },
      { id: 'set-volume',        label: 'val-volume',        key: 'volume',                  mul: 1,  fmt: v => Math.round(v * 100) },
    ];
    ranges.forEach(({ id, label, key, mul, fmt: fmtFn }) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        const labelEl = $(label);
        if (labelEl) labelEl.textContent = fmtFn(v);
        window.PomoSettings.set({ [key]: v * mul });
      });
    });

    // Checkboxes
    $('set-autostart')?.addEventListener('change', e =>
      window.PomoSettings.set({ autoStart: e.target.checked })
    );
    $('set-distraction')?.addEventListener('change', e =>
      window.PomoSettings.set({ distractionPrompt: e.target.checked })
    );

    // Sound buttons
    document.querySelectorAll('.sound-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sound-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.PomoSettings.set({ sound: btn.dataset.sound });
        window.PomoNotifications.preview(btn.dataset.sound);
      });
    });

    // Notification permission
    $('set-notif')?.addEventListener('click', async () => {
      const ok = await window.PomoNotifications.requestPermission();
      showToast(ok ? '✅ Notifications enabled!' : '❌ Permission denied', ok ? 'success' : 'error');
    });

    // Reset defaults
    $('set-reset-defaults')?.addEventListener('click', () => {
      window.PomoSettings.reset();
      _populateSettings();
      showToast('Settings reset to defaults', 'info');
    });

    // Open / close
    $('pomo-btn-settings')?.addEventListener('click', _openSettings);
    $('settings-close')?.addEventListener('click', _closeSettings);
    $('pomo-settings-modal')?.addEventListener('click', e => {
      if (e.target.id === 'pomo-settings-modal') _closeSettings();
    });
  }

  // ── Analytics modal ───────────────────────────────────────────────────────
  function _openAnalytics() {
    _renderAnalytics(window.PomoAnalytics.getStats());
    const modal = $('pomo-analytics-modal');
    if (modal) modal.hidden = false;
  }

  function _closeAnalytics() {
    const modal = $('pomo-analytics-modal');
    if (modal) modal.hidden = true;
  }

  function _renderAnalytics(stats) {
    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set('stat-today',  stats.today);
    set('stat-focus',  stats.todayFocusMinutes + 'm');
    set('stat-streak', stats.streak.current);
    set('stat-best',   stats.streak.longest);
    set('stat-total',  stats.total);

    // Week bar chart
    const chart = $('week-chart');
    if (chart && stats.week) {
      const maxVal = Math.max(...stats.week.map(d => d.count), 1);
      chart.innerHTML = stats.week.map(({ label, count }) => {
        const pct = Math.round((count / maxVal) * 100);
        const isToday = label === new Date().toLocaleDateString('en', { weekday: 'short' });
        return `
          <div class="week-bar-wrap">
            <div class="week-bar-col">
              <div class="week-bar ${isToday ? 'week-bar-today' : ''}"
                   style="height:${pct}%"
                   title="${count} session${count !== 1 ? 's' : ''}">
                ${count > 0 ? `<span class="week-bar-count">${count}</span>` : ''}
              </div>
            </div>
            <div class="week-day ${isToday ? 'week-day-today' : ''}">${label}</div>
          </div>`;
      }).join('');
    }

    // Goal ring
    const goalPct = $('stat-goal-pct');
    const goalRing = $('stat-goal-ring');
    if (goalPct) goalPct.textContent = `${Math.round(stats.goalProgress * 100)}%`;
    if (goalRing) {
      const r   = 28;
      const circ = 2 * Math.PI * r;
      goalRing.style.strokeDasharray  = circ;
      goalRing.style.strokeDashoffset = circ * (1 - stats.goalProgress);
    }
  }

  function _bindAnalytics() {
    $('pomo-btn-stats')?.addEventListener('click', _openAnalytics);
    $('analytics-close')?.addEventListener('click', _closeAnalytics);
    $('pomo-analytics-modal')?.addEventListener('click', e => {
      if (e.target.id === 'pomo-analytics-modal') _closeAnalytics();
    });
    $('export-csv')?.addEventListener('click',  () => window.PomoAnalytics.exportCSV());
    $('export-json')?.addEventListener('click', () => window.PomoAnalytics.exportJSON());
    $('clear-history')?.addEventListener('click', () => {
      if (confirm('Clear all session history and streak? This cannot be undone.')) {
        window.PomoAnalytics.clearHistory();
        _renderAnalytics(window.PomoAnalytics.getStats());
        showToast('Session history cleared', 'info');
      }
    });
  }

  // ── Main controls ─────────────────────────────────────────────────────────
  function _bindControls() {
    $('pomo-start')?.addEventListener('click', () => {
      const state = window.PomoTimer.getState();
      if (!state.running && state.phase === 'work' && window.PomoSettings.get('distractionPrompt')) {
        _showDistractionModal(() => window.PomoTimer.start());
      } else {
        window.PomoTimer.toggle();
      }
    });
    $('pomo-reset')?.addEventListener('click', () => window.PomoTimer.reset());
    $('pomo-skip')?.addEventListener('click',  () => window.PomoTimer.skipPhase());

    // Space key routed through bus (so it respects the distraction prompt)
    PomoBus.on('ui:toggle_requested', () => {
      const state = window.PomoTimer.getState();
      if (!state.running && state.phase === 'work' && window.PomoSettings.get('distractionPrompt')) {
        _showDistractionModal(() => window.PomoTimer.start());
      } else {
        window.PomoTimer.toggle();
      }
    });
  }

  // ── Bus subscriptions ─────────────────────────────────────────────────────
  function _bindBus() {
    PomoBus.on('timer:tick',    _render);
    PomoBus.on('timer:start',   _render);
    PomoBus.on('timer:pause',   _render);
    PomoBus.on('timer:reset',   _render);
    PomoBus.on('timer:ready',   _render);

    PomoBus.on('timer:phase_change', state => {
      _render(state);
      const msg = state.phase === 'work'        ? '⏰ Back to work!'
                : state.phase === 'short_break' ? '☕ Short break!'
                :                                 '🌿 Long break — you earned it!';
      showToast(msg, state.phase === 'work' ? 'info' : 'success');
    });

    PomoBus.on('analytics:updated', stats => {
      _renderGoal(stats);
      const modal = $('pomo-analytics-modal');
      if (modal && !modal.hidden) _renderAnalytics(stats);
    });

    PomoBus.on('analytics:streak_updated', streak => {
      if (streak.current > 1) showToast(`🔥 ${streak.current}-day streak!`, 'success');
    });
  }

  // ── Collapsible widget ─────────────────────────────────────────────────────
  function _initCollapsible() {
    const widget = document.getElementById('pomodoro');
    const card   = document.getElementById('pomo-card');
    if (!widget || !card) return;

    const CKEY = 'pomo-collapsed';
    let collapsed = localStorage.getItem(CKEY) === '1';

    // Create toggle pill button
    const toggleBtn = document.createElement('button');
    // ── Button lives on WIDGET (not card) so it stays visible when card is hidden
    toggleBtn.id = 'pomo-collapse-btn';
    toggleBtn.title = 'Collapse / Expand timer';
    toggleBtn.style.cssText = [
      'position:absolute;top:-14px;left:50%;transform:translateX(-50%)',
      'width:40px;height:20px;border-radius:99px',
      'background:var(--surface,#141416);border:1px solid rgba(255,255,255,.15)',
      'color:var(--text-muted,#77758a);font-size:10px;cursor:pointer',
      'display:flex;align-items:center;justify-content:center',
      'box-shadow:0 2px 8px rgba(0,0,0,.5);z-index:20;transition:all .2s',
      'pointer-events:all'
    ].join(';');

    // Widget must be positioned so the absolute button works
    widget.style.position = widget.style.position || 'fixed';
    widget.style.overflow = 'visible';
    widget.appendChild(toggleBtn); // ← on WIDGET, not card

    // Inject one-time collapsed styles
    if (!document.getElementById('pomo-collapse-style')) {
      const st = document.createElement('style');
      st.id = 'pomo-collapse-style';
      st.textContent = `
        #pomodoro.pomo-collapsed #pomo-card { display: none !important; }
        #pomodoro.pomo-collapsed {
          width: auto !important; min-width: unset !important;
          padding: 8px 16px !important;
          background: var(--bg-elevated, #1c1c21) !important;
          border: 1px solid rgba(255,255,255,.12) !important;
          border-radius: 99px !important;
          cursor: pointer;
        }
        #pomo-pill-time { display: none; font-family: monospace; font-size: 13px;
          color: var(--accent, #7c3aed); font-weight: 700; letter-spacing: .05em; white-space: nowrap; }
        #pomodoro.pomo-collapsed #pomo-pill-time { display: inline !important; }
        #pomo-collapse-btn { transition: transform .2s; }
        #pomodoro.pomo-collapsed #pomo-collapse-btn { transform: translateX(-50%) rotate(180deg); }
      `;
      document.head.appendChild(st);
    }

    // Create pill time label
    let pill = document.getElementById('pomo-pill-time');
    if (!pill) {
      pill = document.createElement('span');
      pill.id = 'pomo-pill-time';
      widget.appendChild(pill);
    }

    function applyState() {
      widget.classList.toggle('pomo-collapsed', collapsed);
      toggleBtn.title = collapsed ? 'Expand timer' : 'Collapse timer';
      const st = window.PomoTimer?.getState();
      if (pill) pill.textContent = st ? `⏰ ${fmt(st.remaining)}` : '⏰ 25:00';
      localStorage.setItem(CKEY, collapsed ? '1' : '0');
    }

    // Clicking the pill area also expands
    widget.addEventListener('click', (e) => {
      if (collapsed && e.target !== toggleBtn) { collapsed = false; applyState(); }
    });

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      collapsed = !collapsed;
      applyState();
    });

    // Update pill time on tick
    PomoBus.on('timer:tick', (state) => {
      if (pill && collapsed) pill.textContent = `📍 ${fmt(state.remaining)}`;
    });

    applyState();
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;
    try {
      _initRing();
      _bindControls();
      _bindSettings();
      _bindAnalytics();
      _bindBus();
      _initCollapsible();
    } catch (e) {
      console.error('[PomoUI] init error:', e);
    }
  }

  return { init, showToast };
})();

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.PomoAnalytics.init();
    window.PomoNotifications.init();
    window.PomoTimer.init();
    window.PomoUI.init();
  } catch (e) {
    console.error('[PomoUI] bootstrap error:', e);
  }
});
