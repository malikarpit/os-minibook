/**
 * ⚡ Arpit | notes.js — OS MiniBook 2026
 * NotesManager: Inline text annotations, persistent via localStorage
 * Enhanced: sanitization, debounce, export/import, error boundaries, JSDoc
 */
'use strict';

const NotesManager = (() => {
  const STORE_KEY = 'os-notes-v1';
  let notes = {};        // { noteId: { text, noteText, page, color, ts } }
  let popover = null;
  let addBtn = null;
  let currentRange = null;
  let currentText = '';

  const COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa'];
  const PAGE = location.pathname.split('/').pop() || 'index';

  /* ── STORAGE ─────────────────────────────────────────────── */
  function load() {
    try { notes = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { notes = {}; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(notes)); } catch(e) {
      if (window.Toast) Toast.show('Note storage full!', 'error');
    }
  }

  /* ── ID from text ────────────────────────────────────────── */
  function makeId(text) {
    return 'n-' + [...text.slice(0,40)].reduce((a,c) => ((a<<5)-a)+c.charCodeAt(0)|0, 0).toString(36).replace('-','x');
  }

  /* ── Sanitization (prevent XSS) ──────────────────────────── */
  function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ── Debounce utility (render once per burst) ────────────── */
  function debounce(fn, wait = 300) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }
  const debouncedRenderMarks = debounce(() => renderAllNoteMarks(), 500);

  /* ── SELECTION POPOVER ───────────────────────────────────── */
  function createAddBtn() {
    addBtn = document.createElement('button');
    addBtn.id = 'note-add-btn';
    addBtn.innerHTML = '✏️ Add Note';
    addBtn.setAttribute('aria-label', 'Add note to selection');
    document.body.appendChild(addBtn);
    addBtn.addEventListener('click', openNotePopover);
  }

  function showAddBtn(rect) {
    if (!addBtn) createAddBtn();
    addBtn.style.top  = `${rect.top + window.scrollY - 44}px`;
    addBtn.style.left = `${rect.left + rect.width/2}px`;
    addBtn.classList.add('visible');
  }

  function hideAddBtn() {
    addBtn?.classList.remove('visible');
  }

  /* ── NOTE POPOVER ────────────────────────────────────────── */
  function openNotePopover() {
    if (popover) popover.remove();
    hideAddBtn();

    const noteId = makeId(currentText);
    const existing = notes[noteId];

    popover = document.createElement('div');
    popover.id = 'note-popover';
    popover.innerHTML = `
      <div class="note-pop-header">
        <span>📝 Note</span>
        <button id="note-pop-close" aria-label="Close">✕</button>
      </div>
      <div class="note-pop-quote">"${sanitizeHTML(currentText.slice(0, 80))}${currentText.length > 80 ? '…' : ''}"</div>
      <textarea id="note-pop-text" placeholder="Write your note here…" rows="4">${sanitizeHTML(existing?.noteText || '')}</textarea>
      <div class="note-pop-colors">
        ${COLORS.map(c => `<button class="note-color-btn ${existing?.color===c?'active':''}" data-color="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}
      </div>
      <div class="note-pop-actions">
        <button id="note-pop-save" class="note-btn-primary">💾 Save</button>
        ${existing ? `<button id="note-pop-delete" class="note-btn-danger">🗑 Delete</button>` : ''}
      </div>
    `;

    // Position near selection
    if (currentRange) {
      const rect = currentRange.getBoundingClientRect();
      popover.style.top  = `${rect.bottom + window.scrollY + 8}px`;
      popover.style.left = `${Math.min(rect.left, window.innerWidth - 320)}px`;
    }

    document.body.appendChild(popover);

    // Color picker
    let selectedColor = existing?.color || COLORS[0];
    popover.querySelectorAll('.note-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        popover.querySelectorAll('.note-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
      });
    });

    document.getElementById('note-pop-close').addEventListener('click', closePopover);
    document.getElementById('note-pop-save').addEventListener('click', () => {
      const text = document.getElementById('note-pop-text').value.trim();
      if (!text) { closePopover(); return; }
      saveNote(noteId, currentText, text, selectedColor);
      closePopover();
    });
    document.getElementById('note-pop-delete')?.addEventListener('click', () => {
      deleteNote(noteId);
      closePopover();
    });

    setTimeout(() => popover?.querySelector('textarea')?.focus(), 50);
  }

  function closePopover() {
    popover?.remove();
    popover = null;
    currentRange = null;
    currentText = '';
  }

  /* ── SAVE / DELETE ───────────────────────────────────────── */
  function saveNote(noteId, selectedText, noteText, color) {
    try {
      notes[noteId] = { selectedText, noteText: noteText.trim(), color, page: PAGE, ts: Date.now() };
      save();
      debouncedRenderMarks();
      renderSidebarPanel();
      if (window.Toast) Toast.show('📝 Note saved!', 'success');
    } catch (e) {
      console.error('saveNote error:', e);
      if (window.Toast) Toast.show('❌ Failed to save note', 'error');
    }
  }

  function deleteNote(noteId) {
    try {
      delete notes[noteId];
      save();
      debouncedRenderMarks();
      renderSidebarPanel();
      if (window.Toast) Toast.show('🗑 Note deleted');
    } catch (e) {
      console.error('deleteNote error:', e);
      if (window.Toast) Toast.show('❌ Failed to delete note', 'error');
    }
  }

  /* ── MARK ANNOTATED TEXT ─────────────────────────────────── */
  let isMarking = false;
  function renderAllNoteMarks() {
    if (isMarking) return; // Guard: skip if already rendering
    try {
      isMarking = true;
      // Remove existing marks
      document.querySelectorAll('.note-mark').forEach(el => {
        const parent = el.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent), el);
          parent.normalize();
        }
      });

      const main = document.getElementById('main-content');
      if (!main) return;

      Object.entries(notes).forEach(([noteId, note]) => {
        if (note.page !== PAGE) return;
        markText(main, note.selectedText, noteId, note.color, note.noteText);
      });
    } catch (e) {
      console.error('renderAllNoteMarks error:', e);
    } finally {
      isMarking = false;
    }
  }

  function markText(container, searchText, noteId, color, noteText) {
    if (!searchText || searchText.length < 3) return;
    try {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      for (const node of nodes) {
        if (!node.textContent) continue;
        const idx = node.textContent.indexOf(searchText);
        if (idx === -1) continue;
        // Skip if already inside a mark
        if (node.parentElement?.classList.contains('note-mark')) continue;
        // Skip sidebar/header/popovers
        if (node.parentElement?.closest('#sidebar,#main-header,#note-popover')) continue;

        const before = document.createTextNode(node.textContent.slice(0, idx));
        const mark   = document.createElement('mark');
        mark.className = 'note-mark';
        mark.textContent = searchText;
        mark.style.setProperty('--note-color', color);
        mark.dataset.noteId = noteId;
        mark.title = `📝 ${noteText}`;
        mark.setAttribute('tabindex', '0');
        mark.setAttribute('aria-label', `Note: ${noteText}`);
        const after = document.createTextNode(node.textContent.slice(idx + searchText.length));

        if (node.parentNode) {
          node.parentNode.insertBefore(before, node);
          node.parentNode.insertBefore(mark, node);
          node.parentNode.insertBefore(after, node);
          node.parentNode.removeChild(node);
        }

        // Click to edit
        mark.addEventListener('click', e => {
          currentText = searchText;
          openNotePopoverForExisting(noteId, mark);
        });
        break; // Only mark first occurrence
      }
    } catch (e) {
      console.error('markText error:', e);
    }
  }

  function openNotePopoverForExisting(noteId, markEl) {
    if (popover) popover.remove();
    const note = notes[noteId];
    if (!note) return;
    currentText = note.selectedText;
    currentRange = null;

    popover = document.createElement('div');
    popover.id = 'note-popover';
    const rect = markEl.getBoundingClientRect();
    popover.style.top  = `${rect.bottom + window.scrollY + 8}px`;
    popover.style.left = `${Math.min(rect.left, window.innerWidth - 320)}px`;

    popover.innerHTML = `
      <div class="note-pop-header">
        <span>📝 Edit Note</span>
        <button id="note-pop-close" aria-label="Close">✕</button>
      </div>
      <div class="note-pop-quote">"${sanitizeHTML(note.selectedText.slice(0,80))}${note.selectedText.length>80?'…':''}"</div>
      <textarea id="note-pop-text" rows="4">${sanitizeHTML(note.noteText)}</textarea>
      <div class="note-pop-colors">
        ${COLORS.map(c => `<button class="note-color-btn ${note.color===c?'active':''}" data-color="${c}" style="background:${c}"></button>`).join('')}
      </div>
      <div class="note-pop-actions">
        <button id="note-pop-save" class="note-btn-primary">💾 Save</button>
        <button id="note-pop-delete" class="note-btn-danger">🗑 Delete</button>
      </div>
    `;
    document.body.appendChild(popover);

    let selectedColor = note.color;
    popover.querySelectorAll('.note-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        popover.querySelectorAll('.note-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
      });
    });

    document.getElementById('note-pop-close').addEventListener('click', closePopover);
    document.getElementById('note-pop-save').addEventListener('click', () => {
      const text = document.getElementById('note-pop-text').value.trim();
      if (!text) { closePopover(); return; }
      saveNote(noteId, note.selectedText, text, selectedColor);
      closePopover();
    });
    document.getElementById('note-pop-delete').addEventListener('click', () => {
      deleteNote(noteId);
      closePopover();
    });
    setTimeout(() => popover?.querySelector('textarea')?.focus(), 50);
  }

  /* ── SIDEBAR PANEL ───────────────────────────────────────── */
  function renderSidebarPanel() {
    const panel = document.getElementById('notes-sidebar-list');
    if (!panel) return;
    const pageNotes = Object.entries(notes).filter(([,n]) => n.page === PAGE);
    if (!pageNotes.length) {
      panel.innerHTML = '<p class="text-xs text-muted" style="padding:8px 12px">No notes on this page yet.</p>';
      return;
    }
    panel.innerHTML = pageNotes
      .sort((a,b) => b[1].ts - a[1].ts)
      .map(([id, n]) => `
        <div class="note-sidebar-item" data-id="${id}">
          <div class="note-sidebar-color" style="background:${n.color}"></div>
          <div class="note-sidebar-body">
            <div class="note-sidebar-quote">"${n.selectedText.slice(0,40)}${n.selectedText.length>40?'…':''}"</div>
            <div class="note-sidebar-text">${n.noteText.slice(0,60)}${n.noteText.length>60?'…':''}</div>
          </div>
        </div>
      `).join('');
  }

  /* ── GLOBAL NOTES PAGE (for progress.html) ───────────────── */
  /**
   * Get all notes for current page or all pages
   * @returns {Object} notes object { noteId: { selectedText, noteText, color, page, ts } }
   */
  function getAllNotes() { return notes; }

  /**
   * Export notes to JSON file (standalone backup)
   */
  function exportNotes() {
    try {
      const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `os-notes-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (window.Toast) Toast.show('📥 Notes exported!', 'success');
    } catch (e) {
      console.error('exportNotes error:', e);
      if (window.Toast) Toast.show('❌ Export failed', 'error');
    }
  }

  /**
   * Import notes from JSON file
   */
  function importNotes() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const imported = JSON.parse(ev.target.result);
            notes = { ...notes, ...imported }; // Merge
            save();
            renderSidebarPanel();
            debouncedRenderMarks();
            if (window.Toast) Toast.show('📤 Notes imported!', 'success');
          } catch (err) {
            if (window.Toast) Toast.show('❌ Invalid file!', 'error');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (e) {
      console.error('importNotes error:', e);
    }
  }

  /* ── SELECTION LISTENER ──────────────────────────────────── */
  function initSelectionListener() {
    document.addEventListener('mouseup', e => {
      // Ignore if clicking inside popover or note btn
      if (e.target.closest('#note-popover, #note-add-btn')) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { hideAddBtn(); return; }

      const text = sel.toString().trim();
      if (text.length < 3 || text.length > 500) { hideAddBtn(); return; }

      // Must be inside main content
      const range = sel.getRangeAt(0);
      if (!range.commonAncestorContainer.closest?.('#main-content') &&
          !range.commonAncestorContainer.parentElement?.closest('#main-content')) {
        hideAddBtn(); return;
      }

      currentText  = text;
      currentRange = range.cloneRange();
      showAddBtn(range.getBoundingClientRect());
    });

    // Close popover on outside click
    document.addEventListener('mousedown', e => {
      if (!e.target.closest('#note-popover, #note-add-btn, .note-mark')) {
        closePopover();
        if (!e.target.closest('#main-content')) hideAddBtn();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closePopover(); hideAddBtn(); }
    });
  }

  /* ── INIT ────────────────────────────────────────────────── */
  /**
   * Initialize NotesManager: load from storage, set up listeners, render marks
   */
  function init() {
    try {
      load();
      initSelectionListener();
      renderAllNoteMarks();
      renderSidebarPanel();
    } catch (e) {
      console.error('NotesManager init error:', e);
    }
  }

  return { init, getAllNotes, deleteNote, exportNotes, importNotes };
})();

window.NotesManager = NotesManager;
document.addEventListener('DOMContentLoaded', () => NotesManager.init());
