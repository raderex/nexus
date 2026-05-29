
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ERP from './pages/ERP';
import CRM from './pages/CRM';
import HRM from './pages/HRM';
import ATS from './pages/ATS';
import PM from './pages/PM';
import Tracking from './pages/Tracking';
import Social from './pages/Social';
import Settings from './pages/Settings';

function Protected({ children }) {
  const token = useStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { theme } = useStore();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="erp/*" element={<ERP />} />
        <Route path="crm/*" element={<CRM />} />
        <Route path="hrm/*" element={<HRM />} />
        <Route path="ats/*" element={<ATS />} />
        <Route path="projects/*" element={<PM />} />
        <Route path="tracking/*" element={<Tracking />} />
        <Route path="social/*" element={<Social />} />
        <Route path="settings/*" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
