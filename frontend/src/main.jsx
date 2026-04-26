import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import ReviewerQueue from './pages/ReviewerQueue';
import ReviewerApplicationDetail from './pages/ReviewerApplicationDetail';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('kyc_token');
  const role = localStorage.getItem('kyc_role');
  if (!token || role !== 'reviewer') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function LoginPage() {
  const [email, setEmail] = React.useState('reviewer@test.com');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.role !== 'reviewer') throw new Error('This dashboard is for reviewers only.');
      localStorage.setItem('kyc_token', data.token);
      localStorage.setItem('kyc_role', data.role);
      window.location.href = '/reviewer/queue';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="mb-8 text-center">
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent)' }}>Playto KYC</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Reviewer Dashboard</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Password</label>
            <input
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
            className="w-full py-2 rounded-lg font-semibold text-sm transition-opacity"
            style={{ background: 'var(--accent)', color: '#0d1117', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reviewer/queue" element={<ProtectedRoute><ReviewerQueue /></ProtectedRoute>} />
      <Route path="/reviewer/application/:id" element={<ProtectedRoute><ReviewerApplicationDetail /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/reviewer/queue" replace />} />
    </Routes>
  </BrowserRouter>
);
