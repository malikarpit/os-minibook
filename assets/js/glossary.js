/**
 * ⚡ Arpit | glossary.js — OS MiniBook 2026
 * GlossaryManager: Auto-detects OS terms on page and shows tooltip definitions
 */
'use strict';

const GlossaryManager = (() => {
  const TERMS = {
    'PCB': 'Process Control Block — kernel data structure storing all info about a process (PID, state, registers, memory maps, open files).',
    'TLB': 'Translation Lookaside Buffer — a CPU cache for virtual→physical page table translations. A TLB hit avoids accessing RAM for address translation.',
    'MMU': 'Memory Management Unit — hardware unit that translates virtual addresses to physical addresses using page tables.',
    'IPC': 'Inter-Process Communication — mechanisms for processes to share data: Pipes, Shared Memory, Message Queues, Signals, Sockets.',
    'FCFS': 'First Come, First Served — CPU scheduling: processes run in arrival order. Non-preemptive. Suffers from the Convoy Effect.',
    'SJF': 'Shortest Job First — picks the process with the smallest burst time. Optimal for average waiting time (non-preemptive).',
    'SRTF': 'Shortest Remaining Time First — preemptive version of SJF. Preempts current process if a new shorter job arrives.',
    'MLFQ': 'Multi-Level Feedback Queue — multiple priority queues with aging. Processes move between queues based on CPU usage history.',
    'CFS': 'Completely Fair Scheduler — Linux\'s default CPU scheduler. Tracks virtual runtime (vruntime) per process and always picks the lowest.',
    'deadlock': 'A state where a set of processes are each waiting for a resource held by another, forming a circular wait. Requires all 4 Coffman conditions.',
    'starvation': 'A process is indefinitely delayed because higher-priority processes keep pre-empting it. Fixed by Aging (gradually increasing priority).',
    'aging': 'Technique to prevent starvation: gradually increase the priority of waiting processes over time until they run.',
    'semaphore': 'An integer variable with atomic wait()/signal() operations. Used for mutual exclusion and synchronization between processes/threads.',
    'mutex': 'Mutual Exclusion lock — a binary semaphore. Only the thread that locked it can unlock it. Prevents concurrent access to critical sections.',
    'monitor': 'High-level synchronization construct: encapsulates shared data + mutual exclusion + condition variables in one abstraction.',
    'thrashing': 'When a process spends more time swapping pages in/out than executing, causing near-zero CPU utilization. Caused by insufficient frames.',
    'paging': 'Memory management that splits physical memory into fixed-size frames and logical memory into pages. Eliminates external fragmentation.',
    'segmentation': 'Memory management using variable-size segments (code, data, stack). Allows logical grouping but causes external fragmentation.',
    'demand paging': 'Pages are only loaded into memory when accessed (on page fault). Reduces memory usage; basis for virtual memory.',
    'page fault': 'Exception when a process accesses a page not currently in RAM. OS handles it by loading the page from disk (swap space).',
    'LRU': 'Least Recently Used — page replacement algorithm: evict the page not used for the longest time. Optimal approximation; costly to implement exactly.',
    'FIFO': 'First In First Out — replace the oldest page in memory. Simple but suffers from Belady\'s Anomaly.',
    'Belady\'s Anomaly': 'Paradox in FIFO: adding more physical frames can INCREASE page faults. Does not occur in LRU or Optimal.',
    'fork': 'System call that duplicates the calling process. Returns 0 in child, child\'s PID in parent. Child gets a copy-on-write copy of parent\'s address space.',
    'exec': 'System call that replaces current process image with a new program. Used after fork() to run a different program in the child.',
    'zombie': 'A terminated process whose PCB still exists because the parent hasn\'t called wait() yet. Holds no memory but occupies a PID.',
    'orphan': 'A process whose parent has terminated. Automatically re-parented to init (PID 1) by Linux, which calls wait() on it.',
    'context switch': 'The OS saves the current process state (PCB) and loads another process\'s state. Pure overhead — no user work is done during this.',
    'critical section': 'Code region that accesses shared resources. Only one process may execute it at a time. Protected by locks/semaphores.',
    'race condition': 'Bug where output depends on the unpredictable order of concurrent operations on shared data. Prevented by synchronization primitives.',
    'deadlock prevention': 'Eliminate at least one Coffman condition: no hold-and-wait, no circular wait, preemption allowed, or resource ordering.',
    'Banker\'s algorithm': 'Deadlock avoidance algorithm by Dijkstra. Simulates resource allocation to check if a safe sequence exists before granting requests.',
    'safe state': 'A system state where there exists at least one sequence (safe sequence) where all processes can complete without deadlock.',
    'inode': 'Index Node — Unix filesystem data structure storing file metadata: size, owner, permissions, timestamps, and direct/indirect block pointers.',
    'virtual memory': 'Abstraction that gives each process its own large address space, larger than physical RAM, using demand paging and disk swap.',
    'COW': 'Copy-on-Write — after fork(), child and parent share pages until either writes. On write, OS creates a private copy of that page only.',
    'ASLR': 'Address Space Layout Randomisation — Linux randomizes base addresses of stack/heap/libraries at startup to defeat buffer overflow exploits.',
    'spinlock': 'A lock where the waiting thread continuously polls ("spins") until the lock is free. Low latency but wastes CPU. Good for short critical sections.',
    'busy waiting': 'A process consumes CPU cycles while waiting for a condition (e.g., polling in a loop). Wasteful; better to block and be woken by an interrupt.',
    'dispatcher': 'OS component that performs the actual context switch after the scheduler picks the next process. Dispatcher latency = context switch time.',
    'throughput': 'Number of processes completed per unit time. A key CPU scheduling metric to maximize.',
    'turnaround time': 'TAT = Completion Time − Arrival Time. Total time from submission to completion of a process.',
    'waiting time': 'WT = TAT − Burst Time. Time a process spends in the ready queue waiting for the CPU.',
    'response time': 'Time from submission until first CPU response. RT = First Start − Arrival Time. Critical for interactive systems.',
    'preemptive': 'Scheduling that can interrupt a running process and give CPU to another. Enables better responsiveness but needs synchronization.',
    'non-preemptive': 'Scheduling that lets a process run until it terminates or blocks voluntarily. Simpler but can cause long waiting times.',
    'Round Robin': 'Preemptive scheduling with a fixed time quantum. Each process gets one quantum per turn. No starvation; higher overhead than FCFS.',
    'priority scheduling': 'Each process has a priority; CPU goes to highest-priority process. Can be preemptive or non-preemptive. Risk: starvation of low-priority jobs.',
    'SCAN': 'Disk scheduling: arm moves in one direction servicing requests, then reverses. Like an elevator. Also called Elevator algorithm.',
    'SSTF': 'Shortest Seek Time First — disk scheduling: service the request nearest the current head position. May cause starvation for far requests.',
  };

  let tooltip = null;
  let hideTimer = null;
  let initialized = false;
  const IGNORED = new Set(['SCRIPT','STYLE','CODE','PRE','TEXTAREA','INPUT','KBD','MARK']);

  function sanitizeText(value) {
    const el = document.createElement('div');
    el.textContent = value;
    return el.textContent || '';
  }

  /* ── CREATE TOOLTIP ─────────────────────────────────────── */
  function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.id = 'glossary-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);

    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    tooltip.addEventListener('mouseleave', () => scheduleHide());
  }

  function showTooltip(term, def, rect) {
    if (!tooltip) createTooltip();
    clearTimeout(hideTimer);

    tooltip.replaceChildren();
    const termEl = document.createElement('div');
    termEl.className = 'gloss-term';
    termEl.textContent = sanitizeText(term);
    const defEl = document.createElement('div');
    defEl.className = 'gloss-def';
    defEl.textContent = sanitizeText(def);
    tooltip.append(termEl, defEl);
    tooltip.classList.add('visible');

    // Position above the word
    const tw = tooltip.offsetWidth || 280;
    let left = rect.left + window.scrollX;
    let top  = rect.top  + window.scrollY - tooltip.offsetHeight - 10;

    // Clamp to viewport
    if (left + tw > window.innerWidth - 16) left = window.innerWidth - tw - 16;
    if (left < 8) left = 8;
    if (top < window.scrollY + 8) top = rect.bottom + window.scrollY + 8;

    tooltip.style.left = `${left}px`;
    tooltip.style.top  = `${top}px`;
  }

  function scheduleHide() {
    hideTimer = setTimeout(() => tooltip?.classList.remove('visible'), 220);
  }

  /* ── SCAN & WRAP ─────────────────────────────────────────── */
  function wrapTerms(container) {
    // Sort terms longest-first to avoid partial matches (e.g. "SRTF" before "SJF")
    const sortedTerms = Object.keys(TERMS).sort((a,b) => b.length - a.length);

    // Build one big regex (case-sensitive word-boundary match)
    // Escape special chars, join with |
    const escaped = sortedTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = new RegExp(`\\b(${escaped.join('|')})\\b`, 'g');

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodesToProcess = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent) continue;
      if (IGNORED.has(parent.tagName)) continue;
      if (parent.closest('#sidebar,#main-header,#note-popover,#glossary-tooltip,.glossary-term,.bookmark-btn')) continue;
      if (re.test(node.textContent)) nodesToProcess.push(node);
      re.lastIndex = 0;
    }

    nodesToProcess.forEach(node => {
      const frag = document.createDocumentFragment();
      let last = 0;
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(node.textContent)) !== null) {
        // Plain text before match
        if (m.index > last) frag.appendChild(document.createTextNode(node.textContent.slice(last, m.index)));

        const span = document.createElement('span');
        span.className = 'glossary-term';
        span.textContent = m[0];
        span.dataset.term = m[0];
        span.setAttribute('tabindex', '0');
        span.setAttribute('aria-describedby', 'glossary-tooltip');
        frag.appendChild(span);
        last = m.index + m[0].length;
      }
      if (last < node.textContent.length) frag.appendChild(document.createTextNode(node.textContent.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ── EVENT DELEGATION ────────────────────────────────────── */
  function initEvents() {
    if (document.body.dataset.glossaryEventsBound === '1') return;
    document.body.dataset.glossaryEventsBound = '1';

    document.addEventListener('mouseover', e => {
      const span = e.target.closest('.glossary-term');
      if (!span) return;
      const term = span.dataset.term;
      const def  = TERMS[term];
      if (!def) return;
      showTooltip(term, def, span.getBoundingClientRect());
    });

    document.addEventListener('mouseout', e => {
      if (e.target.closest('.glossary-term')) scheduleHide();
    });

    // Keyboard support
    document.addEventListener('keydown', e => {
      if (e.target.classList.contains('glossary-term') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        const term = e.target.dataset.term;
        const def  = TERMS[term];
        if (def) showTooltip(term, def, e.target.getBoundingClientRect());
      }
      if (e.key === 'Escape') tooltip?.classList.remove('visible');
    });
  }

  function init() {
    if (initialized) return;
    initialized = true;
    const main = document.getElementById('main-content');
    if (!main) return;
    if (main.dataset.glossaryInitialized === '1') return;
    main.dataset.glossaryInitialized = '1';
    // Defer to avoid blocking initial render
    requestIdleCallback ? requestIdleCallback(() => { wrapTerms(main); initEvents(); }, { timeout: 2000 })
                        : setTimeout(() => { wrapTerms(main); initEvents(); }, 800);
  }

  return { init };
})();

window.GlossaryManager = GlossaryManager;
document.addEventListener('DOMContentLoaded', () => GlossaryManager.init());
