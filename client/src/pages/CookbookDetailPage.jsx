import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import { GRADS, grad } from '../lib/shared';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Input from '../components/ui/Input';
import { logout } from '../lib/auth';

export default function CookbookDetailPage() {
  const { cookbookId } = useParams();
  const nav = useNavigate();
  const [cookbook, setCookbook] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState('private');
  const [saving, setSaving] = useState(false);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [expiresDays, setExpiresDays] = useState(7);
  const [inviteRole, setInviteRole] = useState('reader');
  const [inviteSt, setInviteSt] = useState({ err: '', ok: '', busy: false });
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      nav('/login', { replace: true });
      return;
    }

    const load = async () => {
      try {
        setBusy(true);

        let uid = null;
        try {
          const me = await apiFetch('/users/me');
          uid = me.id;
          setCurrentUserId(uid);
        } catch {
          uid = null;
        }

        const cb = await apiFetch(`/cookbooks/${cookbookId}`);
        setCookbook(cb);

        const recipesData = await apiFetch(`/recipes?scope=cookbook&cookbook_id=${cookbookId}`);
        setRecipes(recipesData);

        try {
          const membersData = await apiFetch(`/cookbooks/${cookbookId}/members`);
          setMembers(membersData);
          const ownerMember = membersData.find((m) => m.role === 'owner');
          const isCurrentUserOwner = ownerMember && ownerMember.user_id === uid;
          setIsOwner(isCurrentUserOwner);
          if (isCurrentUserOwner) {
            try {
              const invs = await apiFetch(`/cookbooks/${cookbookId}/invitations`);
              setInvitations(invs.filter((i) => i.status === 'pending'));
            } catch {
              setInvitations([]);
            }
          }
        } catch {
          setMembers([]);
        }
      } catch (e) {
        setErr(e.message || 'Erreur lors du chargement.');
      } finally {
        setBusy(false);
      }
    };

    load();
  }, [cookbookId, nav]);

  const save = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      setSaving(true);
      const updated = await apiFetch(`/cookbooks/${cookbookId}`, {
        method: 'PATCH',
        body: {
          name: editName.trim(),
          description: editDescription.trim() || null,
          visibility: editVisibility,
        },
      });
      setCookbook(updated);
      setShowEditForm(false);
    } catch (e) {
      setErr(e.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!window.confirm('Supprimer ce cookbook ainsi que toutes ses recettes ?')) return;
    try {
      await apiFetch(`/cookbooks/${cookbookId}`, { method: 'DELETE' });
      nav('/cookbooks', { replace: true });
    } catch (e) {
      setErr(e.message || 'Erreur lors de la suppression');
    }
  };

  const send = async (e) => {
    e.preventDefault();
    setInviteSt({ err: '', ok: '', busy: false });

    try {
      setInviteSt({ err: '', ok: '', busy: true });
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresDays);

      const inv = await apiFetch(`/cookbooks/${cookbookId}/invitations`, {
        method: 'POST',
        body: {
          role_assigned: inviteRole,
          expires_at: expiresAt.toISOString(),
        },
      });

      setInvitations((prev) => [...prev, inv]);
      setInviteSt({ err: '', ok: `Invitation créée ! Token: ${inv.token}`, busy: false });
      setShowInviteForm(false);
    } catch (e) {
      setInviteSt({ err: e.message || 'Erreur lors de la creation de l\'invitation', ok: '', busy: false });
    }
  };

  if (busy) {
    return (
      <>
        <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}><p>Chargement...</p></div>
      </>
    );
  }

  if (err || !cookbook) {
    return (
      <>
        <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-border-error)' }}>{err || 'Cookbook introuvable.'}</p>
          <Link to="/cookbooks"><Button variant="primary">Mes cookbooks</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container" style={{ padding: '40px 0' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                color: 'var(--color-text-primary)',
                marginBottom: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{cookbook.name}</h1>
              {cookbook.description && (
                <p style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{cookbook.description}</p>
              )}
              <Tag variant={cookbook.visibility === 'public' ? 'secondary' : 'muted'}>
                {cookbook.visibility === 'public' ? 'Public' : 'Privé'}
              </Tag>
              {isOwner && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => {
                    setEditName(cookbook.name);
                    setEditDescription(cookbook.description || '');
                    setEditVisibility(cookbook.visibility);
                    setShowEditForm(!showEditForm);
                  }}>
                    {showEditForm ? 'Annuler' : 'Modifier'}
                  </Button>
                  <Button variant="ghost" style={{ color: 'var(--color-border-error)' }} onClick={del}>
                    Supprimer
                  </Button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
              <Link to={`/recipes/new?cookbook_id=${cookbookId}`}>
                <Button variant="primary">Nouvelle recette</Button>
              </Link>
            </div>
          </div>
        </div>

        {isOwner && showEditForm && (
          <Card style={{ padding: 'var(--space-xl)', marginBottom: '24px' }}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ color: 'var(--color-primary)', margin: 0 }}>Modifier le cookbook</h3>
              <Input label="Nom" placeholder="Nom du cookbook" value={editName}
                onChange={(e) => setEditName(e.target.value)} disabled={saving} required />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="ui-form-label">Description</label>
                <textarea className="ui-form-input" placeholder="Optionnel..." value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)} disabled={saving} rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="ui-form-label">Visibilité</label>
                <select className="ui-form-input" value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value)} disabled={saving} style={{ cursor: 'pointer' }}>
                  <option value="private">Prive</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {recipes.length > 0 && (
          <section style={{ marginTop: '32px' }}>
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '16px' }}>Recettes ({recipes.length})</h3>
            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <Link to={`/recipes/${recipe.id}`} key={recipe.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Card className="ui-card-interactive" style={{ textAlign: 'left', cursor: 'pointer' }}>
                    <div
                      className="recipe-card-img-wrapper"
                      style={{
                        background: recipe.image_url
                          ? `url(${recipe.image_url}) center/cover no-repeat`
                          : grad(recipe.id),
                      }}
                    >
                      {recipe.image_url && (
                        <img src={recipe.image_url} alt={recipe.title} className="recipe-card-img" style={{ opacity: 0 }} />
                      )}
                    </div>
                    <div style={{ padding: 'var(--space-lg)' }}>
                      <h4 style={{
                        color: 'var(--color-text-primary)',
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{recipe.title}</h4>
                      {recipe.description && (
                        <p style={{
                          color: 'var(--color-text-muted)',
                          fontSize: 'var(--font-size-sm)',
                          marginBottom: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {recipe.description}
                        </p>
                      )}
                      <div className="recipe-card-meta">
                        {recipe.prep_time_minutes && <span>{recipe.prep_time_minutes} min prép.</span>}
                        {recipe.cook_time_minutes && <span>{recipe.cook_time_minutes} min cuisson</span>}
                        {recipe.servings && <span>{recipe.servings} pers.</span>}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {recipes.length === 0 && (
          <Card style={{ padding: '48px', textAlign: 'center', marginTop: '32px' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Aucune recette dans ce cookbook.</p>
            <Link to={`/recipes/new?cookbook_id=${cookbookId}`}>
              <Button variant="primary" style={{ marginTop: '12px' }}>Ajouter une recette</Button>
            </Link>
          </Card>
        )}

        {members.length > 0 && (
          <section style={{ marginTop: '32px' }}>
            <Card style={{ padding: 'var(--space-xl)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <h3 style={{ color: 'var(--color-primary)', margin: 0 }}>Membres ({members.length})</h3>
                {isOwner && (
                  <Button variant="secondary" onClick={() => setShowInviteForm(!showInviteForm)}>
                    {showInviteForm ? 'Annuler' : 'Inviter'}
                  </Button>
                )}
              </div>

              {isOwner && showInviteForm && (
                <form
                  onSubmit={send}
                  style={{
                    padding: '16px',
                    marginBottom: '16px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Créer une invitation</h4>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px', minWidth: '140px' }}>
                      <label className="ui-form-label">Expire dans (jours)</label>
                      <input
                        type="number"
                        className="ui-form-input"
                        value={expiresDays}
                        onChange={(e) => setExpiresDays(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        disabled={inviteSt.busy}
                      />
                    </div>
                    <div style={{ flex: '1 1 160px', minWidth: '120px' }}>
                      <label className="ui-form-label">Role attribue</label>
                      <select
                        className="ui-form-input"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        disabled={inviteSt.busy}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="reader">Lecteur</option>
                        <option value="editor">Editeur</option>
                      </select>
                    </div>
                    <Button type="submit" variant="primary" disabled={inviteSt.busy} style={{ alignSelf: 'flex-end' }}>
                      {inviteSt.busy ? 'Création...' : 'Créer le lien'}
                    </Button>
                  </div>

                  {inviteSt.err && (
                    <p style={{ color: 'var(--color-border-error)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                      {inviteSt.err}
                    </p>
                  )}
                </form>
              )}

              {inviteSt.ok && (
                <div style={{
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: 'var(--color-success-bg, #e6f7e6)',
                  border: '1px solid var(--color-success, #2ecc71)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  wordBreak: 'break-all',
                }}>
                  {inviteSt.ok}
                </div>
              )}

              {invitations.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    Invitations en attente ({invitations.length})
                  </p>
                  {invitations.map((inv) => (
                    <div key={inv.id} style={{
                      padding: '8px 12px',
                      marginBottom: '4px',
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      wordBreak: 'break-all',
                    }}>
                      <span>
                        <Tag variant="secondary" style={{ marginRight: '8px' }}>{inv.role_assigned}</Tag>
                        <code style={{ fontSize: '0.85em' }}>{inv.token.substring(0, 12)}...</code>
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85em' }}>
                        Expire le {new Date(inv.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {members.map((member) => (
                  <li key={member.user_id} style={{
                    padding: '8px 0',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      minWidth: 0,
                    }}>
                      {member.user?.display_name || member.user?.email || 'Membre inconnu'}
                    </span>
                    <Tag variant={member.role === 'owner' ? 'primary' : 'secondary'} style={{ flexShrink: 0, marginLeft: '8px' }}>
                      {member.role === 'owner' ? 'Proprietaire' : member.role === 'editor' ? 'Editeur' : 'Lecteur'}
                    </Tag>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        <div style={{ marginTop: '32px' }}>
          <Link to="/cookbooks">
            <Button variant="secondary">Retour aux cookbooks</Button>
          </Link>
        </div>
      </div>
    </>
  );
}