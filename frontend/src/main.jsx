import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';

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
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('kyc_token', data.token);
      localStorage.setItem('kyc_role',  data.role);
      // Clear any stale app id from a previous session
      localStorage.removeItem('kyc_app_id');

      if (data.role === 'reviewer') navigate('/reviewer/queue', { replace: true });
      else                          navigate('/dashboard',       { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div
        className="w-full max-w-sm p-8 rounded-2xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="mb-8 text-center">
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent)' }}>Playto KYC</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to your account</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg font-semibold text-sm"
            style={{ background: 'var(--accent)', color: '#0d1117', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Test credentials — Reviewer: <code>reviewer@test.com</code> / <code>test123</code><br />
          Merchant: <code>merchant_a@test.com</code> or <code>merchant_b@test.com</code> / <code>test123</code>
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
