import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';
import { C, btn, Spinner }  "from '$(import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';
import { C, btn, Spinner }  "from '$(import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';
import { C, btn, Spinner }  "from '$(import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingLayout from '../../components/OnboardingLayout';
import { C, btn, Spinner } from '../../styles';

const DOC_SLOTS = [
  { key: 'pan',            label: 'PAN Card',        hint: 'PDF, JPG or PNG — max 5 MB' },
  { key: 'aadhaar',        label: 'Aadhaar Card',    hint: 'PDF, JPG or PNG — max 5 MB' },
  { key: 'bank_statement', label: 'Bank Statement',  hint: 'PDF, JPG or PNG — max 5 MB' },
];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES    = 5 * 1024 * 1024;

function UploadIcon() {
  return (
    <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
    </svg>
  );
}

function validateFile(file) {
  if (file.size > MAX_BYTES)            return `File too large (${(file.size/1024/1024).toFixed(1)} MB). Max is 5 MB.`;
  if (!ALLOWED_MIME.includes(file.type)) return `Invalid type (${file.type || 'unknown'}). Only PDF, JPG, PNG allowed.`;
  return null;
}

export default function OnboardingStep3() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();
  const [slots, setSlots] = useState(() =>
    Object.fromEntries(DOC_SLOTS.map(d => [d.key, { uploaded: null, uploading: false, error: '' }]))
  );

  useEffect(() => {
    if (!appData?.documents) return;
    const latest = {};
    appData.documents.forEach(doc => {
      if (!latest[doc.doc_type] || doc.id > latest[doc.doc_type].id) latest[doc.doc_type] = doc;
    });
    setSlots(prev => {
      const next = { ...prev };
      DOC_SLOTS.forEach(d => { next[d.key] = { ...next[d.key], uploaded: latest[d.key] || null }; });
      return next;
    });
  }, [appData]);

  function setSlot(key, patch) { setSlots(prev => ({ ...prev, [key]: { ...prev[key], ...patch } })); }

  async function handleFile(key, file) {
    if (!file) return;
    const err = validateFile(file);
    if (err) { setSlot(key, { error: err }); return; }
    setSlot(key, { uploading: true, error: '' });
    try {
      const fd = new FormData(); fd.append('doc_type', key); fd.append('file', file);
      const res = await api.post(`/applications/${appId}/documents/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSlot(key, { uploaded: res.data, uploading: false });
    } catch (err) {
      setSlot(key, { error: err.response?.data?.error || 'Upload failed', uploading: false });
    }
  }

  const atLeastOne = DOC_SLOTS.some(d => slots[d.key].uploaded);
  if (appLoading) return <Spinner />;

  return (
    <OnboardingLayout currentStep={3}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: C.textPrimary, marginBottom: 6 }}>
        Upload Documents
      </h1>
      <p style={{ fontSize: '14px', color: C.textSecondary, marginBottom: 28 }}>
        Upload at least one document. Accepted: PDF, JPG, PNG (max 5 MB each).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {DOC_SLOTS.map(({ key, label, hint }) => {
          const slot = slots[key];
          return (
            <label key={key} htmlFor={`doc-${key}`} style={{ cursor: 'pointer', display: 'block' }}>
              <input id={`doc-${key}`} type="file" accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only" style={{ display: 'none' }} disabled={slot.uploading}
                onChange={e => handleFile(key, e.target.files[0])} />

              <div style={{
                border: `2px dashed ${slot.uploaded ? '#86EFAC' : slot.error ? '#FECDD3' : '#CBD5E1'}`,
                borderRadius: '0.75rem', background: slot.uploaded ? '#F0FDF4' : C.bg,
                padding: '20px', transition: 'all 150ms',
              }}>
                {slot.uploaded ? (
                  /* Uploaded state */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#DCFCE7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0 }}>✓</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#16A34A' }}>{label} — Uploaded</div>
                      <div style={{ fontSize: '12px', color: C.textMuted }}>
                        {slot.uploaded.file?.split('/').pop() || 'Document on file'} · Click to replace
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <UploadIcon />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: C.textPrimary, marginBottom: 2 }}>
                      {slot.uploading ? 'Uploading…' : label}
                    </div>
                    {!slot.uploading && (
                      <div style={{ fontSize: '12px', color: C.textMuted }}>
                        Click to upload &nbsp;<span style={{ color: C.primary }}>or drag and drop</span>
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: C.textMuted, marginTop: 4 }}>{hint}</div>
                  </div>
                )}

                {slot.error && (
                  <div style={{ marginTop: 10, fontSize: '12px', color: '#E11D48',
                    background: '#FFF1F2', borderRadius: '0.375rem', padding: '6px 10px' }}>
                    ⚠ {slot.error}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {!atLeastOne && (
        <p style={{ marginTop: 16, fontSize: '13px', color: '#F97316', fontWeight: '500' }}>
          ⚠ Upload at least one document to continue.
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={() => navigate('/onboarding/step/2')} style={btn.ghost}>← Back</button>
        <button onClick={() => navigate('/onboarding/review')} disabled={!atLeastOne}
          style={{ ...btn.primary, flex: 1, opacity: atLeastOne ? 1 : 0.4 }}>
          Continue →
        </button>
      </div>
    </OnboardingLayout>
  );
}
.Groups[1].Value)styles.jsx'" ;

const DOC_SLOTS = [
  { key: 'pan',            label: 'PAN Card',        hint: 'PDF, JPG or PNG — max 5 MB' },
  { key: 'aadhaar',        label: 'Aadhaar Card',    hint: 'PDF, JPG or PNG — max 5 MB' },
  { key: 'bank_statement', label: 'Bank Statement',  hint: 'PDF, JPG or PNG — max 5 MB' },
];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES    = 5 * 1024 * 1024;

function UploadIcon() {
  return (
    <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
    </svg>
  );
}

function validateFile(file) {
  if (file.size > MAX_BYTES)            return `File too large (${(file.size/1024/1024).toFixed(1)} MB). Max is 5 MB.`;
  if (!ALLOWED_MIME.includes(file.type)) return `Invalid type (${file.type || 'unknown'}). Only PDF, JPG, PNG allowed.`;
  return null;
}

export default function OnboardingStep3() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();
  const [slots, setSlots] = useState(() =>
    Object.fromEntries(DOC_SLOTS.map(d => [d.key, { uploaded: null, uploading: false, error: '' }]))
  );

  useEffect(() => {
    if (!appData?.documents) return;
    const latest = {};
    appData.documents.forEach(doc => {
      if (!latest[doc.doc_type] || doc.id > latest[doc.doc_type].id) latest[doc.doc_type] = doc;
    });
    setSlots(prev => {
      const next = { ...prev };
      DOC_SLOTS.forEach(d => { next[d.key] = { ...next[d.key], uploaded: latest[d.key] || null }; });
      return next;
    });
  }, [appData]);

  function setSlot(key, patch) { setSlots(prev => ({ ...prev, [key]: { ...prev[key], ...patch } })); }

  async function handleFile(key, file) {
    if (!file) return;
    const err = validateFile(file);
    if (err) { setSlot(key, { error: err }); return; }
    setSlot(key, { uploading: true, error: '' });
    try {
      const fd = new FormData(); fd.append('doc_type', key); fd.append('file', file);
      const res = await api.post(`/applications/${appId}/documents/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSlot(key, { uploaded: res.data, uploading: false });
    } catch (err) {
      setSlot(key, { error: err.response?.data?.error || 'Upload failed', uploading: false });
    }
  }

  const atLeastOne = DOC_SLOTS.some(d => slots[d.key].uploaded);
  if (appLoading) return <Spinner />;

  return (
    <OnboardingLayout currentStep={3}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: C.textPrimary, marginBottom: 6 }}>
        Upload Documents
      </h1>
      <p style={{ fontSize: '14px', color: C.textSecondary, marginBottom: 28 }}>
        Upload at least one document. Accepted: PDF, JPG, PNG (max 5 MB each).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {DOC_SLOTS.map(({ key, label, hint }) => {
          const slot = slots[key];
          return (
            <label key={key} htmlFor={`doc-${key}`} style={{ cursor: 'pointer', display: 'block' }}>
              <input id={`doc-${key}`} type="file" accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only" style={{ display: 'none' }} disabled={slot.uploading}
                onChange={e => handleFile(key, e.target.files[0])} />

              <div style={{
                border: `2px dashed ${slot.uploaded ? '#86EFAC' : slot.error ? '#FECDD3' : '#CBD5E1'}`,
                borderRadius: '0.75rem', background: slot.uploaded ? '#F0FDF4' : C.bg,
                padding: '20px', transition: 'all 150ms',
              }}>
                {slot.uploaded ? (
                  /* Uploaded state */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#DCFCE7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0 }}>✓</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#16A34A' }}>{label} — Uploaded</div>
                      <div style={{ fontSize: '12px', color: C.textMuted }}>
                        {slot.uploaded.file?.split('/').pop() || 'Document on file'} · Click to replace
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <UploadIcon />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: C.textPrimary, marginBottom: 2 }}>
                      {slot.uploading ? 'Uploading…' : label}
                    </div>
                    {!slot.uploading && (
                      <div style={{ fontSize: '12px', color: C.textMuted }}>
                        Click to upload &nbsp;<span style={{ color: C.primary }}>or drag and drop</span>
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: C.textMuted, marginTop: 4 }}>{hint}</div>
                  </div>
                )}

                {slot.error && (
                  <div style={{ marginTop: 10, fontSize: '12px', color: '#E11D48',
                    background: '#FFF1F2', borderRadius: '0.375rem', padding: '6px 10px' }}>
                    ⚠ {slot.error}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {!atLeastOne && (
        <p style={{ marginTop: 16, fontSize: '13px', color: '#F97316', fontWeight: '500' }}>
          ⚠ Upload at least one document to continue.
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={() => navigate('/onboarding/step/2')} style={btn.ghost}>← Back</button>
        <button onClick={() => navigate('/onboarding/review')} disabled={!atLeastOne}
          style={{ ...btn.primary, flex: 1, opacity: atLeastOne ? 1 : 0.4 }}>
          Continue →
        </button>
      </div>
    </OnboardingLayout>
  );
}
.Groups[1].Value)styles.jsx'" ;

const DOC_SLOTS = [
  { key: 'pan',            label: 'PAN Card',        hint: 'PDF, JPG or PNG — max 5 MB' },
  { key: 'aadhaar',        label: 'Aadhaar Card',    hint: 'PDF, JPG or PNG — max 5 MB' },
  { key: 'bank_statement', label: 'Bank Statement',  hint: 'PDF, JPG or PNG — max 5 MB' },
];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES    = 5 * 1024 * 1024;

function UploadIcon() {
  return (
    <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
    </svg>
  );
}

function validateFile(file) {
  if (file.size > MAX_BYTES)            return `File too large (${(file.size/1024/1024).toFixed(1)} MB). Max is 5 MB.`;
  if (!ALLOWED_MIME.includes(file.type)) return `Invalid type (${file.type || 'unknown'}). Only PDF, JPG, PNG allowed.`;
  return null;
}

export default function OnboardingStep3() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();
  const [slots, setSlots] = useState(() =>
    Object.fromEntries(DOC_SLOTS.map(d => [d.key, { uploaded: null, uploading: false, error: '' }]))
  );

  useEffect(() => {
    if (!appData?.documents) return;
    const latest = {};
    appData.documents.forEach(doc => {
      if (!latest[doc.doc_type] || doc.id > latest[doc.doc_type].id) latest[doc.doc_type] = doc;
    });
    setSlots(prev => {
      const next = { ...prev };
      DOC_SLOTS.forEach(d => { next[d.key] = { ...next[d.key], uploaded: latest[d.key] || null }; });
      return next;
    });
  }, [appData]);

  function setSlot(key, patch) { setSlots(prev => ({ ...prev, [key]: { ...prev[key], ...patch } })); }

  async function handleFile(key, file) {
    if (!file) return;
    const err = validateFile(file);
    if (err) { setSlot(key, { error: err }); return; }
    setSlot(key, { uploading: true, error: '' });
    try {
      const fd = new FormData(); fd.append('doc_type', key); fd.append('file', file);
      const res = await api.post(`/applications/${appId}/documents/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSlot(key, { uploaded: res.data, uploading: false });
    } catch (err) {
      setSlot(key, { error: err.response?.data?.error || 'Upload failed', uploading: false });
    }
  }

  const atLeastOne = DOC_SLOTS.some(d => slots[d.key].uploaded);
  if (appLoading) return <Spinner />;

  return (
    <OnboardingLayout currentStep={3}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: C.textPrimary, marginBottom: 6 }}>
        Upload Documents
      </h1>
      <p style={{ fontSize: '14px', color: C.textSecondary, marginBottom: 28 }}>
        Upload at least one document. Accepted: PDF, JPG, PNG (max 5 MB each).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {DOC_SLOTS.map(({ key, label, hint }) => {
          const slot = slots[key];
          return (
            <label key={key} htmlFor={`doc-${key}`} style={{ cursor: 'pointer', display: 'block' }}>
              <input id={`doc-${key}`} type="file" accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only" style={{ display: 'none' }} disabled={slot.uploading}
                onChange={e => handleFile(key, e.target.files[0])} />

              <div style={{
                border: `2px dashed ${slot.uploaded ? '#86EFAC' : slot.error ? '#FECDD3' : '#CBD5E1'}`,
                borderRadius: '0.75rem', background: slot.uploaded ? '#F0FDF4' : C.bg,
                padding: '20px', transition: 'all 150ms',
              }}>
                {slot.uploaded ? (
                  /* Uploaded state */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#DCFCE7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0 }}>✓</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#16A34A' }}>{label} — Uploaded</div>
                      <div style={{ fontSize: '12px', color: C.textMuted }}>
                        {slot.uploaded.file?.split('/').pop() || 'Document on file'} · Click to replace
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <UploadIcon />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: C.textPrimary, marginBottom: 2 }}>
                      {slot.uploading ? 'Uploading…' : label}
                    </div>
                    {!slot.uploading && (
                      <div style={{ fontSize: '12px', color: C.textMuted }}>
                        Click to upload &nbsp;<span style={{ color: C.primary }}>or drag and drop</span>
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: C.textMuted, marginTop: 4 }}>{hint}</div>
                  </div>
                )}

                {slot.error && (
                  <div style={{ marginTop: 10, fontSize: '12px', color: '#E11D48',
                    background: '#FFF1F2', borderRadius: '0.375rem', padding: '6px 10px' }}>
                    ⚠ {slot.error}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {!atLeastOne && (
        <p style={{ marginTop: 16, fontSize: '13px', color: '#F97316', fontWeight: '500' }}>
          ⚠ Upload at least one document to continue.
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={() => navigate('/onboarding/step/2')} style={btn.ghost}>← Back</button>
        <button onClick={() => navigate('/onboarding/review')} disabled={!atLeastOne}
          style={{ ...btn.primary, flex: 1, opacity: atLeastOne ? 1 : 0.4 }}>
          Continue →
        </button>
      </div>
    </OnboardingLayout>
  );
}
.Groups[1].Value)styles.jsx'" ;

const DOC_SLOTS = [
  { key: 'pan',            label: 'PAN Card',        hint: 'PDF, JPG or PNG — max 5 MB' },
  { key: 'aadhaar',        label: 'Aadhaar Card',    hint: 'PDF, JPG or PNG — max 5 MB' },
  { key: 'bank_statement', label: 'Bank Statement',  hint: 'PDF, JPG or PNG — max 5 MB' },
];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES    = 5 * 1024 * 1024;

function UploadIcon() {
  return (
    <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
    </svg>
  );
}

function validateFile(file) {
  if (file.size > MAX_BYTES)            return `File too large (${(file.size/1024/1024).toFixed(1)} MB). Max is 5 MB.`;
  if (!ALLOWED_MIME.includes(file.type)) return `Invalid type (${file.type || 'unknown'}). Only PDF, JPG, PNG allowed.`;
  return null;
}

export default function OnboardingStep3() {
  const navigate = useNavigate();
  const { appId, appData, loading: appLoading } = useOnboarding();
  const [slots, setSlots] = useState(() =>
    Object.fromEntries(DOC_SLOTS.map(d => [d.key, { uploaded: null, uploading: false, error: '' }]))
  );

  useEffect(() => {
    if (!appData?.documents) return;
    const latest = {};
    appData.documents.forEach(doc => {
      if (!latest[doc.doc_type] || doc.id > latest[doc.doc_type].id) latest[doc.doc_type] = doc;
    });
    setSlots(prev => {
      const next = { ...prev };
      DOC_SLOTS.forEach(d => { next[d.key] = { ...next[d.key], uploaded: latest[d.key] || null }; });
      return next;
    });
  }, [appData]);

  function setSlot(key, patch) { setSlots(prev => ({ ...prev, [key]: { ...prev[key], ...patch } })); }

  async function handleFile(key, file) {
    if (!file) return;
    const err = validateFile(file);
    if (err) { setSlot(key, { error: err }); return; }
    setSlot(key, { uploading: true, error: '' });
    try {
      const fd = new FormData(); fd.append('doc_type', key); fd.append('file', file);
      const res = await api.post(`/applications/${appId}/documents/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSlot(key, { uploaded: res.data, uploading: false });
    } catch (err) {
      setSlot(key, { error: err.response?.data?.error || 'Upload failed', uploading: false });
    }
  }

  const atLeastOne = DOC_SLOTS.some(d => slots[d.key].uploaded);
  if (appLoading) return <Spinner />;

  return (
    <OnboardingLayout currentStep={3}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: C.textPrimary, marginBottom: 6 }}>
        Upload Documents
      </h1>
      <p style={{ fontSize: '14px', color: C.textSecondary, marginBottom: 28 }}>
        Upload at least one document. Accepted: PDF, JPG, PNG (max 5 MB each).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {DOC_SLOTS.map(({ key, label, hint }) => {
          const slot = slots[key];
          return (
            <label key={key} htmlFor={`doc-${key}`} style={{ cursor: 'pointer', display: 'block' }}>
              <input id={`doc-${key}`} type="file" accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only" style={{ display: 'none' }} disabled={slot.uploading}
                onChange={e => handleFile(key, e.target.files[0])} />

              <div style={{
                border: `2px dashed ${slot.uploaded ? '#86EFAC' : slot.error ? '#FECDD3' : '#CBD5E1'}`,
                borderRadius: '0.75rem', background: slot.uploaded ? '#F0FDF4' : C.bg,
                padding: '20px', transition: 'all 150ms',
              }}>
                {slot.uploaded ? (
                  /* Uploaded state */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#DCFCE7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0 }}>✓</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#16A34A' }}>{label} — Uploaded</div>
                      <div style={{ fontSize: '12px', color: C.textMuted }}>
                        {slot.uploaded.file?.split('/').pop() || 'Document on file'} · Click to replace
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <UploadIcon />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: C.textPrimary, marginBottom: 2 }}>
                      {slot.uploading ? 'Uploading…' : label}
                    </div>
                    {!slot.uploading && (
                      <div style={{ fontSize: '12px', color: C.textMuted }}>
                        Click to upload &nbsp;<span style={{ color: C.primary }}>or drag and drop</span>
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: C.textMuted, marginTop: 4 }}>{hint}</div>
                  </div>
                )}

                {slot.error && (
                  <div style={{ marginTop: 10, fontSize: '12px', color: '#E11D48',
                    background: '#FFF1F2', borderRadius: '0.375rem', padding: '6px 10px' }}>
                    ⚠ {slot.error}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {!atLeastOne && (
        <p style={{ marginTop: 16, fontSize: '13px', color: '#F97316', fontWeight: '500' }}>
          ⚠ Upload at least one document to continue.
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={() => navigate('/onboarding/step/2')} style={btn.ghost}>← Back</button>
        <button onClick={() => navigate('/onboarding/review')} disabled={!atLeastOne}
          style={{ ...btn.primary, flex: 1, opacity: atLeastOne ? 1 : 0.4 }}>
          Continue →
        </button>
      </div>
    </OnboardingLayout>
  );
}
