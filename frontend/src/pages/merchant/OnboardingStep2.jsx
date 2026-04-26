/**
 * OnboardingStep2.jsx — Business Details
 * Route: /onboarding/step/2
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';

const BUSINESS_TYPES = [
  'retail', 'wholesale', 'e-commerce', 'service', 'manufacturing',
  'food_beverage', 'technology', 'healthcare', 'education', 'other',
];

export default function OnboardingStep2() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();

  const [form, setForm] = useState({
    business_name: '', business_type: 'retail', monthly_volume_usd: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appData?.business_detail) {
      const bd = appData.business_detail;
      setForm({
        business_name: bd.business_name || '',
        business_type: bd.business_type || 'retail',
        monthly_volume_usd: bd.monthly_volume_usd || '',
      });
    }
  }, [appData]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function save() {
    if (!appId) return;
    setSaving(true);
    setError('');
    try {
      const method = appData?.business_detail ? 'put' : 'post';
      await api[method](`/applications/${appId}/business-detail/`, form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    await save();
    if (!error) navigate('/onboarding/step/3');
  }

  if (appLoading) return <Spinner />;

  return (
    <OnboardingLayout currentStep={2}>
      <h1 className="text-xl font-bold mb-1">Business Details</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Provide your business information so we can assess your KYC application.
      </p>

      <div className="space-y-5">
        <Field label="Business Name" id="bd-name">
          <input
            id="bd-name"
            type="text"
            placeholder="Acme Trading Pvt. Ltd."
            value={form.business_name}
            onChange={e => set('business_name', e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Business Type" id="bd-type">
          <select
            id="bd-type"
            value={form.business_type}
            onChange={e => set('business_type', e.target.value)}
            style={inputStyle}
          >
            {BUSINESS_TYPES.map(t => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Expected Monthly Volume (USD)" id="bd-volume">
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >$</span>
            <input
              id="bd-volume"
              type="number"
              min="0"
              step="0.01"
              placeholder="10000.00"
              value={form.monthly_volume_usd}
              onChange={e => set('monthly_volume_usd', e.target.value)}
              style={{ ...inputStyle, paddingLeft: '1.75rem' }}
            />
          </div>
        </Field>
      </div>

      {error && <p className="mt-4 text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
      {saved && <p className="mt-4 text-xs font-medium" style={{ color: 'var(--green)' }}>✓ Saved successfully</p>}

      <div className="flex gap-3 mt-8">
        <button onClick={() => navigate('/onboarding/step/1')} style={backBtn}>← Back</button>
        <button onClick={save} disabled={saving} style={secondaryBtn}>
          {saving ? 'Saving…' : 'Save Progress'}
        </button>
        <button onClick={handleNext} disabled={saving} style={primaryBtn}>
          Next →
        </button>
      </div>
    </OnboardingLayout>
  );
}

function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
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

const inputStyle = {
  display: 'block', width: '100%',
  padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
  fontSize: '0.875rem', outline: 'none',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
};
const primaryBtn = {
  flex: 1, padding: '0.625rem 1rem', borderRadius: '0.75rem',
  fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
  background: 'var(--accent)', color: '#0d1117', border: 'none',
};
const secondaryBtn = {
  flex: 1, padding: '0.625rem 1rem', borderRadius: '0.75rem',
  fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)',
  border: '1px solid var(--border)',
};
const backBtn = {
  padding: '0.625rem 1rem', borderRadius: '0.75rem',
  fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--border)',
};
