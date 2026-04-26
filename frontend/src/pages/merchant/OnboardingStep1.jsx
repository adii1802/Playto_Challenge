/**
 * OnboardingStep1.jsx — Personal Details
 * Route: /onboarding/step/1
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';

export default function OnboardingStep1() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from existing data
  useEffect(() => {
    if (appData?.personal_detail) {
      const pd = appData.personal_detail;
      setForm({ name: pd.name || '', email: pd.email || '', phone: pd.phone || '' });
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
      const method = appData?.personal_detail ? 'put' : 'post';
      await api[method](`/applications/${appId}/personal-detail/`, form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    await save();
    if (!error) navigate('/onboarding/step/2');
  }

  if (appLoading) return <Spinner />;

  return (
    <OnboardingLayout currentStep={1}>
      <h1 className="text-xl font-bold mb-1">Personal Details</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Tell us about yourself. This information will be verified during KYC review.
      </p>

      <div className="space-y-5">
        <Field label="Full Name" id="pd-name">
          <input
            id="pd-name"
            type="text"
            placeholder="Jane Smith"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Email Address" id="pd-email">
          <input
            id="pd-email"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Phone Number" id="pd-phone">
          <input
            id="pd-phone"
            type="tel"
            placeholder="+91-9876543210"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      {error && <p className="mt-4 text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
      {saved && <p className="mt-4 text-xs font-medium" style={{ color: 'var(--green)' }}>✓ Saved successfully</p>}

      <div className="flex gap-3 mt-8">
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
  flex: 1, padding: '0.625rem 1rem',
  borderRadius: '0.75rem', fontWeight: '600',
  fontSize: '0.875rem', cursor: 'pointer',
  background: 'var(--accent)', color: '#0d1117', border: 'none',
};

const secondaryBtn = {
  flex: 1, padding: '0.625rem 1rem',
  borderRadius: '0.75rem', fontWeight: '600',
  fontSize: '0.875rem', cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)',
  border: '1px solid var(--border)',
};
