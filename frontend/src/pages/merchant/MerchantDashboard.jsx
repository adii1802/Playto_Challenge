import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import AppShell from '../../components/AppShell';
import { C, STATUS, StatusBadge, btn, Spinner }  "from '$(import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import AppShell from '../../components/AppShell';
import { C, STATUS, StatusBadge, btn, Spinner }  "from '$(import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import AppShell from '../../components/AppShell';
import { C, STATUS, StatusBadge, btn, Spinner }  "from '$(import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import AppShell from '../../components/AppShell';
import { C, STATUS, StatusBadge, btn, Spinner } from '../../styles';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

function KV({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: C.textMuted, marginBottom: 3,
        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: C.textPrimary }}>{value}</div>
    </div>
  );
}

const ACTION_COLORS = { approved: '#16A34A', rejected: '#E11D48', more_info_requested: '#A855F7' };

export default function MerchantDashboard() {
  const navigate    = useNavigate();
  const { appData, loading, error, refreshApp } = useOnboarding();

  // Redirect draft apps to onboarding
  useEffect(() => {
    if (!loading && appData?.status === 'draft') navigate('/onboarding/step/1', { replace: true });
  }, [loading, appData, navigate]);

  if (loading) return <Spinner />;

  const status = appData?.status;
  const cfg    = STATUS[status] || STATUS.draft;
  const latestAction = appData?.review_actions?.[0];

  return (
    <AppShell title="My Application">
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 24 }}>{error}</div>
      )}

      {/* Status card */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '32px', textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: '11px', fontWeight: '600', color: C.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Application Status</p>
        <StatusBadge status={status} style={{ fontSize: '15px', padding: '6px 20px', marginBottom: 20 }} />

        {appData && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 8 }}>
            <KV label="Application ID" value={`#${appData.id}`} />
            <KV label="Submitted"      value={fmtDate(appData.submitted_at)} />
            <KV label="Last Update"    value={fmtDate(appData.last_status_change_at)} />
          </div>
        )}
      </div>

      {/* Status-specific panels */}
      {status === 'approved' && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#16A34A', marginBottom: 6 }}>
            🎉 Application Approved!
          </p>
          <p style={{ fontSize: '14px', color: '#166534' }}>
            Your KYC has been verified. You can now start using Playto's payment services.
          </p>
        </div>
      )}

      {status === 'rejected' && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#E11D48', marginBottom: 6 }}>Application Rejected</p>
          {latestAction?.reason && (
            <p style={{ fontSize: '14px', color: '#9F1239' }}>Reason: {latestAction.reason}</p>
          )}
          <p style={{ fontSize: '13px', color: C.textMuted, marginTop: 8 }}>Contact support if you have questions.</p>
        </div>
      )}

      {status === 'submitted' && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '14px', color: '#1D4ED8' }}>
            ⏳ Your application has been submitted and is awaiting assignment to a reviewer.
          </p>
        </div>
      )}

      {status === 'under_review' && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '14px', color: '#9A3412' }}>
            🔍 A reviewer is currently evaluating your application. This typically takes 1–2 business days.
          </p>
        </div>
      )}

      {status === 'more_info_requested' && (
        <div style={{ background: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: '0.75rem',
          padding: '24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#7E22CE', marginBottom: 8 }}>
            Additional Information Required
          </p>
          {latestAction?.reason && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E9D5FF', borderRadius: '0.5rem',
              padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: C.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Reviewer Note</p>
              <p style={{ fontSize: '14px', color: C.textPrimary }}>{latestAction.reason}</p>
            </div>
          )}
          <p style={{ fontSize: '13px', color: '#6B21A8', marginBottom: 16 }}>
            Please update your documents and resubmit your application.
          </p>
          <button id="btn-resubmit" onClick={() => navigate('/onboarding/step/3')}
            style={{ ...btn.primary, background: '#7C3AED' }}>
            Update Documents &amp; Resubmit →
          </button>
        </div>
      )}

      {/* Review History */}
      {appData?.review_actions?.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: C.textSecondary,
              textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review History</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appData.review_actions.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 14px',
                background: C.bg, borderRadius: '0.5rem', border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${ACTION_COLORS[a.action] || C.textMuted}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
                    color: ACTION_COLORS[a.action] || C.textSecondary }}>
                    {a.action.replace(/_/g,' ')}
                  </span>
                  {a.reason && <p style={{ fontSize: '13px', color: C.textPrimary, marginTop: 4 }}>{a.reason}</p>}
                </div>
                <span style={{ fontSize: '12px', color: C.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={refreshApp}
        style={{ ...btn.secondary, fontSize: '13px' }}>
        ↻ Refresh status
      </button>
    </AppShell>
  );
}
.Groups[1].Value)styles.jsx'" ;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

function KV({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: C.textMuted, marginBottom: 3,
        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: C.textPrimary }}>{value}</div>
    </div>
  );
}

const ACTION_COLORS = { approved: '#16A34A', rejected: '#E11D48', more_info_requested: '#A855F7' };

export default function MerchantDashboard() {
  const navigate    = useNavigate();
  const { appData, loading, error, refreshApp } = useOnboarding();

  // Redirect draft apps to onboarding
  useEffect(() => {
    if (!loading && appData?.status === 'draft') navigate('/onboarding/step/1', { replace: true });
  }, [loading, appData, navigate]);

  if (loading) return <Spinner />;

  const status = appData?.status;
  const cfg    = STATUS[status] || STATUS.draft;
  const latestAction = appData?.review_actions?.[0];

  return (
    <AppShell title="My Application">
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 24 }}>{error}</div>
      )}

      {/* Status card */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '32px', textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: '11px', fontWeight: '600', color: C.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Application Status</p>
        <StatusBadge status={status} style={{ fontSize: '15px', padding: '6px 20px', marginBottom: 20 }} />

        {appData && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 8 }}>
            <KV label="Application ID" value={`#${appData.id}`} />
            <KV label="Submitted"      value={fmtDate(appData.submitted_at)} />
            <KV label="Last Update"    value={fmtDate(appData.last_status_change_at)} />
          </div>
        )}
      </div>

      {/* Status-specific panels */}
      {status === 'approved' && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#16A34A', marginBottom: 6 }}>
            🎉 Application Approved!
          </p>
          <p style={{ fontSize: '14px', color: '#166534' }}>
            Your KYC has been verified. You can now start using Playto's payment services.
          </p>
        </div>
      )}

      {status === 'rejected' && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#E11D48', marginBottom: 6 }}>Application Rejected</p>
          {latestAction?.reason && (
            <p style={{ fontSize: '14px', color: '#9F1239' }}>Reason: {latestAction.reason}</p>
          )}
          <p style={{ fontSize: '13px', color: C.textMuted, marginTop: 8 }}>Contact support if you have questions.</p>
        </div>
      )}

      {status === 'submitted' && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '14px', color: '#1D4ED8' }}>
            ⏳ Your application has been submitted and is awaiting assignment to a reviewer.
          </p>
        </div>
      )}

      {status === 'under_review' && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '14px', color: '#9A3412' }}>
            🔍 A reviewer is currently evaluating your application. This typically takes 1–2 business days.
          </p>
        </div>
      )}

      {status === 'more_info_requested' && (
        <div style={{ background: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: '0.75rem',
          padding: '24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#7E22CE', marginBottom: 8 }}>
            Additional Information Required
          </p>
          {latestAction?.reason && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E9D5FF', borderRadius: '0.5rem',
              padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: C.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Reviewer Note</p>
              <p style={{ fontSize: '14px', color: C.textPrimary }}>{latestAction.reason}</p>
            </div>
          )}
          <p style={{ fontSize: '13px', color: '#6B21A8', marginBottom: 16 }}>
            Please update your documents and resubmit your application.
          </p>
          <button id="btn-resubmit" onClick={() => navigate('/onboarding/step/3')}
            style={{ ...btn.primary, background: '#7C3AED' }}>
            Update Documents &amp; Resubmit →
          </button>
        </div>
      )}

      {/* Review History */}
      {appData?.review_actions?.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: C.textSecondary,
              textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review History</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appData.review_actions.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 14px',
                background: C.bg, borderRadius: '0.5rem', border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${ACTION_COLORS[a.action] || C.textMuted}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
                    color: ACTION_COLORS[a.action] || C.textSecondary }}>
                    {a.action.replace(/_/g,' ')}
                  </span>
                  {a.reason && <p style={{ fontSize: '13px', color: C.textPrimary, marginTop: 4 }}>{a.reason}</p>}
                </div>
                <span style={{ fontSize: '12px', color: C.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={refreshApp}
        style={{ ...btn.secondary, fontSize: '13px' }}>
        ↻ Refresh status
      </button>
    </AppShell>
  );
}
.Groups[1].Value)styles.jsx'" ;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

function KV({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: C.textMuted, marginBottom: 3,
        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: C.textPrimary }}>{value}</div>
    </div>
  );
}

const ACTION_COLORS = { approved: '#16A34A', rejected: '#E11D48', more_info_requested: '#A855F7' };

export default function MerchantDashboard() {
  const navigate    = useNavigate();
  const { appData, loading, error, refreshApp } = useOnboarding();

  // Redirect draft apps to onboarding
  useEffect(() => {
    if (!loading && appData?.status === 'draft') navigate('/onboarding/step/1', { replace: true });
  }, [loading, appData, navigate]);

  if (loading) return <Spinner />;

  const status = appData?.status;
  const cfg    = STATUS[status] || STATUS.draft;
  const latestAction = appData?.review_actions?.[0];

  return (
    <AppShell title="My Application">
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 24 }}>{error}</div>
      )}

      {/* Status card */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '32px', textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: '11px', fontWeight: '600', color: C.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Application Status</p>
        <StatusBadge status={status} style={{ fontSize: '15px', padding: '6px 20px', marginBottom: 20 }} />

        {appData && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 8 }}>
            <KV label="Application ID" value={`#${appData.id}`} />
            <KV label="Submitted"      value={fmtDate(appData.submitted_at)} />
            <KV label="Last Update"    value={fmtDate(appData.last_status_change_at)} />
          </div>
        )}
      </div>

      {/* Status-specific panels */}
      {status === 'approved' && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#16A34A', marginBottom: 6 }}>
            🎉 Application Approved!
          </p>
          <p style={{ fontSize: '14px', color: '#166534' }}>
            Your KYC has been verified. You can now start using Playto's payment services.
          </p>
        </div>
      )}

      {status === 'rejected' && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#E11D48', marginBottom: 6 }}>Application Rejected</p>
          {latestAction?.reason && (
            <p style={{ fontSize: '14px', color: '#9F1239' }}>Reason: {latestAction.reason}</p>
          )}
          <p style={{ fontSize: '13px', color: C.textMuted, marginTop: 8 }}>Contact support if you have questions.</p>
        </div>
      )}

      {status === 'submitted' && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '14px', color: '#1D4ED8' }}>
            ⏳ Your application has been submitted and is awaiting assignment to a reviewer.
          </p>
        </div>
      )}

      {status === 'under_review' && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '14px', color: '#9A3412' }}>
            🔍 A reviewer is currently evaluating your application. This typically takes 1–2 business days.
          </p>
        </div>
      )}

      {status === 'more_info_requested' && (
        <div style={{ background: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: '0.75rem',
          padding: '24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#7E22CE', marginBottom: 8 }}>
            Additional Information Required
          </p>
          {latestAction?.reason && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E9D5FF', borderRadius: '0.5rem',
              padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: C.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Reviewer Note</p>
              <p style={{ fontSize: '14px', color: C.textPrimary }}>{latestAction.reason}</p>
            </div>
          )}
          <p style={{ fontSize: '13px', color: '#6B21A8', marginBottom: 16 }}>
            Please update your documents and resubmit your application.
          </p>
          <button id="btn-resubmit" onClick={() => navigate('/onboarding/step/3')}
            style={{ ...btn.primary, background: '#7C3AED' }}>
            Update Documents &amp; Resubmit →
          </button>
        </div>
      )}

      {/* Review History */}
      {appData?.review_actions?.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: C.textSecondary,
              textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review History</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appData.review_actions.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 14px',
                background: C.bg, borderRadius: '0.5rem', border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${ACTION_COLORS[a.action] || C.textMuted}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
                    color: ACTION_COLORS[a.action] || C.textSecondary }}>
                    {a.action.replace(/_/g,' ')}
                  </span>
                  {a.reason && <p style={{ fontSize: '13px', color: C.textPrimary, marginTop: 4 }}>{a.reason}</p>}
                </div>
                <span style={{ fontSize: '12px', color: C.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={refreshApp}
        style={{ ...btn.secondary, fontSize: '13px' }}>
        ↻ Refresh status
      </button>
    </AppShell>
  );
}
.Groups[1].Value)styles.jsx'" ;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

function KV({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: C.textMuted, marginBottom: 3,
        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: C.textPrimary }}>{value}</div>
    </div>
  );
}

const ACTION_COLORS = { approved: '#16A34A', rejected: '#E11D48', more_info_requested: '#A855F7' };

export default function MerchantDashboard() {
  const navigate    = useNavigate();
  const { appData, loading, error, refreshApp } = useOnboarding();

  // Redirect draft apps to onboarding
  useEffect(() => {
    if (!loading && appData?.status === 'draft') navigate('/onboarding/step/1', { replace: true });
  }, [loading, appData, navigate]);

  if (loading) return <Spinner />;

  const status = appData?.status;
  const cfg    = STATUS[status] || STATUS.draft;
  const latestAction = appData?.review_actions?.[0];

  return (
    <AppShell title="My Application">
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 24 }}>{error}</div>
      )}

      {/* Status card */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '32px', textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: '11px', fontWeight: '600', color: C.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Application Status</p>
        <StatusBadge status={status} style={{ fontSize: '15px', padding: '6px 20px', marginBottom: 20 }} />

        {appData && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 8 }}>
            <KV label="Application ID" value={`#${appData.id}`} />
            <KV label="Submitted"      value={fmtDate(appData.submitted_at)} />
            <KV label="Last Update"    value={fmtDate(appData.last_status_change_at)} />
          </div>
        )}
      </div>

      {/* Status-specific panels */}
      {status === 'approved' && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#16A34A', marginBottom: 6 }}>
            🎉 Application Approved!
          </p>
          <p style={{ fontSize: '14px', color: '#166534' }}>
            Your KYC has been verified. You can now start using Playto's payment services.
          </p>
        </div>
      )}

      {status === 'rejected' && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#E11D48', marginBottom: 6 }}>Application Rejected</p>
          {latestAction?.reason && (
            <p style={{ fontSize: '14px', color: '#9F1239' }}>Reason: {latestAction.reason}</p>
          )}
          <p style={{ fontSize: '13px', color: C.textMuted, marginTop: 8 }}>Contact support if you have questions.</p>
        </div>
      )}

      {status === 'submitted' && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '14px', color: '#1D4ED8' }}>
            ⏳ Your application has been submitted and is awaiting assignment to a reviewer.
          </p>
        </div>
      )}

      {status === 'under_review' && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '0.75rem',
          padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: '14px', color: '#9A3412' }}>
            🔍 A reviewer is currently evaluating your application. This typically takes 1–2 business days.
          </p>
        </div>
      )}

      {status === 'more_info_requested' && (
        <div style={{ background: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: '0.75rem',
          padding: '24px', marginBottom: 20 }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#7E22CE', marginBottom: 8 }}>
            Additional Information Required
          </p>
          {latestAction?.reason && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E9D5FF', borderRadius: '0.5rem',
              padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: C.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Reviewer Note</p>
              <p style={{ fontSize: '14px', color: C.textPrimary }}>{latestAction.reason}</p>
            </div>
          )}
          <p style={{ fontSize: '13px', color: '#6B21A8', marginBottom: 16 }}>
            Please update your documents and resubmit your application.
          </p>
          <button id="btn-resubmit" onClick={() => navigate('/onboarding/step/3')}
            style={{ ...btn.primary, background: '#7C3AED' }}>
            Update Documents &amp; Resubmit →
          </button>
        </div>
      )}

      {/* Review History */}
      {appData?.review_actions?.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: C.textSecondary,
              textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review History</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appData.review_actions.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 14px',
                background: C.bg, borderRadius: '0.5rem', border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${ACTION_COLORS[a.action] || C.textMuted}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
                    color: ACTION_COLORS[a.action] || C.textSecondary }}>
                    {a.action.replace(/_/g,' ')}
                  </span>
                  {a.reason && <p style={{ fontSize: '13px', color: C.textPrimary, marginTop: 4 }}>{a.reason}</p>}
                </div>
                <span style={{ fontSize: '12px', color: C.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={refreshApp}
        style={{ ...btn.secondary, fontSize: '13px' }}>
        ↻ Refresh status
      </button>
    </AppShell>
  );
}
