// ⚡ Arpit | modes.js — University / GATE / Advanced / All toggle

const ModeManager = (() => {
  const KEY = 'os-mode';
  let current = localStorage.getItem(KEY) || 'all';

  const MODES = {
    all:      { label: '📚 All',        sel: null,          hide: [] },
    uni:      { label: '🎓 University', sel: '.mode-uni',   hide: ['.mode-gate', '.mode-adv'] },
    gate:     { label: '⚡ GATE',       sel: '.mode-gate',  hide: ['.mode-uni',  '.mode-adv'] },
    advanced: { label: '🔬 Advanced',   sel: '.mode-adv',   hide: ['.mode-uni',  '.mode-gate'] },
  };

  function apply(mode) {
    current = mode;
    localStorage.setItem(KEY, mode);

    // Show/hide content divs
    if (mode === 'all') {
      document.querySelectorAll('.mode-uni, .mode-gate, .mode-adv').forEach(el => el.classList.remove('mode-hidden'));
    } else {
      const { hide } = MODES[mode];
      document.querySelectorAll('.mode-uni, .mode-gate, .mode-adv').forEach(el => el.classList.remove('mode-hidden'));
      hide.forEach(sel => document.querySelectorAll(sel).forEach(el => el.classList.add('mode-hidden')));
    }

    // Filter exam papers
    if (mode === 'uni')  { showPapers('uni'); }
    if (mode === 'gate') { showPapers('gate'); }
    if (mode === 'all' || mode === 'advanced') { showPapers('all'); }

    // Update buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update sidebar indicator
    const indicator = document.getElementById('mode-indicator');
    if (indicator) {
      const colors = { all:'var(--accent-light)', uni:'var(--uni-c)', gate:'var(--gate-c)', advanced:'var(--adv-c)' };
      indicator.textContent = MODES[mode]?.label || '📚 All';
      indicator.style.color  = colors[mode] || 'var(--accent-light)';
    }

    // Toast notification
    if (window.Toast) Toast.show(`Mode: ${MODES[mode]?.label || mode}`, 'info');
  }

  function showPapers(mode) {
    document.querySelectorAll('[data-paper-type]').forEach(el => {
      if (mode === 'all') { el.classList.remove('mode-hidden'); return; }
      el.classList.toggle('mode-hidden', el.dataset.paperType !== mode);
    });
  }

  function init() {
    // Wire up floating panel buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => apply(btn.dataset.mode));
    });
    apply(current);
  }

  return { init, apply, get: () => current };
})();

window.ModeManager = ModeManager;
document.addEventListener('DOMContentLoaded', () => ModeManager.init());
