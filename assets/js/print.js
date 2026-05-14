/**
 * ⚡ Arpit | print.js — OS MiniBook 2026
 * PrintManager: Clean PDF/Print export with DOM preparation & restore
 */
'use strict';

const PrintManager = (() => {
  let _openDetails = [];
  let _originalTitle = '';
  let _initialized = false;
  let _cleanupTimer = null;
  let _afterPrintHandler = null;

  /** Expand all collapsed details/summary elements so they print fully */
  function expandAll() {
    _openDetails = [];
    document.querySelectorAll('details').forEach(el => {
      if (!el.open) {
        _openDetails.push(el);
        el.open = true;
      }
    });
  }

  /** Restore details to their pre-print state */
  function restoreDetails() {
    _openDetails.forEach(el => { el.open = false; });
    _openDetails = [];
  }

  /** Inject a clean print header into the page */
  function injectPrintHeader() {
    const existing = document.getElementById('print-header-inject');
    if (existing) existing.remove();

    const chapterTitle = document.querySelector('.chapter-title, h1.chapter-title')?.textContent
      || document.querySelector('h1')?.textContent
      || document.title;

    const now = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const div = document.createElement('div');
    div.id = 'print-header-inject';
    div.innerHTML = `
      <div class="print-book-header">
        <div class="print-logo">A⚡ OS MiniBook</div>
        <div class="print-meta">University of Delhi · B.Tech CSE Sem IV · 2026 · Arpit</div>
      </div>
      <h1 class="print-chapter-title">${chapterTitle}</h1>
      <div class="print-date">Exported: ${now}</div>
      <hr class="print-divider">
    `;
    const main = document.getElementById('main-content');
    if (main) main.insertBefore(div, main.firstChild);
  }

  /** Remove the injected print header */
  function removePrintHeader() {
    document.getElementById('print-header-inject')?.remove();
  }

  /** Main print trigger */
  function print() {
    if (document.body.classList.contains('print-mode')) return;

    // 1. Set a custom print title
    _originalTitle = document.title;
    const chTitle = document.querySelector('.chapter-title, h1')?.textContent || 'OS MiniBook';
    document.title = `${chTitle} — OS MiniBook ⚡ Arpit`;

    // 2. Prepare DOM
    expandAll();
    injectPrintHeader();
    document.body.classList.add('print-mode');

    // 3. Show toast
    if (window.Toast) Toast.show('🖨️ Opening print dialog…', 'info');

    // 4. Trigger print after a short delay so CSS reflows finish
    setTimeout(() => {
      const cleanup = () => {
        if (_cleanupTimer) {
          clearTimeout(_cleanupTimer);
          _cleanupTimer = null;
        }
        restoreDetails();
        removePrintHeader();
        document.body.classList.remove('print-mode');
        document.title = _originalTitle;
        if (_afterPrintHandler) {
          window.removeEventListener('afterprint', _afterPrintHandler);
          _afterPrintHandler = null;
        }
      };
      _afterPrintHandler = cleanup;
      window.addEventListener('afterprint', _afterPrintHandler);

      window.print();

      // Fallback cleanup in case afterprint doesn't fire (some browsers)
      _cleanupTimer = setTimeout(cleanup, 3000);
    }, 350);
  }

  function init() {
    if (_initialized) return;
    _initialized = true;

    const btn = document.getElementById('print-btn');
    if (btn && !btn.dataset.printBound) {
      btn.dataset.printBound = '1';
      btn.addEventListener('click', print);
    }

    // Keyboard shortcut: Ctrl+P overridden to use our clean version
    if (!document.body.dataset.printShortcutBound) {
      document.body.dataset.printShortcutBound = '1';
      document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
          e.preventDefault();
          print();
        }
      });
    }
  }

  return { init, print };
})();

window.PrintManager = PrintManager;
document.addEventListener('DOMContentLoaded', () => PrintManager.init());
