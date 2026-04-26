import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';
import { C, inp, lbl, btn, Spinner } from '../../styles';

const BUSINESS_TYPES = [
  'retail','wholesale','e-commerce','service','manufacturing',
  'food_beverage','technology','healthcare','education','other',
];

export default function OnboardingStep2() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();
  const [form,   setForm]   = useState({ business_name: '', business_type: 'retail', monthly_volume_usd: '' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (appData?.business_detail) {
      const bd = appData.business_detail;
      setForm({ business_name: bd.business_name || '', business_type: bd.business_type || 'retail', monthly_volume_usd: bd.monthly_volume_usd || '' });
    }
  }, [appData]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setSaved(false); }

  async function save() {
    if (!appId) return;
    setSaving(true); setError('');
    try {
      const method = appData?.business_detail ? 'put' : 'post';
      await api[method](`/applications/${appId}/business-detail/`, form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleNext() { await save(); if (!error) navigate('/onboarding/step/3'); }

  if (appLoading) return <Spinner />;

  return (
    <OnboardingLayout currentStep={2}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: C.textPrimary, marginBottom: 6 }}>
        Business Details
      </h1>
      <p style={{ fontSize: '14px', color: C.textSecondary, marginBottom: 28 }}>
        Provide your business information for KYC assessment.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label htmlFor="bd-name" style={lbl}>Business Name</label>
          <input id="bd-name" type="text" placeholder="Acme Trading Pvt. Ltd."
            value={form.business_name} onChange={e => set('business_name', e.target.value)} style={inp} />
        </div>
        <div>
          <label htmlFor="bd-type" style={lbl}>Business Type</label>
          <select id="bd-type" value={form.business_type} onChange={e => set('business_type', e.target.value)} style={inp}>
            {BUSINESS_TYPES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bd-volume" style={lbl}>Expected Monthly Volume (USD)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: '14px', color: C.textSecondary, pointerEvents: 'none' }}>$</span>
            <input id="bd-volume" type="number" min="0" step="0.01" placeholder="10000.00"
              value={form.monthly_volume_usd} onChange={e => set('monthly_volume_usd', e.target.value)}
              style={{ ...inp, paddingLeft: '1.75rem' }} />
          </div>
        </div>
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
        <button onClick={() => navigate('/onboarding/step/1')} style={btn.ghost}>← Back</button>
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
