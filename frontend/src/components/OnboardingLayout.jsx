import React from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../styles';

const STEPS = [
  { num: 1, label: 'Personal' },
  { num: 2, label: 'Business' },
  { num: 3, label: 'Documents' },
  { num: 4, label: 'Review' },
];

export default function OnboardingLayout({ currentStep, children }) {
  const navigate = useNavigate();
  const email = localStorage.getItem('kyc_email') || '';

  function logout() {
    ['kyc_token','kyc_role','kyc_email','kyc_app_id'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  }

  const progress = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <span style={{ fontSize: '16px', fontWeight: '700', color: C.primary }}>Playto KYC</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {email && <span style={{ fontSize: '13px', color: C.textSecondary }}>{email}</span>}
          <button onClick={logout} style={{
            background: 'none', border: 'none', fontSize: '13px',
            color: C.textSecondary, cursor: 'pointer', fontWeight: '500',
          }}>Sign out</button>
        </div>
      </div>

      {/* Centered content */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px 60px' }}>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
          {STEPS.map((step, i) => {
            const done   = currentStep > step.num;
            const active = currentStep === step.num;
            return (
              <React.Fragment key={step.num}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '600',
                    background: done ? C.primary : active ? '#EEF2FF' : C.secondary,
                    color: done ? '#FFF' : active ? C.primary : C.textMuted,
                    border: active ? `2px solid ${C.primary}` : '1px solid transparent',
                    transition: 'all 200ms',
                  }}>
                    {done ? '✓' : step.num}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '500', marginTop: 6, textAlign: 'center',
                    color: active ? C.primary : done ? C.textSecondary : C.textMuted,
                  }}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, marginTop: 15, background: done ? C.primary : C.border,
                    transition: 'background 300ms',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: C.secondary, borderRadius: 9999, marginBottom: 28 }}>
          <div style={{
            height: '100%', background: C.primary, borderRadius: 9999,
            width: `${progress}%`, transition: 'width 300ms ease',
          }} />
        </div>

        {/* Card */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '32px',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
