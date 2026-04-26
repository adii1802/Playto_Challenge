/**
 * OnboardingLayout.jsx
 * Wraps all onboarding steps with a header, step progress bar, and consistent card container.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { num: 1, label: 'Personal' },
  { num: 2, label: 'Business' },
  { num: 3, label: 'Documents' },
  { num: 4, label: 'Review' },
];

export default function OnboardingLayout({ currentStep, children }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('kyc_token');
    localStorage.removeItem('kyc_role');
    localStorage.removeItem('kyc_app_id');
    navigate('/login');
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>Playto KYC</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#1a3a2a', color: 'var(--green)' }}>
            Onboarding
          </span>
        </div>
        <button onClick={handleLogout} className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Sign out
        </button>
      </header>

      {/* Step progress */}
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center">
          {STEPS.map((step, i) => {
            const done = currentStep > step.num;
            const active = currentStep === step.num;
            return (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: (done || active) ? '#0d1117' : 'var(--text-muted)',
                      border: active ? 'none' : `1px solid var(--border)`,
                    }}
                  >
                    {done ? '✓' : step.num}
                  </div>
                  <span
                    className="text-xs mt-1 font-medium"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2 mb-4"
                    style={{ background: done ? 'var(--green)' : 'var(--border)' }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content card */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <div
          className="rounded-2xl border p-8"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
