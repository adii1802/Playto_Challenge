/**
 * ReviewerQueue.jsx
 * Route: /reviewer/queue
 *
 * Shows:
 * - Metrics row (queue count, avg hours, 7-day approval rate)
 * - Table of submitted/under_review applications, oldest first
 * - AT RISK badge (red) when at_risk === true
 * - Click any row → /reviewer/application/:id
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ─── tiny helpers ────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function StatusBadge({ status }) {
  const palette = {
    submitted: { bg: '#1f3a5f', text: '#58a6ff', label: 'Submitted' },
    under_review: { bg: '#3d2a0a', text: '#d29922', label: 'Under Review' },
    approved: { bg: '#1a3a2a', text: '#3fb950', label: 'Approved' },
    rejected: { bg: '#3a1a1a', text: '#f85149', label: 'Rejected' },
    more_info_requested: { bg: '#2a1f3d', text: '#bc8cff', label: 'More Info' },
    draft: { bg: '#222', text: '#8b949e', label: 'Draft' },
  };
  const p = palette[status] || { bg: '#222', text: '#8b949e', label: status };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: p.bg, color: p.text }}
    >
      {p.label}
    </span>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div
      className="flex-1 rounded-xl p-5 border"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ReviewerQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [qRes, mRes] = await Promise.all([
        api.get('/reviewer/queue/'),
        api.get('/reviewer/metrics/'),
      ]);
      setQueue(qRes.data);
      setMetrics(mRes.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load data';
      setError(msg);
      if (err.response?.status === 403) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleLogout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>Playto KYC</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#1f3a5f', color: '#58a6ff' }}>
            Reviewer
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchData}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:border-blue-500"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ color: 'var(--red)' }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Review Queue</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Applications awaiting review, sorted oldest first.
          </p>
        </div>

        {/* ── Metrics row ─────────────────────────────────────────────────── */}
        {metrics && (
          <div className="flex gap-4 mb-8">
            <MetricCard
              label="In Queue"
              value={metrics.queue_count}
              sub="submitted + under review"
            />
            <MetricCard
              label="Avg. Time in Queue"
              value={metrics.avg_time_in_queue_hours != null ? `${metrics.avg_time_in_queue_hours}h` : '—'}
              sub="since submission"
            />
            <MetricCard
              label="7-Day Approval Rate"
              value={metrics.approval_rate_last_7_days != null ? `${metrics.approval_rate_last_7_days}%` : '—'}
              sub="of closed applications"
            />
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm border" style={{ background: '#2d1a1a', borderColor: '#5a2020', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Merchant', 'Status', 'Submitted', 'SLA'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    <div className="inline-flex flex-col items-center gap-3">
                      <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                      </svg>
                      Loading queue…
                    </div>
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    ✓ Queue is empty
                  </td>
                </tr>
              ) : (
                queue.map((app, i) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/reviewer/application/${app.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1f2937'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)'}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      #{app.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{app.merchant_name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{app.merchant_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {fmtDate(app.submitted_at)}
                    </td>
                    <td className="px-4 py-3">
                      {app.at_risk ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse"
                          style={{ background: '#3a1a1a', color: 'var(--red)' }}
                        >
                          ⚠ AT RISK
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
