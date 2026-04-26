import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { C }  "from '$(import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { C }  "from '$(import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { C }  "from '$(import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { C } from '../styles';

const REVIEWER_NAV = [{ label: 'Review Queue', path: '/reviewer/queue', icon: ListIcon }];
const MERCHANT_NAV = [{ label: 'Dashboard', path: '/dashboard', icon: DashIcon }];

function ListIcon() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>;
}
function DashIcon() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}

export default function AppShell({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role  = localStorage.getItem('kyc_role') || 'merchant';
  const email = localStorage.getItem('kyc_email') || '';
  const navItems = role === 'reviewer' ? REVIEWER_NAV : MERCHANT_NAV;

  function logout() {
    ['kyc_token','kyc_role','kyc_email','kyc_app_id'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0, background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: C.primary }}>Playto KYC</div>
          <div style={{ fontSize: '11px', color: C.textMuted, marginTop: 2 }}>
            {role === 'reviewer' ? 'Reviewer Portal' : 'Merchant Portal'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px' }}>
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: '0.5rem', marginBottom: 2,
                fontSize: '14px', fontWeight: '500', textDecoration: 'none',
                color: active ? '#FFFFFF' : C.textSecondary,
                background: active ? C.primary : 'transparent',
                transition: 'all 150ms',
              }}>
                <Icon />{label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: C.textPrimary, marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email || role}
          </div>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontWeight: '600',
            padding: '2px 8px', borderRadius: '9999px', marginBottom: '12px',
            background: role === 'reviewer' ? '#EFF6FF' : '#F0FDF4',
            color: role === 'reviewer' ? '#3B82F6' : '#16A34A',
          }}>
            {role === 'reviewer' ? 'Reviewer' : 'Merchant'}
          </span>
          <button onClick={logout} style={{
            display: 'block', background: 'none', border: 'none', padding: 0,
            fontSize: '13px', color: C.textSecondary, cursor: 'pointer', fontWeight: '500',
          }}>
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: '0 32px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600', color: C.textPrimary }}>{title}</h1>
          <span style={{ fontSize: '13px', color: C.textSecondary }}>{email}</span>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
.Groups[1].Value)styles.jsx'" ;

const REVIEWER_NAV = [{ label: 'Review Queue', path: '/reviewer/queue', icon: ListIcon }];
const MERCHANT_NAV = [{ label: 'Dashboard', path: '/dashboard', icon: DashIcon }];

function ListIcon() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>;
}
function DashIcon() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}

export default function AppShell({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role  = localStorage.getItem('kyc_role') || 'merchant';
  const email = localStorage.getItem('kyc_email') || '';
  const navItems = role === 'reviewer' ? REVIEWER_NAV : MERCHANT_NAV;

  function logout() {
    ['kyc_token','kyc_role','kyc_email','kyc_app_id'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0, background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: C.primary }}>Playto KYC</div>
          <div style={{ fontSize: '11px', color: C.textMuted, marginTop: 2 }}>
            {role === 'reviewer' ? 'Reviewer Portal' : 'Merchant Portal'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px' }}>
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: '0.5rem', marginBottom: 2,
                fontSize: '14px', fontWeight: '500', textDecoration: 'none',
                color: active ? '#FFFFFF' : C.textSecondary,
                background: active ? C.primary : 'transparent',
                transition: 'all 150ms',
              }}>
                <Icon />{label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: C.textPrimary, marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email || role}
          </div>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontWeight: '600',
            padding: '2px 8px', borderRadius: '9999px', marginBottom: '12px',
            background: role === 'reviewer' ? '#EFF6FF' : '#F0FDF4',
            color: role === 'reviewer' ? '#3B82F6' : '#16A34A',
          }}>
            {role === 'reviewer' ? 'Reviewer' : 'Merchant'}
          </span>
          <button onClick={logout} style={{
            display: 'block', background: 'none', border: 'none', padding: 0,
            fontSize: '13px', color: C.textSecondary, cursor: 'pointer', fontWeight: '500',
          }}>
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: '0 32px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600', color: C.textPrimary }}>{title}</h1>
          <span style={{ fontSize: '13px', color: C.textSecondary }}>{email}</span>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
.Groups[1].Value)styles.jsx'" ;

const REVIEWER_NAV = [{ label: 'Review Queue', path: '/reviewer/queue', icon: ListIcon }];
const MERCHANT_NAV = [{ label: 'Dashboard', path: '/dashboard', icon: DashIcon }];

function ListIcon() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>;
}
function DashIcon() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}

export default function AppShell({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role  = localStorage.getItem('kyc_role') || 'merchant';
  const email = localStorage.getItem('kyc_email') || '';
  const navItems = role === 'reviewer' ? REVIEWER_NAV : MERCHANT_NAV;

  function logout() {
    ['kyc_token','kyc_role','kyc_email','kyc_app_id'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0, background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: C.primary }}>Playto KYC</div>
          <div style={{ fontSize: '11px', color: C.textMuted, marginTop: 2 }}>
            {role === 'reviewer' ? 'Reviewer Portal' : 'Merchant Portal'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px' }}>
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: '0.5rem', marginBottom: 2,
                fontSize: '14px', fontWeight: '500', textDecoration: 'none',
                color: active ? '#FFFFFF' : C.textSecondary,
                background: active ? C.primary : 'transparent',
                transition: 'all 150ms',
              }}>
                <Icon />{label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: C.textPrimary, marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email || role}
          </div>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontWeight: '600',
            padding: '2px 8px', borderRadius: '9999px', marginBottom: '12px',
            background: role === 'reviewer' ? '#EFF6FF' : '#F0FDF4',
            color: role === 'reviewer' ? '#3B82F6' : '#16A34A',
          }}>
            {role === 'reviewer' ? 'Reviewer' : 'Merchant'}
          </span>
          <button onClick={logout} style={{
            display: 'block', background: 'none', border: 'none', padding: 0,
            fontSize: '13px', color: C.textSecondary, cursor: 'pointer', fontWeight: '500',
          }}>
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: '0 32px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600', color: C.textPrimary }}>{title}</h1>
          <span style={{ fontSize: '13px', color: C.textSecondary }}>{email}</span>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
.Groups[1].Value)styles.jsx'" ;

const REVIEWER_NAV = [{ label: 'Review Queue', path: '/reviewer/queue', icon: ListIcon }];
const MERCHANT_NAV = [{ label: 'Dashboard', path: '/dashboard', icon: DashIcon }];

function ListIcon() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>;
}
function DashIcon() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}

export default function AppShell({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role  = localStorage.getItem('kyc_role') || 'merchant';
  const email = localStorage.getItem('kyc_email') || '';
  const navItems = role === 'reviewer' ? REVIEWER_NAV : MERCHANT_NAV;

  function logout() {
    ['kyc_token','kyc_role','kyc_email','kyc_app_id'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0, background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: C.primary }}>Playto KYC</div>
          <div style={{ fontSize: '11px', color: C.textMuted, marginTop: 2 }}>
            {role === 'reviewer' ? 'Reviewer Portal' : 'Merchant Portal'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px' }}>
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: '0.5rem', marginBottom: 2,
                fontSize: '14px', fontWeight: '500', textDecoration: 'none',
                color: active ? '#FFFFFF' : C.textSecondary,
                background: active ? C.primary : 'transparent',
                transition: 'all 150ms',
              }}>
                <Icon />{label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: C.textPrimary, marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email || role}
          </div>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontWeight: '600',
            padding: '2px 8px', borderRadius: '9999px', marginBottom: '12px',
            background: role === 'reviewer' ? '#EFF6FF' : '#F0FDF4',
            color: role === 'reviewer' ? '#3B82F6' : '#16A34A',
          }}>
            {role === 'reviewer' ? 'Reviewer' : 'Merchant'}
          </span>
          <button onClick={logout} style={{
            display: 'block', background: 'none', border: 'none', padding: 0,
            fontSize: '13px', color: C.textSecondary, cursor: 'pointer', fontWeight: '500',
          }}>
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: '0 32px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600', color: C.textPrimary }}>{title}</h1>
          <span style={{ fontSize: '13px', color: C.textSecondary }}>{email}</span>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
