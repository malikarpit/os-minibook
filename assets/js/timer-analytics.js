// ⚡ Arpit | timer-analytics.js — Session Analytics & Export
'use strict';

window.PomoAnalytics = (() => {
  const HISTORY_KEY = 'pomo_history';
  const STREAK_KEY  = 'pomo_streak';
  const MAX_ENTRIES = 2000;

  let _history = [];   // array of session entry objects
  let _streak  = { current: 0, longest: 0, lastDate: null };

  // ── Storage ───────────────────────────────────────────────────────────────
  function _saveHistory() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(_history.slice(-MAX_ENTRIES))); } catch (_) {}
  }
  function _saveStreak() {
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(_streak)); } catch (_) {}
  }
  function _loadHistory() {
    try { _history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (_) { _history = []; }
  }
  function _loadStreak() {
    try {
      _streak = JSON.parse(localStorage.getItem(STREAK_KEY) || 'null')
             || { current: 0, longest: 0, lastDate: null };
    } catch (_) { _streak = { current: 0, longest: 0, lastDate: null }; }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _todayKey() { return new Date().toISOString().slice(0, 10); }

  function _dateKey(msSinceEpoch) {
    return new Date(msSinceEpoch).toISOString().slice(0, 10);
  }

  // ── Streak logic ──────────────────────────────────────────────────────────
  function _updateStreak() {
    const today     = _todayKey();
    if (_streak.lastDate === today) return; // already credited today

    const yesterday = _dateKey(Date.now() - 86400000);
    _streak.current = (_streak.lastDate === yesterday) ? _streak.current + 1 : 1;
    _streak.longest = Math.max(_streak.longest, _streak.current);
    _streak.lastDate = today;
    _saveStreak();
    PomoBus.emit('analytics:streak_updated', { ..._streak });
  }

  // ── Record ────────────────────────────────────────────────────────────────
  function recordSession(data) {
    const entry = {
      id:        Date.now() + Math.random(), // unique enough
      phase:     data.phase,
      date:      _todayKey(),
      timestamp: data.timestamp || Date.now(),
      sessions:  data.sessions || 0,
      skipped:   data.skipped  || false,
    };
    _history.push(entry);
    _saveHistory();

    if (data.phase === 'work' && !data.skipped) _updateStreak();

    PomoBus.emit('analytics:updated', getStats());
  }

  // ── Queries ───────────────────────────────────────────────────────────────
  function getTodaySessions() {
    const today = _todayKey();
    return _history.filter(e => e.date === today && e.phase === 'work' && !e.skipped);
  }

  function getWeekData() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const key   = _dateKey(Date.now() - i * 86400000);
      const label = new Date(key + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
      const count = _history.filter(e => e.date === key && e.phase === 'work' && !e.skipped).length;
      days.push({ date: key, label, count });
    }
    return days;
  }

  function getStats() {
    const todayDone  = getTodaySessions().length;
    const goal       = window.PomoSettings.get('sessionGoal');
    const workSec    = window.PomoSettings.get('workDuration');
    const allWork    = _history.filter(e => e.phase === 'work' && !e.skipped);
    return {
      today:             todayDone,
      goal,
      goalProgress:      Math.min(todayDone / goal, 1),
      todayFocusMinutes: Math.floor(todayDone * workSec / 60),
      streak:            { ..._streak },
      week:              getWeekData(),
      total:             allWork.length,
    };
  }

  // ── Export ────────────────────────────────────────────────────────────────
  function exportCSV() {
    const header = ['ID', 'Date', 'Phase', 'Timestamp_ISO', 'Sessions_Cumulative', 'Skipped'];
    const rows   = _history.map(e => [
      e.id, e.date, e.phase,
      new Date(e.timestamp).toISOString(),
      e.sessions, e.skipped,
    ]);
    _download('pomo-history.csv',
      [header, ...rows].map(r => r.join(',')).join('\n'),
      'text/csv');
  }

  function exportJSON() {
    _download('pomo-history.json',
      JSON.stringify({ exportedAt: new Date().toISOString(), stats: getStats(), history: _history }, null, 2),
      'application/json');
  }

  function _download(filename, content, type) {
    const a = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(new Blob([content], { type })),
      download: filename,
    });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  function clearHistory() {
    _history = [];
    _streak  = { current: 0, longest: 0, lastDate: null };
    _saveHistory(); _saveStreak();
    PomoBus.emit('analytics:updated', getStats());
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    _loadHistory();
    _loadStreak();
    PomoBus.on('analytics:session_end', recordSession);
    // Emit initial stats so UI can populate on load
    PomoBus.emit('analytics:updated', getStats());
  }

  return { init, getStats, getTodaySessions, exportCSV, exportJSON, clearHistory };
})();
