/**
 * OnboardingReview.jsx — Summary + Submit
 * Route: /onboarding/review
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';

const DOC_LABELS = { pan: 'PAN Card', aadhaar: 'Aadhaar Card', bank_statement: 'Bank Statement' };

export default function OnboardingReview() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!appId) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/applications/${appId}/submit/`);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Submission failed. Please check all steps are complete.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (appLoading) return <Spinner />;

  const pd = appData?.personal_detail;
  const bd = appData?.business_detail;
  const docs = appData?.documents || [];

  // Deduplicate — keep latest per type
  const latestDocs = {};
  docs.forEach(d => { if (!latestDocs[d.doc_type] || d.id > latestDocs[d.doc_type].id) latestDocs[d.doc_type] = d; });

  const canSubmit = pd && bd && Object.keys(latestDocs).length > 0;

  return (
    <OnboardingLayout currentStep={4}>
      <h1 className="text-xl font-bold mb-1">Review &amp; Submit</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Review your details before submitting. You can go back to edit.
      </p>

      {/* Personal */}
      <Section title="Personal Details" onEdit={() => navigate('/onboarding/step/1')}>
        {pd ? (
          <div className="grid grid-cols-3 gap-4">
            <KV label="Name" value={pd.name} />
            <KV label="Email" value={pd.email} />
            <KV label="Phone" value={pd.phone} />
          </div>
        ) : (
          <Missing>Personal details not filled — <EditLink onClick={() => navigate('/onboarding/step/1')}>add them</EditLink></Missing>
        )}
      </Section>

      {/* Business */}
      <Section title="Business Details" onEdit={() => navigate('/onboarding/step/2')}>
        {bd ? (
          <div className="grid grid-cols-3 gap-4">
            <KV label="Business Name" value={bd.business_name} />
            <KV label="Type" value={bd.business_type} />
            <KV label="Monthly Volume" value={bd.monthly_volume_usd ? `$${Number(bd.monthly_volume_usd).toLocaleString()}` : '—'} />
          </div>
        ) : (
          <Missing>Business details not filled — <EditLink onClick={() => navigate('/onboarding/step/2')}>add them</EditLink></Missing>
        )}
      </Section>

      {/* Documents */}
      <Section title="Documents" onEdit={() => navigate('/onboarding/step/3')}>
        {Object.keys(latestDocs).length > 0 ? (
          <div className="space-y-1.5">
            {Object.entries(latestDocs).map(([type, doc]) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <span className="text-xs" style={{ color: 'var(--green)' }}>✓</span>
                <span className="font-medium">{DOC_LABELS[type] || type}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  — {doc.file?.split('/').pop() || 'on file'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Missing>No documents uploaded — <EditLink onClick={() => navigate('/onboarding/step/3')}>upload now</EditLink></Missing>
        )}
      </Section>

      {!canSubmit && (
        <div className="mt-4 px-4 py-3 rounded-lg text-xs border" style={{ background: '#2d1a0a', borderColor: '#5a3a10', color: 'var(--yellow)' }}>
          ⚠ Complete all sections before submitting.
        </div>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg text-xs border" style={{ background: '#2d1a1a', borderColor: '#5a2020', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <button onClick={() => navigate('/onboarding/step/3')} style={backBtn}>← Back</button>
        <button
          id="btn-submit-application"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{ ...primaryBtn, flex: 2, opacity: (canSubmit && !submitting) ? 1 : 0.4 }}
        >
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </OnboardingLayout>
  );
}

function Section({ title, onEdit, children }) {
  return (
    <div className="mb-5 rounded-xl border p-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</h2>
        <button onClick={onEdit} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Edit</button>
      </div>
      {children}
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

function Missing({ children }) {
  return <p className="text-xs" style={{ color: 'var(--yellow)' }}>⚠ {children}</p>;
}

function EditLink({ onClick, children }) {
  return <button onClick={onClick} className="underline" style={{ color: 'var(--accent)' }}>{children}</button>;
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

const primaryBtn = {
  flex: 1, padding: '0.625rem 1rem', borderRadius: '0.75rem',
  fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
  background: 'var(--accent)', color: '#0d1117', border: 'none',
};
const backBtn = {
  padding: '0.625rem 1rem', borderRadius: '0.75rem',
  fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--border)',
};
