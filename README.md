# ⚡ OS MiniBook — Arpit | DU B.Tech CSE Sem IV

> **Operating Systems (DSC-10)** · University of Delhi · B.Tech CSE Semester IV

A production-grade, interactive study companion for OS covering the **complete university syllabus + GATE** preparation. Built for active recall, exam readiness, and zero-prerequisite self-study.

**Audit Score: 93/100** — Complete self-sufficient single-source study system.

## 🌐 Live Site

Hosted on GitHub Pages → [`malikarpit.github.io/os-minibook`](https://malikarpit.github.io/os-minibook/)

## 📚 Content Coverage

| Unit | Label | Topics |
|------|-------|--------|
| **Unit 1** | OS Intro & Linux Kernel | OS roles, types (batch/time-sharing/RTOS), kernel architectures (monolithic/micro/hybrid), system calls (5 categories), interrupts/traps/exceptions, DMA, Linux boot (BIOS→GRUB→kernel), LKMs, virtualization, shell scripting |
| **Unit 2A** | Processes & CPU Scheduling | Process lifecycle (5 states), PCB, fork() inheritance, threads (1:1/M:1/M:N), IPC (pipe/socket/shared memory), scheduling algorithms (FCFS/SJF/SRTF/RR/Priority/MLFQ) with full Gantt traces |
| **Unit 2B** | Synchronization & Concurrency | Critical section (ME/Progress/BW), Peterson's (all 3 proofs), TSL/CAS, semaphores (counting/binary), monitors (Hoare vs Mesa), Producer-Consumer, Readers-Writers (both priority variants), Dining Philosophers |
| **Unit 2C** | Deadlocks | Coffman conditions (HEMP), RAG, safe/unsafe/deadlocked states, Banker's algorithm (safety + request, full enumeration), detection & recovery, wait-die/wound-wait |
| **Unit 3** | Memory Management | Address binding (compile/load/runtime + ASLR/PIE), contiguous allocation, fragmentation, swapping, paging (address translation, EMAT), TLB, multi-level page tables, segmentation, virtual memory, page replacement (FIFO/LRU/OPT/CLOCK + Belady's anomaly), thrashing & working set |
| **Unit 4** | File Systems & I/O | File concepts, allocation (contiguous/linked/indexed=inode), free space management, disk scheduling (FCFS/SSTF/SCAN/LOOK/C-SCAN/C-LOOK), RAID (0/1/5/6 + write penalty), buffering strategies, VFS |
| **GATE Extra** | Advanced Topics | Master formula sheet (all variants), advanced scheduling, memory deep-dive, sync traps, Banker's fast-track, page replacement numericals, disk scheduling numericals, I/O systems, protection & security, solved PYQs 2019–2024 |

## 🎓 Pedagogical Features

Every unit includes:

- **Learning Objectives** — "After this unit you will be able to…" structured checklist
- **Section Summaries** — 5-bullet Key Takeaways for rapid pre-exam revision
- **Active Recall Blocks** — 3-question retrieval prompts per major section
- **MSQ Practice** — GATE Multi-Select Questions (2-mark, partial negative marking format)
- **NAT Practice** — Numerical Answer Type drills (paging arithmetic, EMAT, scheduling formulas)
- **10-Mark Answer Guides** — Structured university exam answer templates
- **GATE Trap Sheets** — Common misconceptions with correct explanations
- **Related-Units Sidebar** — Cross-unit navigation shortcuts

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Open Search |
| `T` | Toggle Dark/Light Theme |
| `S` | Toggle Sidebar |
| `Ctrl+Shift+R` | Read Aloud (TTS) |
| `Esc` | Close Modal |

## 🛠️ Interactive Tools

- **CPU Scheduler Simulator** — Animated Gantt charts (FCFS/SJF/SRTF/RR)
- **Banker's Algorithm** — Step-through matrix simulator with safe sequence finder
- **Page Replacement Visualizer** — FIFO/LRU/Optimal frame-state trace
- **Text-to-Speech** — Section-level and global read aloud
- **Pomodoro Timer** — 25/5 focus sessions
- **Progress Dashboard** — Per-unit completion tracking (localStorage)
- **Bookmarks + Annotations** — Persistent highlighting and notes
- **Full-text Search** — Cross-chapter instant search (Ctrl+K)
- **PWA Support** — Offline reading via service worker

## 📐 Study Modes

Toggle between 3 content layers via the mode switcher:

| Mode | Shows |
|------|-------|
| 🎓 **University** | DU exam content — theory, proofs, 10-mark Q&A |
| ⚡ **GATE** | MSQ/NAT drills, trap sheets, formula cards, PYQs |
| 🔬 **Advanced** | Research depth, Linux internals, formal proofs |

## 📖 References

- Silberschatz, Galvin, Gagne — *OS Concepts, 10th Ed.*
- Andrew Tanenbaum — *Modern Operating Systems*
- *Operating Systems: Three Easy Pieces* (OSTEP) — Arpaci-Dusseau
- Robert Love — *Linux Kernel Development*
- DU Class Notes & End-Sem Papers 2019–2025

---
*Built by ⚡ Arpit · DU B.Tech CSE · 2026*
