import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';
import { C, inp, lbl, btn, Spinner } from '../../styles';

export default function OnboardingStep1() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();
  const [form,   setForm]   = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (appData?.personal_detail) {
      const pd = appData.personal_detail;
      setForm({ name: pd.name || '', email: pd.email || '', phone: pd.phone || '' });
    }
  }, [appData]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setSaved(false); }

  async function save() {
    if (!appId) return;
    setSaving(true); setError('');
    try {
      const method = appData?.personal_detail ? 'put' : 'post';
      await api[method](`/applications/${appId}/personal-detail/`, form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleNext() {
    await save();
    if (!error) navigate('/onboarding/step/2');
  }

  if (appLoading) return <Spinner />;

  return (
    <OnboardingLayout currentStep={1}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: C.textPrimary, marginBottom: 6 }}>
        Personal Details
      </h1>
      <p style={{ fontSize: '14px', color: C.textSecondary, marginBottom: 28 }}>
        Tell us about yourself. This information will be verified during KYC review.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[
          { id: 'pd-name',  field: 'name',  label: 'Full Name',     type: 'text',  ph: 'Jane Smith' },
          { id: 'pd-email', field: 'email', label: 'Email Address', type: 'email', ph: 'jane@example.com' },
          { id: 'pd-phone', field: 'phone', label: 'Phone Number',  type: 'tel',   ph: '+91-9876543210' },
        ].map(({ id, field, label, type, ph }) => (
          <div key={field}>
            <label htmlFor={id} style={lbl}>{label}</label>
            <input id={id} type={type} placeholder={ph} value={form[field]}
              onChange={e => set(field, e.target.value)} style={inp} />
          </div>
        ))}
      </div>
      {error && <p style={{ marginTop: 14, fontSize: '13px', color: '#E11D48' }}>{error}</p>}
      {saved && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '13px', color: '#16A34A', fontWeight: '500' }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#F0FDF4',
            border: '1px solid #86EFAC', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px' }}>✓</span>
          Saved successfully
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={save} disabled={saving} style={{ ...btn.secondary, flex: 1 }}>
          {saving ? 'Saving…' : 'Save Progress'}
        </button>
        <button onClick={handleNext} disabled={saving} style={{ ...btn.primary, flex: 2 }}>
          Continue →
        </button>
      </div>
    </OnboardingLayout>
  );
}
