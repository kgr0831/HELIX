// Icons
const Icon = {
  Send: () => <svg viewBox="0 0 16 16" fill="none"><path d="M2 8L14 2L11 14L8 9L2 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  Chevron: () => <svg viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Atom: () => <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="1.5" fill="currentColor"/><ellipse cx="8" cy="8" rx="6" ry="2.4" stroke="currentColor" strokeWidth="1.1" transform="rotate(60 8 8)"/><ellipse cx="8" cy="8" rx="6" ry="2.4" stroke="currentColor" strokeWidth="1.1" transform="rotate(-60 8 8)"/></svg>,
  Plus: () => <svg viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Sidebar: () => <svg viewBox="0 0 16 16" fill="none"><rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><line x1="6.5" y1="3" x2="6.5" y2="13" stroke="currentColor" strokeWidth="1.2"/></svg>,
  Search: () => <svg viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Copy: () => <svg viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 11V4C3 3.4 3.4 3 4 3H11" stroke="currentColor" strokeWidth="1.2"/></svg>,
  Refresh: () => <svg viewBox="0 0 16 16" fill="none"><path d="M3 8C3 5.2 5.2 3 8 3C9.6 3 11 3.8 12 5M13 8C13 10.8 10.8 13 8 13C6.4 13 5 12.2 4 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M11 3V5.5H8.5M5 12.5V10H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Up: () => <svg viewBox="0 0 16 16" fill="none"><path d="M8 13V3M3.5 7.5L8 3L12.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Down: () => <svg viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3.5 8.5L8 13L12.5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Check: () => <svg viewBox="0 0 16 16" fill="none"><path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Attach: () => <svg viewBox="0 0 16 16" fill="none"><path d="M11 6.5L7 10.5C5.9 11.6 4.1 11.6 3 10.5C1.9 9.4 1.9 7.6 3 6.5L8 1.5C8.8 0.7 10.2 0.7 11 1.5C11.8 2.3 11.8 3.7 11 4.5L6 9.5C5.6 9.9 4.9 9.9 4.5 9.5C4.1 9.1 4.1 8.4 4.5 8L8.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
};

Object.assign(window, { Icon });
