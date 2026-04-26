import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AppShell from '../components/AppShell';
import { C, STATUS, StatusBadge, Spinner }  "from '$(import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AppShell from '../components/AppShell';
import { C, STATUS, StatusBadge, Spinner }  "from '$(import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AppShell from '../components/AppShell';
import { C, STATUS, StatusBadge, Spinner }  "from '$(import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AppShell from '../components/AppShell';
import { C, STATUS, StatusBadge, Spinner } from '../styles';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function MetricCard({ label, value, borderColor }) {
  return (
    <div style={{
      flex: 1, background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      padding: '20px 24px', borderLeft: `4px solid ${borderColor}`,
    }}>
      <div style={{ fontSize: '32px', fontWeight: '700', color: C.textPrimary, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', color: C.textSecondary, marginTop: 6, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

export default function ReviewerQueue() {
  const navigate = useNavigate();
  const [queue,   setQueue]   = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [qRes, mRes] = await Promise.all([
        api.get('/reviewer/queue/'),
        api.get('/reviewer/metrics/'),
      ]);
      setQueue(qRes.data);
      setMetrics(mRes.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load data';
      setError(msg);
      if (err.response?.status === 403) { localStorage.clear(); navigate('/login'); }
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Spinner />;

  return (
    <AppShell title="Review Queue">
      {/* Error */}
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          <MetricCard label="In Queue" value={metrics.queue_count} borderColor="#6366F1" />
          <MetricCard
            label="Avg. Time in Queue"
            value={metrics.avg_time_in_queue_hours != null ? `${metrics.avg_time_in_queue_hours}h` : '—'}
            borderColor="#F97316"
          />
          <MetricCard
            label="7-Day Approval Rate"
            value={metrics.approval_rate_last_7_days != null ? `${metrics.approval_rate_last_7_days}%` : '—'}
            borderColor="#16A34A"
          />
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        {/* Refresh */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: C.textPrimary }}>Applications</span>
          <button onClick={fetchData}
            style={{ background: C.secondary, border: `1px solid ${C.border}`, borderRadius: '0.5rem',
              padding: '6px 12px', fontSize: '13px', fontWeight: '500', color: C.textSecondary, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['ID', 'Merchant', 'Status', 'Submitted', 'SLA'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px',
                  fontWeight: '600', color: C.textSecondary, textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.textMuted }}>
                ✓ Queue is empty
              </td></tr>
            ) : queue.map(app => (
              <tr key={app.id}
                onClick={() => navigate(`/reviewer/application/${app.id}`)}
                style={{
                  cursor: 'pointer', borderBottom: `1px solid ${C.secondary}`,
                  borderLeft: app.at_risk ? '3px solid #E11D48' : '3px solid transparent',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 20px', fontSize: '13px', color: C.textMuted, fontFamily: 'monospace' }}>
                  #{app.id}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: '500', color: C.textPrimary }}>{app.merchant_name}</div>
                  <div style={{ fontSize: '12px', color: C.textMuted }}>{app.merchant_email}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <StatusBadge status={app.status} />
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: C.textSecondary }}>
                  {fmtDate(app.submitted_at)}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  {app.at_risk ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3',
                      borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: '600' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E11D48', display: 'inline-block' }} />
                      AT RISK
                    </span>
                  ) : (
                    <span style={{ color: C.textMuted, fontSize: '13px' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
.Groups[1].Value)styles.jsx'" ;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function MetricCard({ label, value, borderColor }) {
  return (
    <div style={{
      flex: 1, background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      padding: '20px 24px', borderLeft: `4px solid ${borderColor}`,
    }}>
      <div style={{ fontSize: '32px', fontWeight: '700', color: C.textPrimary, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', color: C.textSecondary, marginTop: 6, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

export default function ReviewerQueue() {
  const navigate = useNavigate();
  const [queue,   setQueue]   = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [qRes, mRes] = await Promise.all([
        api.get('/reviewer/queue/'),
        api.get('/reviewer/metrics/'),
      ]);
      setQueue(qRes.data);
      setMetrics(mRes.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load data';
      setError(msg);
      if (err.response?.status === 403) { localStorage.clear(); navigate('/login'); }
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Spinner />;

  return (
    <AppShell title="Review Queue">
      {/* Error */}
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          <MetricCard label="In Queue" value={metrics.queue_count} borderColor="#6366F1" />
          <MetricCard
            label="Avg. Time in Queue"
            value={metrics.avg_time_in_queue_hours != null ? `${metrics.avg_time_in_queue_hours}h` : '—'}
            borderColor="#F97316"
          />
          <MetricCard
            label="7-Day Approval Rate"
            value={metrics.approval_rate_last_7_days != null ? `${metrics.approval_rate_last_7_days}%` : '—'}
            borderColor="#16A34A"
          />
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        {/* Refresh */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: C.textPrimary }}>Applications</span>
          <button onClick={fetchData}
            style={{ background: C.secondary, border: `1px solid ${C.border}`, borderRadius: '0.5rem',
              padding: '6px 12px', fontSize: '13px', fontWeight: '500', color: C.textSecondary, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['ID', 'Merchant', 'Status', 'Submitted', 'SLA'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px',
                  fontWeight: '600', color: C.textSecondary, textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.textMuted }}>
                ✓ Queue is empty
              </td></tr>
            ) : queue.map(app => (
              <tr key={app.id}
                onClick={() => navigate(`/reviewer/application/${app.id}`)}
                style={{
                  cursor: 'pointer', borderBottom: `1px solid ${C.secondary}`,
                  borderLeft: app.at_risk ? '3px solid #E11D48' : '3px solid transparent',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 20px', fontSize: '13px', color: C.textMuted, fontFamily: 'monospace' }}>
                  #{app.id}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: '500', color: C.textPrimary }}>{app.merchant_name}</div>
                  <div style={{ fontSize: '12px', color: C.textMuted }}>{app.merchant_email}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <StatusBadge status={app.status} />
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: C.textSecondary }}>
                  {fmtDate(app.submitted_at)}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  {app.at_risk ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3',
                      borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: '600' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E11D48', display: 'inline-block' }} />
                      AT RISK
                    </span>
                  ) : (
                    <span style={{ color: C.textMuted, fontSize: '13px' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
.Groups[1].Value)styles.jsx'" ;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function MetricCard({ label, value, borderColor }) {
  return (
    <div style={{
      flex: 1, background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      padding: '20px 24px', borderLeft: `4px solid ${borderColor}`,
    }}>
      <div style={{ fontSize: '32px', fontWeight: '700', color: C.textPrimary, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', color: C.textSecondary, marginTop: 6, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

export default function ReviewerQueue() {
  const navigate = useNavigate();
  const [queue,   setQueue]   = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [qRes, mRes] = await Promise.all([
        api.get('/reviewer/queue/'),
        api.get('/reviewer/metrics/'),
      ]);
      setQueue(qRes.data);
      setMetrics(mRes.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load data';
      setError(msg);
      if (err.response?.status === 403) { localStorage.clear(); navigate('/login'); }
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Spinner />;

  return (
    <AppShell title="Review Queue">
      {/* Error */}
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          <MetricCard label="In Queue" value={metrics.queue_count} borderColor="#6366F1" />
          <MetricCard
            label="Avg. Time in Queue"
            value={metrics.avg_time_in_queue_hours != null ? `${metrics.avg_time_in_queue_hours}h` : '—'}
            borderColor="#F97316"
          />
          <MetricCard
            label="7-Day Approval Rate"
            value={metrics.approval_rate_last_7_days != null ? `${metrics.approval_rate_last_7_days}%` : '—'}
            borderColor="#16A34A"
          />
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        {/* Refresh */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: C.textPrimary }}>Applications</span>
          <button onClick={fetchData}
            style={{ background: C.secondary, border: `1px solid ${C.border}`, borderRadius: '0.5rem',
              padding: '6px 12px', fontSize: '13px', fontWeight: '500', color: C.textSecondary, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['ID', 'Merchant', 'Status', 'Submitted', 'SLA'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px',
                  fontWeight: '600', color: C.textSecondary, textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.textMuted }}>
                ✓ Queue is empty
              </td></tr>
            ) : queue.map(app => (
              <tr key={app.id}
                onClick={() => navigate(`/reviewer/application/${app.id}`)}
                style={{
                  cursor: 'pointer', borderBottom: `1px solid ${C.secondary}`,
                  borderLeft: app.at_risk ? '3px solid #E11D48' : '3px solid transparent',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 20px', fontSize: '13px', color: C.textMuted, fontFamily: 'monospace' }}>
                  #{app.id}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: '500', color: C.textPrimary }}>{app.merchant_name}</div>
                  <div style={{ fontSize: '12px', color: C.textMuted }}>{app.merchant_email}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <StatusBadge status={app.status} />
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: C.textSecondary }}>
                  {fmtDate(app.submitted_at)}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  {app.at_risk ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3',
                      borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: '600' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E11D48', display: 'inline-block' }} />
                      AT RISK
                    </span>
                  ) : (
                    <span style={{ color: C.textMuted, fontSize: '13px' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
.Groups[1].Value)styles.jsx'" ;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function MetricCard({ label, value, borderColor }) {
  return (
    <div style={{
      flex: 1, background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      padding: '20px 24px', borderLeft: `4px solid ${borderColor}`,
    }}>
      <div style={{ fontSize: '32px', fontWeight: '700', color: C.textPrimary, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', color: C.textSecondary, marginTop: 6, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

export default function ReviewerQueue() {
  const navigate = useNavigate();
  const [queue,   setQueue]   = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [qRes, mRes] = await Promise.all([
        api.get('/reviewer/queue/'),
        api.get('/reviewer/metrics/'),
      ]);
      setQueue(qRes.data);
      setMetrics(mRes.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load data';
      setError(msg);
      if (err.response?.status === 403) { localStorage.clear(); navigate('/login'); }
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Spinner />;

  return (
    <AppShell title="Review Queue">
      {/* Error */}
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem',
          padding: '12px 16px', fontSize: '13px', color: '#E11D48', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          <MetricCard label="In Queue" value={metrics.queue_count} borderColor="#6366F1" />
          <MetricCard
            label="Avg. Time in Queue"
            value={metrics.avg_time_in_queue_hours != null ? `${metrics.avg_time_in_queue_hours}h` : '—'}
            borderColor="#F97316"
          />
          <MetricCard
            label="7-Day Approval Rate"
            value={metrics.approval_rate_last_7_days != null ? `${metrics.approval_rate_last_7_days}%` : '—'}
            borderColor="#16A34A"
          />
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        {/* Refresh */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: C.textPrimary }}>Applications</span>
          <button onClick={fetchData}
            style={{ background: C.secondary, border: `1px solid ${C.border}`, borderRadius: '0.5rem',
              padding: '6px 12px', fontSize: '13px', fontWeight: '500', color: C.textSecondary, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['ID', 'Merchant', 'Status', 'Submitted', 'SLA'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px',
                  fontWeight: '600', color: C.textSecondary, textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.textMuted }}>
                ✓ Queue is empty
              </td></tr>
            ) : queue.map(app => (
              <tr key={app.id}
                onClick={() => navigate(`/reviewer/application/${app.id}`)}
                style={{
                  cursor: 'pointer', borderBottom: `1px solid ${C.secondary}`,
                  borderLeft: app.at_risk ? '3px solid #E11D48' : '3px solid transparent',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 20px', fontSize: '13px', color: C.textMuted, fontFamily: 'monospace' }}>
                  #{app.id}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: '500', color: C.textPrimary }}>{app.merchant_name}</div>
                  <div style={{ fontSize: '12px', color: C.textMuted }}>{app.merchant_email}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <StatusBadge status={app.status} />
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: C.textSecondary }}>
                  {fmtDate(app.submitted_at)}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  {app.at_risk ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3',
                      borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: '600' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E11D48', display: 'inline-block' }} />
                      AT RISK
                    </span>
                  ) : (
                    <span style={{ color: C.textMuted, fontSize: '13px' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
