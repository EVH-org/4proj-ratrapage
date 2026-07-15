import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function CookbookCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');

  async function go(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await apiFetch('/cookbooks', {
        method: 'POST',
        body: {
          name: name.trim(),
          description: description.trim() || null,
          visibility,
        },
      });
      navigate('/cookbooks', { replace: true });
    } catch (err) {
      setError(err.message || 'Erreur lors de la creation');
    } finally {
      setLoading(false);
    }
  }

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
      <Card style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--color-primary)', marginTop: '0.5rem' }}>Nouveau cookbook</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Créez un carnet de recettes
          </p>
        </div>

        <form onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Nom"
            placeholder="Mes meilleures recettes"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="ui-form-label">Description</label>
            <textarea
              className="ui-form-input"
              placeholder="Optionnel..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="ui-form-label">Visibilité</label>
            <select
              className="ui-form-input"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              <option value="private">Privé</option>
              <option value="public">Public</option>
            </select>
          </div>

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

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Création...' : 'Créer le cookbook'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}