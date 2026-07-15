import React from 'react';
import { Outlet } from 'react-router-dom';
import './styles/theme.css';
import './styles/globals.css';
import './styles/animations.css';

export default function App() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
      <Outlet />
    </div>
  );
}