// Barrel: re-export plain tokens from styles.js + JSX components defined here.
// Every page imports from '../styles.jsx' (or '../../styles.jsx').
export * from './styles';

import React from 'react';
import { STATUS } from './styles';

export function StatusBadge({ status, style = {} }) {
  const s = STATUS[status] || STATUS.draft;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '9999px',
      fontSize: '12px', fontWeight: '600',
      background: s.bg, color: s.text, ...style,
    }}>
      {s.label}
    </span>
  );
}

export function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <svg style={{ width: 28, height: 28, color: '#6366F1' }}
        className="animate-spin" fill="none" viewBox="0 0 24 24">
        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
    </div>
  );
}

