import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Input from '../components/ui/Input';
import { apiFetch, getToken } from '../lib/api';

export default function CookbooksPage() {
  const [cookbooks, setCookbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchCookbooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch('/cookbooks');
        setCookbooks(data);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des cookbooks.');
      } finally {
        setLoading(false);
      }
    };

    fetchCookbooks();
  }, [navigate]);

  const filteredCookbooks = cookbooks.filter((cb) =>
    cb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="container page-enter" style={{ padding: '40px 0', textAlign: 'center' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Mes Cookbooks</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Retrouvez tous vos carnets de recettes partages ou personnels.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/cookbooks/new">
              <Button variant="primary">
                Nouveau cookbook
              </Button>
            </Link>
            <Link to="/recipes">
              <Button variant="secondary">
                Mes recettes
              </Button>
            </Link>
            <Link to="/recipes/new">
              <Button variant="secondary">
                Nouvelle recette
              </Button>
            </Link>
          </div>
        </header>

        <div style={{ maxWidth: '500px', margin: '0 auto 32px' }} className="ui-form-group">
          <Input
            type="text"
            placeholder="Rechercher un cookbook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
        </div>

        {loading && (
          <div className="stagger-grid" style={gridStyle}>
            {[...Array(3)].map((_, index) => (
              <Card key={index} style={{ padding: 0, overflow: 'hidden', minHeight: '120px' }}>
                <div style={{ padding: '24px' }}>
                  <div className="skeleton-box" style={{ width: '70%', height: '24px', marginBottom: '12px', borderRadius: 'var(--radius-sm)' }}></div>
                  <div className="skeleton-box" style={{ width: '50%', height: '16px', borderRadius: 'var(--radius-sm)' }}></div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}

        {!loading && !error && filteredCookbooks.length === 0 && (
          <Card style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Aucun cookbook trouve. Creez-en un pour commencer !
            </p>
          </Card>
        )}

        {!loading && !error && filteredCookbooks.length > 0 && (
          <div className="stagger-grid" style={gridStyle}>
            {filteredCookbooks.map((cb) => (
              <Card key={cb.id} className="ui-card-interactive" style={{ padding: '24px', textAlign: 'left', position: 'relative' }}>
                <Link to={`/cookbooks/${cb.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{cb.name}</h3>
                </Link>
                {cb.description && (
                  <p style={{
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--font-size-sm)',
                    marginTop: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {cb.description}
                  </p>
                )}
                <div style={{ marginTop: '12px' }}>
                  <Tag variant={cb.visibility === 'public' ? 'primary' : 'secondary'} style={{ marginRight: '8px' }}>
                    {cb.visibility === 'public' ? 'Public' : 'Prive'}
                  </Tag>
                </div>
                <Link to={`/cookbooks/${cb.id}`} style={{ position: 'absolute', top: '16px', right: '16px' }}>
                  <Button variant="ghost" style={{ padding: '8px', minWidth: 'unset', height: 'unset' }}>
                    Ouvrir
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 'var(--space-xl)',
  padding: '20px 0'
};
