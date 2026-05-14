/* ── state.js — extracted StateManager for modularity ────────────────── */
'use strict';

(() => {
  const KEY      = 'os-minibook-state';
  const NUDGE_KEY= 'os-minibook-backup-nudge';
  let state = {
    theme: 'auto', sidebarOpen: window.innerWidth > 768,
    checklist: {}, bookmarks: [], highlights: [], fontSize: 16,
    mcqResults: {},    // { questionId: { correct: bool, ts } }
    readProgress: {},  // { 'unit1.html': 85, 'unit2.html': 42 } — percent scrolled
    readingMode: false
  };

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { console.warn('safeGet failed', e); return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { console.warn('safeSet failed', e); return false; }
  }

  function init() {
    try {
      const saved = safeGet(KEY);
      if (saved) state = { ...state, ...JSON.parse(saved) };

      // Migrate legacy keys
      ['os-theme','os-sidebar','os-bookmarks'].forEach(k => {
        const v = safeGet(k);
        if (!v) return;
        if (k === 'os-theme')     state.theme = v;
        if (k === 'os-sidebar')   state.sidebarOpen = v === 'open';
        if (k === 'os-bookmarks') {
          try { state.bookmarks = JSON.parse(v); } catch { state.bookmarks = []; }
        }
        try { localStorage.removeItem(k); } catch(e){}
      });

      save();
      _checkBackupNudge();
    } catch (e) { console.warn('State init error', e); }
  }

  function save() {
    try {
      const json = JSON.stringify(state);
      if (json.length > 4_500_000) {
        window.Toast?.show && window.Toast.show('⚠️ Storage nearly full — please export your data!', 'error');
      }
      safeSet(KEY, json);
    } catch (e) {
      window.Toast?.show && window.Toast.show('💾 Storage full! Export your data now.', 'error');
    }
  }

  function get(k) { return state[k]; }
  function set(k, v) { state[k] = v; save(); }

  /* MCQ */
  function setMCQResult(id, correct) {
    if (!state.mcqResults) state.mcqResults = {};
    state.mcqResults[id] = { correct, ts: Date.now() };
    save();
  }
  function getMCQStats() {
    const results = Object.values(state.mcqResults || {});
    const total   = results.length;
    const correct = results.filter(r => r.correct).length;
    return { total, correct, pct: total ? Math.round((correct/total)*100) : 0 };
  }

  /* Read progress */
  function setReadProgress(page, pct) {
    if (!state.readProgress) state.readProgress = {};
    if ((state.readProgress[page] || 0) < pct) {
      state.readProgress[page] = pct;
      save();
    }
  }
  function getReadProgress(page) { return (state.readProgress || {})[page] || 0; }
  function getAllReadProgress() { return state.readProgress || {}; }

  function _checkBackupNudge() {
    const last  = parseInt(safeGet(NUDGE_KEY) || '0', 10);
    const now   = Date.now();
    const seven = 7 * 24 * 60 * 60 * 1000;
    if (now - last > seven && Object.keys(state.bookmarks || {}).length > 0) {
      setTimeout(() => {
        window.Toast?.show && window.Toast.show('💾 It\'s been 7 days — export your notes & bookmarks for safekeeping!', 'info');
        safeSet(NUDGE_KEY, String(now));
      }, 5000);
    }
  }

  function exportData() {
    const notesData = safeGet('os-notes-v1');
    const fullExport = { state, notes: notesData ? JSON.parse(notesData) : {} };
    const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `os-minibook-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    safeSet(NUDGE_KEY, String(Date.now()));
    window.Toast?.show && window.Toast.show('✅ Full backup exported (state + notes)!', 'success');
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (parsed.state) {
            state = { ...state, ...parsed.state };
            if (parsed.notes) safeSet('os-notes-v1', JSON.stringify(parsed.notes));
          } else {
            state = { ...state, ...parsed };
          }
          save(); location.reload();
        } catch (err) { window.Toast?.show && window.Toast.show('❌ Invalid backup file!', 'error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  const API = { init, get, set, save, exportData, importData, setMCQResult, getMCQStats, setReadProgress, getReadProgress, getAllReadProgress };
  window.StateManager = API;
})();
