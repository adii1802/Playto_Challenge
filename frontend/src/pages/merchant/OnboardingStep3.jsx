/**
 * OnboardingStep3.jsx — Document Upload
 * Route: /onboarding/step/3
 *
 * Client-side validation:
 * - Rejects files > 5 MB before sending to server
 * - Checks file.type (MIME) against allowed list before sending to server
 * Server also validates with magic bytes — client check is just UX.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';

const DOC_SLOTS = [
  { key: 'pan', label: 'PAN Card', hint: 'PDF, JPG, or PNG — max 5 MB' },
  { key: 'aadhaar', label: 'Aadhaar Card', hint: 'PDF, JPG, or PNG — max 5 MB' },
  { key: 'bank_statement', label: 'Bank Statement', hint: 'PDF, JPG, or PNG — max 5 MB' },
];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES = 5 * 1024 * 1024;

function validateFile(file) {
  if (file.size > MAX_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`;
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return `Invalid file type (${file.type || 'unknown'}). Only PDF, JPG, and PNG are accepted.`;
  }
  return null;
}

export default function OnboardingStep3() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading, refreshApp } = useOnboarding();

  // Track: { [doc_type]: { uploaded: doc_object | null, uploading, error } }
  const [slots, setSlots] = useState(() =>
    Object.fromEntries(DOC_SLOTS.map(d => [d.key, { uploaded: null, uploading: false, error: '' }]))
  );

  // Populate from existing documents (pick latest per type)
  useEffect(() => {
    if (!appData?.documents) return;
    const latest = {};
    appData.documents.forEach(doc => {
      if (!latest[doc.doc_type] || doc.id > latest[doc.doc_type].id) {
        latest[doc.doc_type] = doc;
      }
    });
    setSlots(prev => {
      const next = { ...prev };
      DOC_SLOTS.forEach(d => {
        next[d.key] = { ...next[d.key], uploaded: latest[d.key] || null };
      });
      return next;
    });
  }, [appData]);

  function setSlot(key, patch) {
    setSlots(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function handleFileChange(key, file) {
    if (!file) return;

    // Client-side validation first
    const validationErr = validateFile(file);
    if (validationErr) {
      setSlot(key, { error: validationErr });
      return;
    }

    setSlot(key, { uploading: true, error: '' });
    try {
      const formData = new FormData();
      formData.append('doc_type', key);
      formData.append('file', file);
      const res = await api.post(`/applications/${appId}/documents/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSlot(key, { uploaded: res.data, uploading: false });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Upload failed';
      setSlot(key, { error: msg, uploading: false });
    }
  }

  const atLeastOne = DOC_SLOTS.some(d => slots[d.key].uploaded);

  if (appLoading) return <Spinner />;

  return (
    <OnboardingLayout currentStep={3}>
      <h1 className="text-xl font-bold mb-1">Upload Documents</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Upload at least one document. Accepted formats: PDF, JPG, PNG (max 5 MB each).
      </p>

      <div className="space-y-4">
        {DOC_SLOTS.map(({ key, label, hint }) => {
          const slot = slots[key];
          return (
            <div
              key={key}
              className="rounded-xl border p-4"
              style={{ borderColor: slot.uploaded ? 'var(--green)' : 'var(--border)', background: 'var(--bg-elevated)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{label}</span>
                {slot.uploaded && (
                  <span className="text-xs font-medium" style={{ color: 'var(--green)' }}>✓ Uploaded</span>
                )}
              </div>

              {slot.uploaded && (
                <p className="text-xs mb-2 truncate" style={{ color: 'var(--text-muted)' }}>
                  {slot.uploaded.file?.split('/').pop() || 'Document on file'}
                </p>
              )}

              <label
                htmlFor={`doc-${key}`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{
                    background: slot.uploading ? 'var(--bg-surface)' : '#1f3a5f',
                    color: slot.uploading ? 'var(--text-muted)' : 'var(--accent)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {slot.uploading ? 'Uploading…' : slot.uploaded ? 'Replace file' : 'Choose file'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</span>
              </label>
              <input
                id={`doc-${key}`}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                disabled={slot.uploading}
                onChange={e => handleFileChange(key, e.target.files[0])}
              />

              {slot.error && (
                <p className="mt-2 text-xs" style={{ color: 'var(--red)' }}>⚠ {slot.error}</p>
              )}
            </div>
          );
        })}
      </div>

      {!atLeastOne && (
        <p className="mt-4 text-xs" style={{ color: 'var(--yellow)' }}>
          ⚠ Upload at least one document to continue.
        </p>
      )}

      <div className="flex gap-3 mt-8">
        <button onClick={() => navigate('/onboarding/step/2')} style={backBtn}>← Back</button>
        <button
          onClick={() => navigate('/onboarding/review')}
          disabled={!atLeastOne}
          style={{ ...primaryBtn, opacity: atLeastOne ? 1 : 0.4 }}
        >
          Next →
        </button>
      </div>
    </OnboardingLayout>
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

const primaryBtn = {
  flex: 1, padding: '0.625rem 1rem', borderRadius: '0.75rem',
  fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
  background: 'var(--accent)', color: '#0d1117', border: 'none',
};
const backBtn = {
  padding: '0.625rem 1rem', borderRadius: '0.75rem',
  fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--border)',
};
