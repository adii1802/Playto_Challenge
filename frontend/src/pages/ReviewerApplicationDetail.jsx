import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import AppShell from '../components/AppShell';
import { C, STATUS, StatusBadge, Spinner, btn } from '../styles';

const ACTION_MAP = {
  approved:            { label: 'Approve',           style: { ...btn.primary }, requireReason: false },
  rejected:            { label: 'Reject',            style: { ...btn.danger },  requireReason: true  },
  more_info_requested: { label: 'Request More Info', style: { ...btn.secondary, border: '1px solid #E9D5FF', color: '#A855F7', background: '#FDF4FF' }, requireReason: true },
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

function Section({ title, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: C.textSecondary,
          textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: '500', color: C.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '14px', color: C.textPrimary }}>{value || '—'}</div>
    </div>
  );
}

function ActionModal({ action, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const cfg = ACTION_MAP[action];
  const canSubmit = !loading && (!cfg.requireReason || reason.trim().length >= 5);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)', padding: 28, width: 420, maxWidth: '90vw' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: C.textPrimary, marginBottom: 6 }}>{cfg.label}</h3>
        <p style={{ fontSize: '13px', color: C.textSecondary, marginBottom: 18 }}>
          {cfg.requireReason ? 'A reason is required for this action.' : 'You may optionally add a note.'}
        </p>
        <textarea rows={4} placeholder="Enter reason…" value={reason} onChange={e => setReason(e.target.value)}
          style={{ display: 'block', width: '100%', background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: '0.5rem', padding: '10px 12px', fontSize: '14px', color: C.textPrimary,
            resize: 'vertical', marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...btn.secondary, flex: 1 }}>Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={!canSubmit}
            style={{ ...cfg.style, flex: 1, opacity: canSubmit ? 1 : 0.4 }}>
            {loading ? 'Submitting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TERMINAL = ['approved', 'rejected'];

export default function ReviewerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app,           setApp]           = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [activeAction,  setActiveAction]  = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState('');

  const fetchApp = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/reviewer/application/${id}/`);
      setApp(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      if (err.response?.status === 403) { localStorage.clear(); navigate('/login'); }
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  async function handleAction(reason) {
    setActionLoading(true); setActionError('');
    try {
      await api.post(`/reviewer/application/${id}/action/`, { action: activeAction, reason });
      setActiveAction(null);
      navigate('/reviewer/queue');
    } catch (err) {
      setActionError(err.response?.data?.error || err.message);
      setActionLoading(false);
    }
  }

  if (loading) return <Spinner />;
  if (error)   return <AppShell title={`Application #${id}`}><p style={{ color: '#E11D48' }}>{error}</p></AppShell>;
  if (!app)    return null;

  const pd  = app.personal_detail;
  const bd  = app.business_detail;
  const isTerminal = TERMINAL.includes(app.status);
  const actionColors = { approved: '#16A34A', rejected: '#E11D48', more_info_requested: '#A855F7' };

  return (
    <AppShell title={
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/reviewer/queue')}
          style={{ ...btn.ghost, padding: '4px 8px', fontSize: '13px' }}>← Queue</button>
        <span style={{ color: C.border }}>|</span>
        Application #{id}
        <StatusBadge status={app.status} />
        {app.at_risk && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3',
            borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: '600' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E11D48', display: 'inline-block' }} />
            AT RISK
          </span>
        )}
      </span>
    }>
      {activeAction && (
        <ActionModal action={activeAction}
          onConfirm={handleAction}
          onCancel={() => { setActiveAction(null); setActionError(''); }}
          loading={actionLoading} />
      )}
      {actionError && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 20 }}>{actionError}</div>
      )}

      <Section title="Personal Details">
        {pd ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            <KV label="Full Name" value={pd.name} />
            <KV label="Email" value={pd.email} />
            <KV label="Phone" value={pd.phone} />
          </div>
        ) : <p style={{ color: C.textMuted, fontSize: '14px' }}>Not provided.</p>}
      </Section>

      <Section title="Business Details">
        {bd ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            <KV label="Business Name" value={bd.business_name} />
            <KV label="Type" value={bd.business_type} />
            <KV label="Monthly Volume" value={bd.monthly_volume_usd ? `$${Number(bd.monthly_volume_usd).toLocaleString()}` : '—'} />
          </div>
        ) : <p style={{ color: C.textMuted, fontSize: '14px' }}>Not provided.</p>}
      </Section>

      <Section title={`Documents (${app.documents?.length ?? 0})`}>
        {app.documents?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {app.documents.map(doc => {
              const isImg = /\.(jpg|jpeg|png)(\?|$)/i.test(doc.file);
              const lbl = { pan: 'PAN', aadhaar: 'Aadhaar', bank_statement: 'Bank Statement' }[doc.doc_type] || doc.doc_type;
              return (
                <div key={doc.id} style={{ border: `1px solid ${C.border}`, borderRadius: '0.5rem', overflow: 'hidden' }}>
                  {isImg
                    ? <a href={doc.file} target="_blank" rel="noopener noreferrer"><img src={doc.file} alt={lbl} style={{ width: '100%', height: 120, objectFit: 'cover' }} /></a>
                    : <div style={{ height: 120, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <a href={doc.file} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: C.primary }}>Open PDF ↗</a>
                      </div>
                  }
                  <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: C.textPrimary }}>{lbl}</div>
                    <div style={{ fontSize: '11px', color: C.textMuted }}>Uploaded {fmtDate(doc.uploaded_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p style={{ color: C.textMuted, fontSize: '14px' }}>No documents uploaded.</p>}
      </Section>

      <Section title="Review History">
        {app.review_actions?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {app.review_actions.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 14px',
                background: C.bg, borderRadius: '0.5rem', border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${actionColors[a.action] || C.textMuted}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
                    color: actionColors[a.action] || C.textSecondary }}>
                    {a.action.replace(/_/g, ' ')}
                  </span>
                  {a.reason && <p style={{ fontSize: '13px', color: C.textPrimary, marginTop: 4 }}>{a.reason}</p>}
                </div>
                <span style={{ fontSize: '12px', color: C.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        ) : <p style={{ color: C.textMuted, fontSize: '14px' }}>No review actions yet.</p>}
      </Section>

      {!isTerminal && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '20px 24px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: C.textSecondary,
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Take Action</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.entries(ACTION_MAP).map(([key, cfg]) => (
              <button id={`btn-${key}`} key={key}
                onClick={() => setActiveAction(key)}
                style={{ ...cfg.style, flex: 1 }}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {isTerminal && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '0.5rem',
          padding: '14px 20px', fontSize: '13px', color: C.textSecondary, textAlign: 'center' }}>
          This application is in a terminal state (<strong>{app.status}</strong>) — no further actions available.
        </div>
      )}
    </AppShell>
  );
}
