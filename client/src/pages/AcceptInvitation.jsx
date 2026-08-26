import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Tag from '../components/ui/Tag';

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [invitationInfo, setInvitationInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      navigate('/login?redirect=' + encodeURIComponent('/invite/' + token), { replace: true });
      return;
    }

    const load = async () => {
      try {
        const info = await apiFetch(`/invitations/${token}`);
        setInvitationInfo(info);
        setStatus('idle');
      } catch (e) {
        setError(e.message || 'Invitation introuvable ou expirée');
        setStatus('error');
      }
    };

    load();
  }, [token, navigate]);

  const accept = async () => {
    setStatus('busy');
    try {
      await apiFetch(`/invitations/${token}/accept`, { method: 'POST' });
      setStatus('done');
    } catch (e) {
      setError(e.message || 'Erreur');
      setStatus('error');
    }
  };

  const decline = async () => {
    setStatus('busy');
    try {
      await apiFetch(`/invitations/${token}/decline`, { method: 'POST' });
      setStatus('declined');
    } catch (e) {
      setError(e.message || 'Erreur');
      setStatus('error');
    }
  };

  if (status === 'loading') return null;

  const roleLabel = (r) => r === 'editor' ? 'Editeur' : 'Lecteur';

  return (
    <div className="container" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <Card style={{ padding: 'var(--space-xl)' }}>
        {status === 'idle' && invitationInfo && (
          <>
            <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '12px' }}>Invitation à un cookbook</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Vous avez été invité à rejoindre <strong>{invitationInfo.cookbook_name}</strong> en tant que <Tag variant="secondary">{roleLabel(invitationInfo.role_assigned)}</Tag>.
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '24px' }}>
              Cette invitation expire le {new Date(invitationInfo.expires_at).toLocaleDateString()}.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button variant="primary" onClick={accept}>
                Accepter l'invitation
              </Button>
              <Button variant="ghost" style={{ color: 'var(--color-border-error)' }} onClick={decline}>
                Décliner
              </Button>
            </div>
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

        {status === 'declined' && (
          <>
            <h2 style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>Invitation déclinée</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Vous avez refusé cette invitation.
            </p>
            <Link to="/cookbooks">
              <Button variant="secondary">Mes cookbooks</Button>
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