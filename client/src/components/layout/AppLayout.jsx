import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../ui/Navbar';

export default function AppLayout() {
  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <Navbar />
      <Outlet />
    </div>
  );
}