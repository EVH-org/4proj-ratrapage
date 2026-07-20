import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [cookbookName, setCookbookName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      navigate('/login?redirect=' + encodeURIComponent('/invite/' + token), { replace: true });
      return;
    }
    setStatus('idle');
  }, [token, navigate]);

  const accept = async () => {
    setStatus('busy');
    try {
      const res = await apiFetch(`/invitations/${token}/accept`, { method: 'POST' });
      setCookbookName(res.cookbook_id || '');
      setStatus('done');
    } catch (e) {
      setError(e.message || 'Erreur');
      setStatus('error');
    }
  };

  if (status === 'loading') return null;

  return (
    <div className="container" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <Card style={{ padding: 'var(--space-xl)' }}>
        {status === 'idle' && (
          <>
            <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '12px' }}>Invitation à un cookbook</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Vous avez été invité à rejoindre un cookbook. Cliquez ci-dessous pour accepter.
            </p>
            <Button variant="primary" onClick={accept}>
              Accepter l'invitation
            </Button>
          </>
        )}

        {status === 'busy' && (
          <p style={{ color: 'var(--color-text-muted)' }}>Traitement en cours...</p>
        )}

        {status === 'done' && (
          <>
            <h2 style={{ color: 'var(--color-accent-fresh)', marginBottom: '12px' }}>Invitation acceptée !</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Vous avez rejoint le cookbook avec succès.
            </p>
            <Link to="/cookbooks">
              <Button variant="primary">Voir mes cookbooks</Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 style={{ color: 'var(--color-border-error)', marginBottom: '12px' }}>Erreur</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>{error}</p>
            <Link to="/cookbooks">
              <Button variant="secondary">Mes cookbooks</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}