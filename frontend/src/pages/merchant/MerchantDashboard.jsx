/**
 * MerchantDashboard.jsx — Application Status
 * Route: /dashboard
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';

const STATUS_CONFIG = {
  draft:                { label: 'Draft',                bg: '#222',    text: '#8b949e' },
  submitted:            { label: 'Submitted',            bg: '#1f3a5f', text: '#58a6ff' },
  under_review:         { label: 'Under Review',         bg: '#3d2a0a', text: '#d29922' },
  approved:             { label: 'Approved',             bg: '#1a3a2a', text: '#3fb950' },
  rejected:             { label: 'Rejected',             bg: '#3a1a1a', text: '#f85149' },
  more_info_requested:  { label: 'More Info Requested',  bg: '#2a1f3d', text: '#bc8cff' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const { appData, loading, error, refreshApp } = useOnboarding();

  // Redirect draft apps to onboarding
  useEffect(() => {
    if (!loading && appData?.status === 'draft') {
      navigate('/onboarding/step/1', { replace: true });
    }
  }, [loading, appData, navigate]);

  function handleLogout() {
    localStorage.removeItem('kyc_token');
    localStorage.removeItem('kyc_role');
    localStorage.removeItem('kyc_app_id');
    navigate('/login');
  }

  const status = appData?.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  // Find the latest review action reason
  const latestAction = appData?.review_actions?.[0];

  if (loading) return <Spinner />;

  if (error) {
    return (
      <Shell onLogout={handleLogout}>
        <p style={{ color: 'var(--red)' }}>{error}</p>
      </Shell>
    );
  }

  return (
    <Shell onLogout={handleLogout}>
      {/* Status card */}
      <div
        className="rounded-2xl border p-8 mb-6 text-center"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
          Application Status
        </p>
        <span
          className="inline-block px-5 py-2 rounded-full text-lg font-bold mb-4"
          style={{ background: cfg.bg, color: cfg.text }}
        >
          {cfg.label}
        </span>

        {appData && (
          <div className="flex justify-center gap-10 mt-4">
            <KV label="Application ID" value={`#${appData.id}`} />
            <KV label="Submitted" value={fmtDate(appData.submitted_at)} />
            <KV label="Last Update" value={fmtDate(appData.last_status_change_at)} />
          </div>
        )}
      </div>

      {/* Status-specific messages */}
      {status === 'approved' && (
        <Banner color="var(--green)" bg="#1a3a2a" border="#2a5a3a">
          🎉 Congratulations! Your KYC application has been approved. You can now start using Playto's payment services.
        </Banner>
      )}

      {status === 'rejected' && (
        <Banner color="var(--red)" bg="#2d1a1a" border="#5a2020">
          <p className="font-bold mb-1">Application Rejected</p>
          {latestAction?.reason && (
            <p className="text-sm">Reason: {latestAction.reason}</p>
          )}
          <p className="text-xs mt-2 opacity-75">Please contact support if you have questions.</p>
        </Banner>
      )}

      {status === 'submitted' && (
        <Banner color="var(--accent)" bg="#1f3a5f" border="#2a5a9f">
          ⏳ Your application has been submitted and is awaiting review. We'll notify you of any updates.
        </Banner>
      )}

      {status === 'under_review' && (
        <Banner color="var(--yellow)" bg="#3d2a0a" border="#6a4a10">
          🔍 A reviewer is currently evaluating your application. This typically takes 1–2 business days.
        </Banner>
      )}

      {status === 'more_info_requested' && (
        <div
          className="rounded-xl border p-6"
          style={{ background: '#2a1f3d', borderColor: '#4a3a6d' }}
        >
          <p className="font-bold mb-2" style={{ color: '#bc8cff' }}>Additional Information Required</p>
          {latestAction?.reason && (
            <p className="text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Reviewer note: </span>
              {latestAction.reason}
            </p>
          )}
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Please update your documents and resubmit your application.
          </p>
          <button
            id="btn-resubmit"
            onClick={() => navigate('/onboarding/step/3')}
            className="px-5 py-2 rounded-xl font-bold text-sm"
            style={{ background: '#3a2f5a', color: '#bc8cff', border: '1px solid #6a5a9a' }}
          >
            Update Documents &amp; Resubmit →
          </button>
        </div>
      )}

      {/* Review history */}
      {appData?.review_actions?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Review History
          </h2>
          <div className="space-y-2">
            {appData.review_actions.map(a => (
              <div
                key={a.id}
                className="flex gap-3 p-3 rounded-lg border text-sm"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
              >
                <span className="font-semibold capitalize" style={{ color: STATUS_CONFIG[a.action]?.text || 'var(--text-muted)' }}>
                  {a.action.replace(/_/g, ' ')}
                </span>
                {a.reason && <span style={{ color: 'var(--text-muted)' }}>— {a.reason}</span>}
                <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{fmtDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={refreshApp}
        className="mt-6 text-xs px-3 py-1.5 rounded-lg border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        ↻ Refresh status
      </button>
    </Shell>
  );
}

function Shell({ onLogout, children }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>Playto KYC</span>
        <button onClick={onLogout} className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sign out</button>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function Banner({ color, bg, border, children }) {
  return (
    <div
      className="rounded-xl border p-5 text-sm"
      style={{ background: bg, borderColor: border, color }}
    >
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
    </div>
  );
}
