import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';
import { C, StatusBadge, btn, Spinner } from '../../styles';

const DOC_LABELS = { pan: 'PAN Card', aadhaar: 'Aadhaar', bank_statement: 'Bank Statement' };

function KV({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: '500', color: C.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '14px', color: C.textPrimary }}>{value || '—'}</div>
    </div>
  );
}

function SummarySection({ title, onEdit, children }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: '0.75rem', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: C.textSecondary,
          textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <button onClick={onEdit}
          style={{ fontSize: '13px', fontWeight: '500', color: C.primary, background: 'none', border: 'none', cursor: 'pointer' }}>
          Edit
        </button>
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

export default function OnboardingReview() {
  const navigate    = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  async function handleSubmit() {
    if (!appId) return;
    setSubmitting(true); setError('');
    try {
      const headers = { Authorization: `Token ${localStorage.getItem('kyc_token')}` };
      await axios.post(`${API_BASE}/api/v1/applications/${appId}/submit/`, {}, { headers });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Submission failed. Check all steps are complete.');
    } finally { setSubmitting(false); }
  }

  if (appLoading) return <Spinner />;

  const pd  = appData?.personal_detail;
  const bd  = appData?.business_detail;
  const docs = appData?.documents || [];
  const latestDocs = {};
  docs.forEach(d => { if (!latestDocs[d.doc_type] || d.id > latestDocs[d.doc_type].id) latestDocs[d.doc_type] = d; });
  const canSubmit = pd && bd && Object.keys(latestDocs).length > 0;

  return (
    <OnboardingLayout currentStep={4}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: C.textPrimary, marginBottom: 6 }}>
        Review &amp; Submit
      </h1>
      <p style={{ fontSize: '14px', color: C.textSecondary, marginBottom: 28 }}>
        Check your details before submitting. Use Edit to make changes.
      </p>

      <SummarySection title="Personal Details" onEdit={() => navigate('/onboarding/step/1')}>
        {pd ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            <KV label="Name" value={pd.name} />
            <KV label="Email" value={pd.email} />
            <KV label="Phone" value={pd.phone} />
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#F97316' }}>
            ⚠ Missing —{' '}
            <button onClick={() => navigate('/onboarding/step/1')}
              style={{ color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
              add now
            </button>
          </p>
        )}
      </SummarySection>

      <SummarySection title="Business Details" onEdit={() => navigate('/onboarding/step/2')}>
        {bd ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            <KV label="Business Name" value={bd.business_name} />
            <KV label="Type" value={bd.business_type} />
            <KV label="Monthly Volume" value={bd.monthly_volume_usd ? `$${Number(bd.monthly_volume_usd).toLocaleString()}` : '—'} />
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#F97316' }}>
            ⚠ Missing —{' '}
            <button onClick={() => navigate('/onboarding/step/2')}
              style={{ color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
              add now
            </button>
          </p>
        )}
      </SummarySection>

      <SummarySection title="Documents" onEdit={() => navigate('/onboarding/step/3')}>
        {Object.keys(latestDocs).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(latestDocs).map(([type, doc]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#DCFCE7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: C.textPrimary }}>{DOC_LABELS[type] || type}</span>
                <span style={{ fontSize: '12px', color: C.textMuted }}>— {doc.file?.split('/').pop() || 'on file'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#F97316' }}>
            ⚠ No documents uploaded —{' '}
            <button onClick={() => navigate('/onboarding/step/3')}
              style={{ color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
              upload now
            </button>
          </p>
        )}
      </SummarySection>

      {!canSubmit && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#92400E', marginBottom: 16 }}>
          Complete all sections above before submitting.
        </div>
      )}

      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={() => navigate('/onboarding/step/3')} style={btn.ghost}>← Back</button>
        <button id="btn-submit-application" onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{ ...btn.primary, flex: 1, opacity: (canSubmit && !submitting) ? 1 : 0.4, fontSize: '15px', fontWeight: '600', padding: '0.625rem' }}>
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </OnboardingLayout>
  );
}
