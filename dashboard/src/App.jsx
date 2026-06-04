import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import TopologyPage from './pages/TopologyPage';
import ServicesPage from './pages/ServicesPage';
import MetricsPage from './pages/MetricsPage';
import LogsPage from './pages/LogsPage';            
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/topology" replace />} />
        <Route path="topology" element={<TopologyPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="metrics" element={<MetricsPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
    </Routes>
  );
}

export default App;