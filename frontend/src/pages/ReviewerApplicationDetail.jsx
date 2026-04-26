/**
 * ReviewerApplicationDetail.jsx
 * Route: /reviewer/application/:id
 *
 * Shows:
 * - Personal details, business details
 * - Document links (PDF → new tab, images → inline preview)
 * - Review history (past actions + reasons), newest first
 * - Three action buttons: Approve / Reject / Request More Info
 *   Each opens a modal with a reason textarea before confirming.
 * - On success → redirect back to queue
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'medium' }).format(new Date(iso));
}

function StatusBadge({ status }) {
  const palette = {
    submitted: { bg: '#1f3a5f', text: '#58a6ff', label: 'Submitted' },
    under_review: { bg: '#3d2a0a', text: '#d29922', label: 'Under Review' },
    approved: { bg: '#1a3a2a', text: '#3fb950', label: 'Approved' },
    rejected: { bg: '#3a1a1a', text: '#f85149', label: 'Rejected' },
    more_info_requested: { bg: '#2a1f3d', text: '#bc8cff', label: 'More Info Requested' },
    draft: { bg: '#222', text: '#8b949e', label: 'Draft' },
  };
  const p = palette[status] || { bg: '#222', text: '#8b949e', label: status };
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold" style={{ background: p.bg, color: p.text }}>
      {p.label}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border p-6 mb-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

// ─── Action modal ─────────────────────────────────────────────────────────────

function ActionModal({ action, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');

  const config = {
    approved: { label: 'Approve Application', color: '#3fb950', bg: '#1a3a2a', requireReason: false },
    rejected: { label: 'Reject Application', color: '#f85149', bg: '#3a1a1a', requireReason: true },
    more_info_requested: { label: 'Request More Information', color: '#bc8cff', bg: '#2a1f3d', requireReason: true },
  }[action];

  const canSubmit = !loading && (!config.requireReason || reason.trim().length >= 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
      >
        <h3 className="text-lg font-bold mb-1">{config.label}</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          {config.requireReason ? 'A reason is required.' : 'You may optionally add a note.'}
        </p>

        <textarea
          rows={4}
          placeholder="Enter your reason here…"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none mb-5"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!canSubmit}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-opacity"
            style={{
              background: config.bg,
              color: config.color,
              border: `1px solid ${config.color}`,
              opacity: canSubmit ? 1 : 0.4,
            }}
          >
            {loading ? 'Submitting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document preview ─────────────────────────────────────────────────────────

function DocCard({ doc }) {
  const isImage = doc.file && /\.(jpg|jpeg|png)(\?|$)/i.test(doc.file);
  const isPdf = doc.file && /\.pdf(\?|$)/i.test(doc.file);
  const label = { pan: 'PAN', aadhaar: 'Aadhaar', bank_statement: 'Bank Statement' }[doc.doc_type] || doc.doc_type;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
      {isImage ? (
        <a href={doc.file} target="_blank" rel="noopener noreferrer">
          <img src={doc.file} alt={label} className="w-full h-40 object-cover" />
        </a>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center gap-3" style={{ background: '#1a1f2e' }}>
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#f85149' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <a
            href={doc.file}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium px-3 py-1 rounded-lg"
            style={{ background: '#2a1a1a', color: '#f85149', border: '1px solid #5a2020' }}
          >
            Open PDF ↗
          </a>
        </div>
      )}
      <div className="px-3 py-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Uploaded {fmtDate(doc.uploaded_at)}</p>
      </div>
    </div>
  );
}

// ─── Review history ───────────────────────────────────────────────────────────

function ReviewHistory({ actions }) {
  const actionColors = {
    approved: '#3fb950',
    rejected: '#f85149',
    more_info_requested: '#bc8cff',
    under_review: '#d29922',
  };
  if (!actions || actions.length === 0) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No review actions yet.</p>;
  }
  return (
    <div className="space-y-3">
      {actions.map(a => (
        <div key={a.id} className="flex gap-4 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div
            className="w-2 rounded-full self-stretch shrink-0"
            style={{ background: actionColors[a.action] || 'var(--text-muted)' }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold uppercase" style={{ color: actionColors[a.action] || 'var(--text-muted)' }}>
                {a.action.replace(/_/g, ' ')}
              </span>
              <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{fmtDate(a.created_at)}</span>
            </div>
            {a.reason && <p className="text-xs break-words" style={{ color: 'var(--text-primary)' }}>{a.reason}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

const TERMINAL_STATUSES = ['approved', 'rejected'];

export default function ReviewerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAction, setActiveAction] = useState(null); // 'approved' | 'rejected' | 'more_info_requested'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchApp = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reviewer/application/${id}/`);
      setApp(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load application';
      setError(msg);
      if (err.response?.status === 403) { localStorage.clear(); navigate('/login'); }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  async function handleAction(reason) {
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/reviewer/application/${id}/action/`, {
        action: activeAction,
        reason,
      });
      setActiveAction(null);
      navigate('/reviewer/queue');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Action failed';
      setActionError(msg);
      setActionLoading(false);
    }
  }

  const isTerminal = app && TERMINAL_STATUSES.includes(app.status);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--red)' }}>{error}</p>
          <button onClick={() => navigate('/reviewer/queue')} style={{ color: 'var(--accent)' }}>← Back to queue</button>
        </div>
      </div>
    );
  }

  if (!app) return null;

  const pd = app.personal_detail;
  const bd = app.business_detail;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* modal */}
      {activeAction && (
        <ActionModal
          action={activeAction}
          onConfirm={handleAction}
          onCancel={() => { setActiveAction(null); setActionError(''); }}
          loading={actionLoading}
        />
      )}

      {/* header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reviewer/queue')}
            className="text-xs flex items-center gap-1 font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Queue
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm font-semibold">Application #{id}</span>
          <StatusBadge status={app.status} />
          {app.at_risk && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse" style={{ background: '#3a1a1a', color: '#f85149' }}>
              ⚠ AT RISK
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* action error */}
        {actionError && (
          <div className="mb-5 px-4 py-3 rounded-lg text-sm border" style={{ background: '#2d1a1a', borderColor: '#5a2020', color: 'var(--red)' }}>
            {actionError}
          </div>
        )}

        {/* Personal */}
        <Section title="Personal Details">
          {pd ? (
            <div className="grid grid-cols-3 gap-4">
              <Field label="Full Name" value={pd.name} />
              <Field label="Email" value={pd.email} />
              <Field label="Phone" value={pd.phone} />
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not provided yet.</p>
          )}
        </Section>

        {/* Business */}
        <Section title="Business Details">
          {bd ? (
            <div className="grid grid-cols-3 gap-4">
              <Field label="Business Name" value={bd.business_name} />
              <Field label="Business Type" value={bd.business_type} />
              <Field label="Monthly Volume (USD)" value={bd.monthly_volume_usd ? `$${Number(bd.monthly_volume_usd).toLocaleString()}` : '—'} />
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not provided yet.</p>
          )}
        </Section>

        {/* Documents */}
        <Section title={`Documents (${app.documents?.length ?? 0})`}>
          {app.documents?.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {app.documents.map(doc => <DocCard key={doc.id} doc={doc} />)}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No documents uploaded.</p>
          )}
        </Section>

        {/* Review History */}
        <Section title="Review History">
          <ReviewHistory actions={app.review_actions} />
        </Section>

        {/* Action buttons */}
        {!isTerminal && (
          <div
            className="rounded-xl border p-6"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Take Action
            </h2>
            <div className="flex gap-3">
              <button
                id="btn-approve"
                onClick={() => setActiveAction('approved')}
                className="flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:scale-105"
                style={{ borderColor: '#3fb950', color: '#3fb950', background: '#1a3a2a' }}
              >
                ✓ Approve
              </button>
              <button
                id="btn-reject"
                onClick={() => setActiveAction('rejected')}
                className="flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:scale-105"
                style={{ borderColor: '#f85149', color: '#f85149', background: '#3a1a1a' }}
              >
                ✕ Reject
              </button>
              <button
                id="btn-more-info"
                onClick={() => setActiveAction('more_info_requested')}
                className="flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:scale-105"
                style={{ borderColor: '#bc8cff', color: '#bc8cff', background: '#2a1f3d' }}
              >
                ? Request More Info
              </button>
            </div>
          </div>
        )}

        {isTerminal && (
          <div className="rounded-xl border p-4 text-sm text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>
            This application is in a terminal state (<strong>{app.status}</strong>) — no further actions available.
          </div>
        )}
      </main>
    </div>
  );
}
