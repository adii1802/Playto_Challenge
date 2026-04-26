/**
 * useOnboarding.js
 * Finds-or-creates the merchant's active KYC application.
 * Stores app_id in localStorage so the session is resumable.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export function useOnboarding() {
  const [appId, setAppId] = useState(null);
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const storedId = localStorage.getItem('kyc_app_id');

        if (storedId) {
          try {
            const res = await api.get(`/applications/${storedId}/`);
            setAppId(storedId);
            setAppData(res.data);
            return;
          } catch {
            localStorage.removeItem('kyc_app_id');
          }
        }

        // Fetch all merchant applications
        const listRes = await api.get('/applications/');
        const apps = Array.isArray(listRes.data) ? listRes.data : [];

        // Prefer editable states
        const active = apps.find(a => ['draft', 'more_info_requested'].includes(a.status));
        const latest = apps.sort((a, b) => b.id - a.id)[0];
        const target = active || latest;

        if (target) {
          const detailRes = await api.get(`/applications/${target.id}/`);
          localStorage.setItem('kyc_app_id', String(target.id));
          setAppId(String(target.id));
          setAppData(detailRes.data);
        } else {
          // No application yet — create one
          const createRes = await api.post('/applications/');
          const newId = String(createRes.data.id);
          localStorage.setItem('kyc_app_id', newId);
          setAppId(newId);
          setAppData(createRes.data);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []); // mount only

  const refreshApp = useCallback(async () => {
    const id = appId || localStorage.getItem('kyc_app_id');
    if (!id) return null;
    try {
      const res = await api.get(`/applications/${id}/`);
      setAppData(res.data);
      return res.data;
    } catch {
      return null;
    }
  }, [appId]);

  return { appId, appData, loading, error, refreshApp };
}
