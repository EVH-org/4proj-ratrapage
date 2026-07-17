import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken } from '../lib/api';
import { register } from '../lib/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const go = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await register(email, password, { display_name: displayName || null });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Impossible de créer le compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem var(--space-xl)',
        backgroundColor: 'var(--color-bg-page)',
      }}
    >
      <Card style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--color-primary)', marginTop: '0.5rem' }}>Inscription</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Rejoignez la communauté !
          </p>
        </div>

        <form onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Nom d'affichage (Optionnel)"
            type="text"
            placeholder="Gaston"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Adresse e-mail *"
            type="email"
            placeholder="gaston@cuisine.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            label="Mot de passe *"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          {error && (
            <div
              style={{
                color: 'var(--color-border-error)',
                backgroundColor: 'var(--color-error-bg)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                border: '1px solid var(--color-border-error)',
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Création...' : 'S’inscrire'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Déjà inscrit ? </span>
          <Link to="/login" style={{ fontWeight: 'var(--font-weight-semibold)', textDecoration: 'underline' }}>
            Se connecter
          </Link>
        </div>
      </Card>
    </div>
  );
}
