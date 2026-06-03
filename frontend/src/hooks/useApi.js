import { useState, useEffect, useCallback, useRef } from 'react';

export function useApi(apiFn, deps = [], opts = {}) {
  const [data, setData] = useState(opts.initial ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const run = useCallback(async (...args) => {
    try {
      setLoading(true); setError(null);
      const res = await apiFn(...args);
      if (mounted.current) setData(res.data);
      return res.data;
    } catch (e) {
      if (mounted.current) setError(e?.response?.data?.detail || e?.message || 'Error');
    } finally { if (mounted.current) setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { data, loading, error, refetch: run, setData };
}

export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    try {
      setLoading(true); setError(null);
      const res = await apiFn(...args);
      return res.data;
    } catch (e) {
      const d = e?.response?.data;
      const msg = d?.detail || (d && Object.values(d)[0]?.[0]) || e?.message || 'Error';
      setError(msg); throw e;
    } finally { setLoading(false); }
  };
  return { mutate, loading, error, clearError: () => setError(null) };
}
