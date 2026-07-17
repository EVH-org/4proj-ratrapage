import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken } from '../lib/api';
import { login } from '../lib/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { ChefHat } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      navigate('/cookbooks', { replace: true });
      return;
    }

    if (import.meta.env.DEV && window.location.href.includes('autologin')) {
      setEmail('testchef@cuisine.fr');
      setPassword('chefpassword');
      setLoading(true);
      login('testchef@cuisine.fr', 'chefpassword')
        .then(() => {
          navigate('/cookbooks', { replace: true });
        })
        .catch((err) => {
          setError(err.message || 'Erreur d\'auto-connexion');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [navigate]);

  const go = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem var(--space-xl)',
        backgroundColor: 'var(--color-bg-page)',
      }}
    >
      <Card
        className="animate-fade-in-scale"
        style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-xl)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <ChefHat size={48} color="var(--color-primary)" className="animate-bounce-in" style={{ marginBottom: '8px' }} />
          <h2 style={{ color: 'var(--color-primary)', marginTop: '0.5rem' }}>Connexion</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Heureux de vous revoir ! {window.location.href.includes('autologin') ? " (autologin détecté)" : " (pas d'autologin)"}
          </p>
        </div>

        <form onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Adresse e-mail"
            type="email"
            placeholder="chef@cuisine.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>

          {import.meta.env.DEV && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEmail('testchef@cuisine.fr');
                setPassword('chefpassword');
                setLoading(true);
                login('testchef@cuisine.fr', 'chefpassword')
                  .then(() => {
                    navigate('/cookbooks', { replace: true });
                  })
                  .catch((err) => {
                    setError(err.message || 'Erreur d\'auto-connexion');
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
              style={{
                marginTop: '0.25rem',
                border: '1px dashed var(--color-primary)',
                color: 'var(--color-primary)',
              }}
              disabled={loading}
            >
              ⚡ Connexion Rapide (Dev)
            </Button>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Pas encore de compte ? </span>
          <Link to="/register" style={{ fontWeight: 'var(--font-weight-semibold)', textDecoration: 'underline' }}>
            Créer un compte
          </Link>
        </div>
      </Card>
    </div>
  );
}
