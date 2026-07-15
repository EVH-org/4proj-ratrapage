import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const load = async () => {
      try {
        setBusy(true);
        setErr(null);
        const data = await apiFetch('/users/me');
        setUser(data);
      } catch (err) {
        setErr(err.message || 'Erreur lors du chargement du profil.');
      } finally {
        setBusy(false);
      }
    };

    load();
  }, [navigate]);

  return (
    <>
      <div className="container" style={{ padding: '40px 20px' }}>
        <header style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Mon Profil</h1>
        </header>

        {busy && (
          <Card style={{ padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: '60%', height: '24px', backgroundColor: 'var(--color-bg-disabled)', borderRadius: 'var(--radius-sm)', margin: '0 auto 16px' }} />
            <div style={{ width: '40%', height: '18px', backgroundColor: 'var(--color-bg-disabled)', borderRadius: 'var(--radius-sm)', margin: '0 auto' }} />
          </Card>
        )}

        {err && (
          <Card style={{ padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-border-error)' }}>{err}</p>
          </Card>
        )}

        {!busy && !err && user && (
          <div className="page-enter">
            <Card style={{ padding: '32px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-inverse)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: '0 auto 20px',
                }}
              >
                {(user.display_name || user.email || '?')[0].toUpperCase()}
              </div>
              <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '8px', fontSize: 'var(--font-size-xl)' }}>
                {user.display_name}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '24px' }}>
                {user.email}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/my-recipes">
                  <Button variant="primary">Mes Recettes</Button>
                </Link>
                <Link to="/recipes">
                  <Button variant="secondary">Recettes Globales</Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {!busy && !err && !user && (
          <Card style={{ padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Aucune information de profil disponible.</p>
          </Card>
        )}
      </div>
    </>
  );
}