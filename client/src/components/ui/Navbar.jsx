import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../lib/auth';
import { getToken } from '../../lib/api';
import { ChevronDown, X } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [tok, setTok] = useState(getToken());
  const [me, setMe] = useState(false);
  const [bur, setBur] = useState(false);

  useEffect(() => {
    setTok(getToken());
    setBur(false);
  }, [loc]);

  const goOut = () => {
    logout();
    setTok(null);
    setMe(false);
    setBur(false);
    navigate('/login');
  };

  const links = tok ? [
    { to: '/profile', label: 'Profil' },
    { to: '/recipes', label: 'Global' },
    { to: '/my-recipes', label: 'Mes Recettes' },
    { to: '/planning', label: 'Planning' },
    { to: '/cookbooks', label: 'Cookbooks' },
  ] : [];

  return (
    <nav style={navStyle}>
      <Link to="/" style={logoStyle} className="hover-scale">
        SUPMEAL
      </Link>

      <div className="nav-links-desktop" style={menuStyle}>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-link ${loc.pathname === l.to ? 'nav-link-active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="nav-account-desktop" style={{ position: 'relative' }}>
          {tok ? (
            <>
              <button
                onClick={() => setMe(!me)}
                className="ui-btn ui-btn-secondary"
                style={{
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>Mon compte</span>
                <ChevronDown size={12}
                  style={{
                    transform: me ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </button>

              {me && (
                <div style={dropdownStyle} className="animate-fade-in-down">
                  <Link
                    to="/recipes/new"
                    style={dropdownLinkStyle}
                    onClick={() => setMe(false)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Nouvelle recette
                  </Link>
                  <Link
                    to="/cookbooks/new"
                    style={dropdownLinkStyle}
                    onClick={() => setMe(false)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Nouveau cookbook
                  </Link>
                  <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                  <button
                    onClick={goOut}
                    style={dropdownBtnStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-error-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="nav-auth-desktop" style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login">
                <button
                  className="ui-btn ui-btn-secondary"
                  style={{ padding: '8px 16px', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                >
                  Connexion
                </button>
              </Link>
              <Link to="/register">
                <button
                  className="ui-btn ui-btn-primary"
                  style={{ padding: '8px 16px', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(226, 62, 42, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Inscription
                </button>
              </Link>
            </div>
          )}
        </div>

        <button
          className="nav-burger-btn"
          onClick={() => setBur(!bur)}
          style={burgerBtnStyle}
          aria-label="Menu"
        >
          <span style={{
            display: 'block', width: '24px', height: '2px',
            background: 'var(--color-text-primary)', borderRadius: '2px', transition: 'all 0.3s ease', transformOrigin: 'center',
            ...(bur ? { transform: 'translateY(7px) rotate(45deg)' } : {})
          }} />
          <span style={{
            display: 'block', width: '24px', height: '2px',
            background: 'var(--color-text-primary)', borderRadius: '2px', transition: 'all 0.3s ease', transformOrigin: 'center',
            ...(bur ? { opacity: 0 } : {})
          }} />
          <span style={{
            display: 'block', width: '24px', height: '2px',
            background: 'var(--color-text-primary)', borderRadius: '2px', transition: 'all 0.3s ease', transformOrigin: 'center',
            ...(bur ? { transform: 'translateY(-7px) rotate(-45deg)' } : {})
          }} />
        </button>
      </div>

      {bur && (
        <div className="nav-mobile-overlay" style={mobileOverlayStyle} onClick={() => setBur(false)}>
          <div className="nav-mobile-panel animate-slide-in-right" style={mobilePanelStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>SUPMEAL</span>
              <button onClick={() => setBur(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>

            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  ...mobileLinkStyle,
                  color: loc.pathname === l.to ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontWeight: loc.pathname === l.to ? 700 : 400,
                }}
                onClick={() => setBur(false)}
              >
                {l.label}
              </Link>
            ))}

            <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '12px 0' }} />

            {tok ? (
              <>
                <Link to="/recipes/new" style={mobileLinkStyle} onClick={() => setBur(false)}>
                  Nouvelle recette
                </Link>
                <Link to="/cookbooks/new" style={mobileLinkStyle} onClick={() => setBur(false)}>
                  Nouveau cookbook
                </Link>
                <button onClick={goOut} style={{ ...mobileLinkStyle, color: 'var(--color-border-error)', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: 'var(--font-size-base)', padding: '12px 0' }}>
                  Se déconnecter
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <Link to="/login" onClick={() => setBur(false)}>
                  <button className="ui-btn ui-btn-secondary" style={{ width: '100%', padding: '10px 16px' }}>Connexion</button>
                </Link>
                <Link to="/register" onClick={() => setBur(false)}>
                  <button className="ui-btn ui-btn-primary" style={{ width: '100%', padding: '10px 16px' }}>Inscription</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 20px',
  borderBottom: '1px solid var(--color-border-subtle)',
  background: 'var(--color-bg-surface)',
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

const logoStyle = {
  fontSize: 'var(--font-size-xl)',
  fontWeight: 'var(--font-weight-bold)',
  color: 'var(--color-primary)',
  textDecoration: 'none',
  letterSpacing: '-0.5px',
  transition: 'opacity 0.2s ease',
  display: 'inline-block',
};

const menuStyle = {
  display: 'flex',
  gap: 'var(--space-lg)',
};

const dropdownStyle = {
  position: 'absolute',
  top: '45px',
  right: '0',
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-lg)',
  display: 'flex',
  flexDirection: 'column',
  width: '180px',
  zIndex: 100,
  padding: '8px 0',
};

const dropdownLinkStyle = {
  padding: '10px 16px',
  textDecoration: 'none',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)',
  textAlign: 'left',
  display: 'block',
  transition: 'background 0.2s',
};

const dropdownBtnStyle = {
  padding: '10px 16px',
  color: 'var(--color-border-error)',
  fontSize: 'var(--font-size-sm)',
  textAlign: 'left',
  width: '100%',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  transition: 'background 0.2s',
};

const burgerBtnStyle = {
  display: 'none',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '5px',
  width: '40px',
  height: '40px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  zIndex: 60,
};

const mobileOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 55,
};

const mobilePanelStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: '280px',
  maxWidth: '85vw',
  height: '100vh',
  background: 'var(--color-bg-surface)',
  padding: '24px 20px',
  overflowY: 'auto',
  boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
  zIndex: 56,
};

const mobileLinkStyle = {
  display: 'block',
  padding: '12px 0',
  textDecoration: 'none',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-base)',
  borderBottom: '1px solid var(--color-border-subtle)',
  transition: 'color 0.2s',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.4rem',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  padding: '4px 8px',
};