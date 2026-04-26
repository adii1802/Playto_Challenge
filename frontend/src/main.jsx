import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';
import API_BASE from './api';

// Reviewer pages
import ReviewerQueue from './pages/ReviewerQueue';
import ReviewerApplicationDetail from './pages/ReviewerApplicationDetail';

// Merchant pages
import OnboardingStep1 from './pages/merchant/OnboardingStep1';
import OnboardingStep2 from './pages/merchant/OnboardingStep2';
import OnboardingStep3 from './pages/merchant/OnboardingStep3';
import OnboardingReview from './pages/merchant/OnboardingReview';
import MerchantDashboard from './pages/merchant/MerchantDashboard';

// ─── Route guards ────────────────────────────────────────────────────────────

function ReviewerRoute({ children }) {
  const token = localStorage.getItem('kyc_token');
  const role  = localStorage.getItem('kyc_role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'reviewer') return <Navigate to="/dashboard" replace />;
  return children;
}

function MerchantRoute({ children }) {
  const token = localStorage.getItem('kyc_token');
  const role  = localStorage.getItem('kyc_role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'merchant') return <Navigate to="/reviewer/queue" replace />;
  return children;
}

function AuthRoute({ children }) {
  // Already logged in? Redirect to the right place
  const token = localStorage.getItem('kyc_token');
  const role  = localStorage.getItem('kyc_role');
  if (token && role === 'reviewer') return <Navigate to="/reviewer/queue" replace />;
  if (token && role === 'merchant') return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Login page ───────────────────────────────────────────────────────────────

function LoginPage() {
  const [email,    setEmail]    = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error,    setError]    = React.useState('');
  const [loading,  setLoading]  = React.useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/api/v1/auth/login/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('kyc_token', data.token);
      localStorage.setItem('kyc_role',  data.role);
      localStorage.setItem('kyc_email', email);
      localStorage.removeItem('kyc_app_id');
      navigate(data.role === 'reviewer' ? '/reviewer/queue' : '/dashboard', { replace: true });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const fieldStyle = {
    display: 'block', width: '100%', background: '#FFFFFF',
    border: '1px solid #E2E8F0', borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem', fontSize: '14px', color: '#1E293B',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#6366F1', marginBottom: 4 }}>Playto KYC</div>
          <p style={{ fontSize: '14px', color: '#64748B' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '12px', fontWeight: '500',
                color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Email
              </label>
              <input id="login-email" type="email" required value={email}
                onChange={e => setEmail(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: '12px', fontWeight: '500',
                color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Password
              </label>
              <input id="login-password" type="password" required value={password}
                onChange={e => setPassword(e.target.value)} style={fieldStyle} />
            </div>

            {error && (
              <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
                padding: '10px 12px', fontSize: '13px', color: '#E11D48' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ background: '#6366F1', color: '#FFF', border: 'none', borderRadius: '0.5rem',
                padding: '0.625rem', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'background 150ms' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: 20 }}>
          Reviewer: <code>reviewer@test.com</code> &nbsp;|&nbsp;
          Merchant: <code>merchant_a@test.com</code> &nbsp;— all passwords: <code>test123</code>
        </p>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />

      {/* Reviewer */}
      <Route path="/reviewer/queue"             element={<ReviewerRoute><ReviewerQueue /></ReviewerRoute>} />
      <Route path="/reviewer/application/:id"   element={<ReviewerRoute><ReviewerApplicationDetail /></ReviewerRoute>} />

      {/* Merchant — onboarding */}
      <Route path="/onboarding"         element={<MerchantRoute><Navigate to="/onboarding/step/1" replace /></MerchantRoute>} />
      <Route path="/onboarding/step/1"  element={<MerchantRoute><OnboardingStep1 /></MerchantRoute>} />
      <Route path="/onboarding/step/2"  element={<MerchantRoute><OnboardingStep2 /></MerchantRoute>} />
      <Route path="/onboarding/step/3"  element={<MerchantRoute><OnboardingStep3 /></MerchantRoute>} />
      <Route path="/onboarding/review"  element={<MerchantRoute><OnboardingReview /></MerchantRoute>} />

      {/* Merchant — dashboard */}
      <Route path="/dashboard" element={<MerchantRoute><MerchantDashboard /></MerchantRoute>} />

      {/* Catch-all — send to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);
