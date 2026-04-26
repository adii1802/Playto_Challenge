// Shared design tokens for the Playto KYC light theme.
// Import from any component: import { C, STATUS, btn, inp, lbl, card } from '../styles';

export const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  secondary: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
};

export const STATUS = {
  draft:               { bg: '#F1F5F9', text: '#64748B', label: 'Draft' },
  submitted:           { bg: '#EFF6FF', text: '#3B82F6', label: 'Submitted' },
  under_review:        { bg: '#FFF7ED', text: '#F97316', label: 'Under Review' },
  approved:            { bg: '#F0FDF4', text: '#16A34A', label: 'Approved' },
  rejected:            { bg: '#FFF1F2', text: '#E11D48', label: 'Rejected' },
  more_info_requested: { bg: '#FDF4FF', text: '#A855F7', label: 'More Info Req.' },
};

export const btn = {
  primary: {
    background: '#6366F1', color: '#FFFFFF', border: 'none',
    borderRadius: '0.5rem', padding: '0.5rem 1rem',
    fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background 150ms',
  },
  secondary: {
    background: '#FFFFFF', color: '#1E293B', border: '1px solid #E2E8F0',
    borderRadius: '0.5rem', padding: '0.5rem 1rem',
    fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background 150ms',
  },
  danger: {
    background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3',
    borderRadius: '0.5rem', padding: '0.5rem 1rem',
    fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background 150ms',
  },
  ghost: {
    background: 'transparent', color: '#64748B', border: 'none',
    borderRadius: '0.5rem', padding: '0.5rem 1rem',
    fontSize: '14px', fontWeight: '500', cursor: 'pointer',
  },
};

export const inp = {
  display: 'block', width: '100%',
  background: '#FFFFFF', border: '1px solid #E2E8F0',
  borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
  fontSize: '14px', color: '#1E293B',
};

export const lbl = {
  display: 'block', fontSize: '12px', fontWeight: '500',
  color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px',
};

export const card = {
  background: '#FFFFFF', border: '1px solid #E2E8F0',
  borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '24px',
};

